/* ============================================================
   Vextro Lyntra — Admin › Traffic (Google Analytics style)
   Reads Firestore collection: traffic_sessions
   ============================================================ */
(function () {
  'use strict';

  var STATE = { range: 7, sessions: [], loaded: false, loading: false, err: '' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function num(n) { return (n || 0).toLocaleString(); }
  function pct(n) { return (Math.round((n || 0) * 10) / 10) + '%'; }
  function dur(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    if (m >= 60) { var h = Math.floor(m / 60); return h + 'h ' + (m % 60) + 'm'; }
    return m + 'm ' + String(s).padStart(2, '0') + 's';
  }
  function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function flag(cc) {
    cc = (cc || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
    return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
  }
  function ago(ts) {
    var s = Math.max(0, Math.round((Date.now() - (ts || 0)) / 1000));
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  async function loadSessions(force) {
    if (STATE.loaded && !force) return STATE.sessions;
    STATE.loading = true; STATE.err = ''; STATE.localOnly = false;
    var map = null;
    window.__fsLastError = null;
    try { map = window.fsLoadMap ? await window.fsLoadMap('traffic_sessions') : null; } catch (e) { STATE.err = e.message || 'load failed'; }
    var fe = window.__fsLastError;
    if (fe && fe.collection === 'traffic_sessions') {
      STATE.err = 'Firestore read failed (HTTP ' + fe.status + ')' + (fe.status === 403 ? ' — traffic_sessions rules publish karein aur admin email se login karein.' : '');
    }
    var arr = map ? Object.keys(map).map(function (k) { return map[k]; }) : [];
    // local fallback so the tab never looks empty for the current browser
    if (!arr.length) {
      try { var loc = JSON.parse(localStorage.getItem('vl_last_session_doc') || 'null'); if (loc) { arr = [loc]; STATE.localOnly = true; } } catch (e) {}
    }

    arr.forEach(function (s) {
      s.start = Number(s.start) || 0;
      s.last = Number(s.last) || s.start;
      s.duration = Number(s.duration) || 0;
      s.pageviews = Number(s.pageviews) || (Array.isArray(s.pages) ? s.pages.length : 1);
      if (!Array.isArray(s.pages)) s.pages = [];
    });
    arr.sort(function (a, b) { return b.start - a.start; });
    STATE.sessions = arr; STATE.loaded = true; STATE.loading = false;
    return arr;
  }

  function inRange(s, days) {
    if (days === 0) return true;
    return s.start >= Date.now() - days * 86400000;
  }

  function compute(sessions, days) {
    var cur = sessions.filter(function (s) { return inRange(s, days); });
    var prevFrom = Date.now() - days * 2 * 86400000, prevTo = Date.now() - days * 86400000;
    var prev = days === 0 ? [] : sessions.filter(function (s) { return s.start >= prevFrom && s.start < prevTo; });

    function agg(list) {
      var users = {}, newUsers = 0, views = 0, totalDur = 0, bounced = 0;
      list.forEach(function (s) {
        users[s.visitorId || s.sessionId] = 1;
        if (s.isNewVisitor) newUsers++;
        views += s.pageviews || 1;
        totalDur += s.duration || 0;
        if ((s.pageviews || 1) <= 1) bounced++;
      });
      var sessionsN = list.length;
      return {
        users: Object.keys(users).length,
        newUsers: newUsers,
        sessions: sessionsN,
        views: views,
        viewsPerSession: sessionsN ? views / sessionsN : 0,
        avgDur: sessionsN ? totalDur / sessionsN : 0,
        bounce: sessionsN ? (bounced / sessionsN) * 100 : 0
      };
    }

    var a = agg(cur), b = agg(prev);
    var live = sessions.filter(function (s) { return (s.last || s.start) >= Date.now() - 5 * 60000; });
    var liveUsers = {}; live.forEach(function (s) { liveUsers[s.visitorId || s.sessionId] = 1; });

    // daily series
    var series = [];
    var span = days === 0 ? 30 : days;
    for (var i = span - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var k = dayKey(d);
      var day = cur.filter(function (s) { return dayKey(new Date(s.start)) === k; });
      var u = {}; day.forEach(function (s) { u[s.visitorId || s.sessionId] = 1; });
      series.push({ day: k, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), users: Object.keys(u).length, views: day.reduce(function (t, s) { return t + (s.pageviews || 1); }, 0), sessions: day.length });
    }

    function tally(fn) {
      var m = {};
      cur.forEach(function (s) {
        var vals = fn(s);
        (Array.isArray(vals) ? vals : [vals]).forEach(function (v) {
          if (!v) return;
          m[v] = m[v] || { key: v, count: 0, users: {} };
          m[v].count++;
          m[v].users[s.visitorId || s.sessionId] = 1;
        });
      });
      return Object.keys(m).map(function (k) { return { key: k, count: m[k].count, users: Object.keys(m[k].users).length }; })
        .sort(function (x, y) { return y.count - x.count; });
    }

    var pageMap = {};
    cur.forEach(function (s) {
      (s.pages && s.pages.length ? s.pages : [{ p: s.landing || '/', t: '' }]).forEach(function (p) {
        var k = p.p || '/';
        pageMap[k] = pageMap[k] || { key: k, title: p.t || '', count: 0, users: {} };
        pageMap[k].count++;
        pageMap[k].users[s.visitorId || s.sessionId] = 1;
        if (!pageMap[k].title && p.t) pageMap[k].title = p.t;
      });
    });
    var topPages = Object.keys(pageMap).map(function (k) { return { key: k, title: pageMap[k].title, count: pageMap[k].count, users: Object.keys(pageMap[k].users).length }; })
      .sort(function (x, y) { return y.count - x.count; });

    var hours = new Array(24).fill(0);
    cur.forEach(function (s) { hours[new Date(s.start).getHours()] += (s.pageviews || 1); });

    return {
      cur: cur, a: a, b: b, series: series, topPages: topPages, hours: hours,
      liveUsers: Object.keys(liveUsers).length, liveSessions: live,
      channels: tally(function (s) { return s.channel || 'Direct'; }),
      sources: tally(function (s) { return s.source || 'direct'; }),
      devices: tally(function (s) { return s.device || 'desktop'; }),
      browsers: tally(function (s) { return s.browser || 'Other'; }),
      os: tally(function (s) { return s.os || 'Other'; }),
      regions: tally(function (s) { return s.region || ''; }),
      countries: tally(function (s) { return s.country ? (flag(s.countryCode) + ' ' + s.country) : ''; }),
      cities: tally(function (s) { return s.city ? (s.city + (s.country ? ', ' + s.country : '')) : ''; }),
      landings: tally(function (s) { return s.landing || '/'; })
    };
  }

  function delta(cur, prev, invert) {
    if (!prev) return '';
    var d = ((cur - prev) / prev) * 100;
    var up = d >= 0;
    var good = invert ? !up : up;
    var color = Math.abs(d) < 0.5 ? '#94a3b8' : (good ? '#10b981' : '#ef4444');
    var icon = Math.abs(d) < 0.5 ? 'fa-minus' : (up ? 'fa-arrow-up' : 'fa-arrow-down');
    return '<span style="color:' + color + ';font-size:0.75rem;font-weight:700;"><i class="fa-solid ' + icon + '"></i> ' + Math.abs(Math.round(d)) + '%</span>';
  }

  function card(label, value, sub, icon, grad) {
    return '<div style="background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(15,23,42,0.04);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
      '<div style="font-size:0.72rem;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;color:#94a3b8;">' + esc(label) + '</div>' +
      '<div style="width:32px;height:32px;border-radius:9px;background:' + grad + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.8rem;"><i class="fa-solid ' + icon + '"></i></div></div>' +
      '<div style="font-size:1.7rem;font-weight:800;color:#0f172a;margin-top:8px;line-height:1.1;">' + value + '</div>' +
      '<div style="font-size:0.78rem;color:#64748b;margin-top:6px;display:flex;align-items:center;gap:6px;">' + sub + '</div></div>';
  }

  function lineChart(series) {
    var w = 900, h = 240, pad = 34;
    var max = Math.max(1, series.reduce(function (m, p) { return Math.max(m, p.views, p.users); }, 0));
    var n = Math.max(1, series.length - 1);
    function pts(key) {
      return series.map(function (p, i) {
        var x = pad + (i / n) * (w - pad * 2);
        var y = h - pad - (p[key] / max) * (h - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
    }
    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
      var y = h - pad - f * (h - pad * 2);
      return '<line x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '" stroke="rgba(15,23,42,0.07)" stroke-width="1"/>' +
        '<text x="6" y="' + (y + 4) + '" fill="#94a3b8" font-size="10">' + Math.round(max * f) + '</text>';
    }).join('');
    var step = Math.ceil(series.length / 8);
    var labels = series.map(function (p, i) {
      if (i % step !== 0 && i !== series.length - 1) return '';
      var x = pad + (i / n) * (w - pad * 2);
      return '<text x="' + x + '" y="' + (h - 8) + '" fill="#94a3b8" font-size="10" text-anchor="middle">' + esc(p.label) + '</text>';
    }).join('');
    var area = 'M' + pad + ',' + (h - pad) + ' L' + pts('views').split(' ').join(' L') + ' L' + (w - pad) + ',' + (h - pad) + ' Z';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:240px;display:block;">' +
      '<defs><linearGradient id="vlTrafGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6b35" stop-opacity="0.28"/><stop offset="100%" stop-color="#ff6b35" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#vlTrafGrad)"/>' +
      '<polyline points="' + pts('views') + '" fill="none" stroke="#ff6b35" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<polyline points="' + pts('users') + '" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/>' +
      labels + '</svg>';
  }

  function barsRow(list, total, color) {
    if (!list.length) return '<div style="color:#94a3b8;font-size:0.85rem;padding:10px 0;">No data yet</div>';
    return list.slice(0, 8).map(function (r) {
      var p = total ? (r.count / total) * 100 : 0;
      return '<div style="margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;gap:10px;font-size:0.83rem;margin-bottom:5px;"><span style="color:#334155;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(r.key) + '</span><span style="color:#64748b;font-weight:700;flex-shrink:0;">' + num(r.count) + '</span></div>' +
        '<div style="height:7px;border-radius:99px;background:rgba(15,23,42,0.06);overflow:hidden;"><div style="height:100%;width:' + Math.max(3, p) + '%;background:' + color + ';border-radius:99px;"></div></div>' +
        '</div>';
    }).join('');
  }

  function panel(title, inner, right) {
    return '<div style="background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(15,23,42,0.04);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">' +
      '<h3 style="margin:0;font-size:1rem;font-weight:800;color:#0f172a;">' + title + '</h3>' + (right || '') + '</div>' + inner + '</div>';
  }

  function hourChart(hours) {
    var max = Math.max(1, Math.max.apply(null, hours));
    return '<div style="display:flex;align-items:flex-end;gap:3px;height:110px;">' + hours.map(function (v, i) {
      var hp = Math.max(3, (v / max) * 100);
      return '<div title="' + i + ':00 — ' + v + ' views" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;">' +
        '<div style="height:' + hp + '%;background:linear-gradient(180deg,#3b82f6,#93c5fd);border-radius:4px 4px 0 0;"></div></div>';
    }).join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;color:#94a3b8;font-size:0.7rem;margin-top:6px;"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>';
  }

  window.vlTrafficSetRange = async function (days) {
    STATE.range = days;
    var content = document.getElementById('adminContent');
    if (content) await window.renderAdminTrafficNew(content);
  };
  window.vlTrafficRefresh = async function (silent) {
    var content = document.getElementById('adminContent');
    if (content && !silent) { content.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:14px;">Loading traffic data…</p></div>'; }
    await loadSessions(true);
    STATE.silent = !!silent;
    if (content) await window.renderAdminTrafficNew(content);
    STATE.silent = false;
  };

  // REALTIME: har 15 second Firestore se fresh data, jab tak Traffic tab khula ho
  if (!window.__vlTrafficPoll) {
    window.__vlTrafficPoll = setInterval(function () {
      var active = document.querySelector('.admin-sidebar-item.active');
      if (!active || active.getAttribute('data-view') !== 'adminTraffic') return;
      if (document.hidden) return;
      if (document.getElementById('adminModalOverlay')) return;
      window.vlTrafficRefresh(true);
    }, 15000);
  }
  window.vlTrafficClearOld = async function () {
    if (!confirm('Delete traffic sessions older than 90 days?')) return;
    var cut = Date.now() - 90 * 86400000, del = 0;
    for (var i = 0; i < STATE.sessions.length; i++) {
      var s = STATE.sessions[i];
      if (s.start && s.start < cut && s.sessionId && window.fsDeleteDoc) {
        try { await window.fsDeleteDoc('traffic_sessions', s.sessionId); del++; } catch (e) {}
      }
    }
    alert('Deleted ' + del + ' old sessions.');
    await window.vlTrafficRefresh();
  };

  window.renderAdminTrafficNew = async function (content) {
    if (!STATE.silent) content.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:14px;">Loading traffic data…</p></div>';
    var sessions = await loadSessions(false);
    var m = compute(sessions, STATE.range);
    var ranges = [[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All time']];
    var rangeBtns = ranges.map(function (r) {
      var on = STATE.range === r[0];
      return '<button onclick="vlTrafficSetRange(' + r[0] + ')" style="padding:8px 14px;border-radius:9px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid ' + (on ? '#ff6b35' : 'rgba(15,23,42,0.12)') + ';background:' + (on ? 'linear-gradient(135deg,#ff6b35,#f7931e)' : '#fff') + ';color:' + (on ? '#fff' : '#475569') + ';">' + r[1] + '</button>';
    }).join('');

    var totalSessions = m.a.sessions || 0;

    var recentRows = m.cur.slice(0, 25).map(function (s) {
      var lastPage = (s.pages && s.pages.length ? s.pages[s.pages.length - 1].p : s.landing) || '/';
      var isLive = (s.last || s.start) >= Date.now() - 5 * 60000;
      var liveDot = isLive
        ? '<span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.18);"></span>' : '';
      var loc = (s.country ? flag(s.countryCode) + ' ' + s.country : 'Unknown location') + (s.city ? ' · ' + s.city : '');
      return '<tr>' +
        '<td>' + liveDot + ' <span style="font-weight:700;color:#0f172a;">' + esc(s.email || (s.isNewVisitor ? 'New visitor' : 'Returning visitor')) + '</span><div style="color:#94a3b8;font-size:0.75rem;">' + esc(s.tz || '') + '</div></td>' +
        '<td>' + esc(loc) + (s.isp ? '<div style="color:#94a3b8;font-size:0.75rem;">' + esc(s.isp) + '</div>' : '') + '</td>' +
        '<td>' + esc(lastPage) + '</td>' +
        '<td>' + esc(s.channel || 'Direct') + '<div style="color:#94a3b8;font-size:0.75rem;">' + esc(s.source || 'direct') + '</div></td>' +
        '<td style="text-transform:capitalize;">' + esc(s.device || '') + '<div style="color:#94a3b8;font-size:0.75rem;">' + esc(s.browser || '') + ' · ' + esc(s.os || '') + '</div></td>' +
        '<td>' + num(s.pageviews) + '</td>' +
        '<td>' + dur(s.duration) + '</td>' +
        '<td style="white-space:nowrap;">' + (isLive ? '<span style="color:#047857;font-weight:700;">Online now</span>' : esc(ago(s.last || s.start))) + '</td>' +
        '</tr>';
    }).join('');

    var liveRows = m.liveSessions.slice(0, 25).map(function (s) {
      var lastPage = (s.pages && s.pages.length ? s.pages[s.pages.length - 1].p : s.landing) || '/';
      return '<tr>' +
        '<td><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.18);"></span> ' +
        '<span style="font-weight:700;color:#0f172a;">' + esc(s.email || (s.isNewVisitor ? 'New visitor' : 'Returning visitor')) + '</span></td>' +
        '<td style="font-size:1rem;">' + flag(s.countryCode) + ' <span style="font-size:0.9rem;font-weight:600;">' + esc(s.country || 'Unknown') + '</span>' + (s.city ? '<div style="color:#94a3b8;font-size:0.75rem;">' + esc(s.city) + '</div>' : '') + '</td>' +
        '<td>' + esc(lastPage) + '</td>' +
        '<td style="text-transform:capitalize;">' + esc(s.device || '') + '</td>' +
        '<td>' + num(s.pageviews) + '</td>' +
        '<td>' + dur(s.duration) + '</td>' +
        '<td style="white-space:nowrap;color:#047857;font-weight:700;">' + esc(ago(s.last || s.start)) + '</td></tr>';
    }).join('');

    var countryRows = m.countries.slice(0, 15).map(function (c) {
      var share = m.a.users ? (c.users / m.a.users) * 100 : 0;
      return '<tr><td style="font-size:0.95rem;font-weight:700;color:#0f172a;">' + esc(c.key) + '</td>' +
        '<td>' + num(c.users) + '</td><td>' + num(c.count) + '</td>' +
        '<td style="min-width:140px;"><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:7px;border-radius:99px;background:rgba(15,23,42,0.06);overflow:hidden;"><div style="height:100%;width:' + Math.max(3, share) + '%;background:linear-gradient(90deg,#ff6b35,#f7931e);"></div></div><span style="font-size:0.78rem;color:#64748b;font-weight:700;">' + pct(share) + '</span></div></td></tr>';
    }).join('');

    var pagesRows = m.topPages.slice(0, 12).map(function (p) {
      return '<tr><td><span style="font-weight:700;color:#0f172a;">' + esc(p.key) + '</span>' + (p.title ? '<div style="color:#94a3b8;font-size:0.75rem;">' + esc(p.title) + '</div>' : '') + '</td>' +
        '<td>' + num(p.count) + '</td><td>' + num(p.users) + '</td>' +
        '<td>' + pct(totalSessions ? (p.users / m.a.users) * 100 : 0) + '</td></tr>';
    }).join('');

    var emptyNote = sessions.length ? '' :
      '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;color:#92400e;font-size:0.88rem;">' +
      '<b>Abhi tak koi traffic data nahi mila.</b> Tracking live hai — jaise hi visitors site browse karenge, data yahan aana shuru ho jayega. ' +
      'Agar 403 error console me aaye to Firebase Console → Firestore → Rules me <code>traffic_sessions</code> rule publish karna hoga (firestore.rules file me already added hai).</div>';

    content.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + rangeBtns + '</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:9px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#047857;font-weight:800;font-size:0.8rem;"><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#10b981;"></span> ' + m.liveUsers + ' active now</div>' +
      '<button onclick="vlTrafficRefresh()" style="padding:8px 14px;border-radius:9px;border:1px solid rgba(15,23,42,0.12);background:#fff;color:#475569;font-weight:700;font-size:0.8rem;cursor:pointer;"><i class="fa-solid fa-rotate"></i> Refresh</button>' +
      '<button onclick="vlTrafficClearOld()" style="padding:8px 14px;border-radius:9px;border:1px solid rgba(239,68,68,0.25);background:rgba(239,68,68,0.06);color:#dc2626;font-weight:700;font-size:0.8rem;cursor:pointer;"><i class="fa-solid fa-broom"></i> Clean 90d+</button>' +
      '</div></div>' +
      emptyNote +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">' +
      card('Users', num(m.a.users), delta(m.a.users, m.b.users) + ' vs previous', 'fa-users', 'linear-gradient(135deg,#1d4ed8,#3b82f6)') +
      card('New Users', num(m.a.newUsers), delta(m.a.newUsers, m.b.newUsers) + ' vs previous', 'fa-user-plus', 'linear-gradient(135deg,#059669,#10b981)') +
      card('Sessions', num(m.a.sessions), delta(m.a.sessions, m.b.sessions) + ' vs previous', 'fa-arrow-pointer', 'linear-gradient(135deg,#ff6b35,#f7931e)') +
      card('Pageviews', num(m.a.views), delta(m.a.views, m.b.views) + ' vs previous', 'fa-eye', 'linear-gradient(135deg,#0891b2,#06b6d4)') +
      card('Views / Session', (Math.round(m.a.viewsPerSession * 100) / 100).toFixed(2), delta(m.a.viewsPerSession, m.b.viewsPerSession) + ' engagement', 'fa-layer-group', 'linear-gradient(135deg,#7c3aed,#a78bfa)') +
      card('Avg. Session', dur(m.a.avgDur), delta(m.a.avgDur, m.b.avgDur) + ' duration', 'fa-clock', 'linear-gradient(135deg,#be185d,#ec4899)') +
      card('Bounce Rate', pct(m.a.bounce), delta(m.a.bounce, m.b.bounce, true) + ' single-page', 'fa-arrow-turn-down', 'linear-gradient(135deg,#b45309,#f59e0b)') +
      card('Active Now', num(m.liveUsers), 'last 5 minutes', 'fa-signal', 'linear-gradient(135deg,#065f46,#10b981)') +
      '</div>' +

      panel('🟢 Live right now — active users (last 5 min)',
        '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Visitor</th><th>Country / City</th><th>Current page</th><th>Device</th><th>Views</th><th>Time on site</th><th>Last seen</th></tr></thead><tbody>' +
        (liveRows || '<tr><td colspan="7" style="color:#94a3b8;">Is waqt koi user online nahi hai</td></tr>') + '</tbody></table></div>',
        '<span style="font-size:0.78rem;color:#047857;font-weight:700;">' + m.liveUsers + ' users online · auto-refresh 15s</span>') +

      panel('Traffic over time',
        '<div style="display:flex;gap:16px;margin-bottom:8px;font-size:0.78rem;color:#64748b;">' +
        '<span><span style="display:inline-block;width:12px;height:3px;background:#ff6b35;vertical-align:middle;"></span> Pageviews</span>' +
        '<span><span style="display:inline-block;width:12px;height:3px;background:#3b82f6;vertical-align:middle;"></span> Users</span></div>' + lineChart(m.series)) +

      panel('Users by country',
        '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Country</th><th>Users</th><th>Sessions</th><th>Share of users</th></tr></thead><tbody>' +
        (countryRows || '<tr><td colspan="4" style="color:#94a3b8;">Country data aana shuru hoga jaise hi visitors aayenge</td></tr>') + '</tbody></table></div>',
        '<span style="font-size:0.78rem;color:#94a3b8;">' + num(m.countries.length) + ' countries</span>') +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">' +
      panel('Top cities', barsRow(m.cities, totalSessions, 'linear-gradient(90deg,#be185d,#ec4899)')) +
      panel('Channels', barsRow(m.channels, totalSessions, 'linear-gradient(90deg,#ff6b35,#f7931e)')) +
      panel('Top sources / referrers', barsRow(m.sources, totalSessions, 'linear-gradient(90deg,#1d4ed8,#3b82f6)')) +
      panel('Devices', barsRow(m.devices, totalSessions, 'linear-gradient(90deg,#059669,#10b981)')) +
      panel('Browsers', barsRow(m.browsers, totalSessions, 'linear-gradient(90deg,#7c3aed,#a78bfa)')) +
      panel('Operating systems', barsRow(m.os, totalSessions, 'linear-gradient(90deg,#0891b2,#06b6d4)')) +
      '</div>' +

      panel('Views by hour of day', hourChart(m.hours)) +

      panel('Top pages',
        '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Page</th><th>Views</th><th>Users</th><th>Share</th></tr></thead><tbody>' +
        (pagesRows || '<tr><td colspan="4" style="color:#94a3b8;">No pageviews yet</td></tr>') + '</tbody></table></div>') +

      panel('All visitors (latest sessions)',
        '<div style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Visitor</th><th>Country / City</th><th>Page</th><th>Channel</th><th>Device</th><th>Views</th><th>Time on site</th><th>Last seen</th></tr></thead><tbody>' +
        (recentRows || '<tr><td colspan="8" style="color:#94a3b8;">No visitors in this range</td></tr>') + '</tbody></table></div>',
        '<span style="font-size:0.78rem;color:#94a3b8;">' + num(m.cur.length) + ' sessions</span>');
  };
})();
