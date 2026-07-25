/* ============================================================
   Vextro Lyntra — Traffic Analytics Tracker (Google Analytics style)
   Sessions are stored in Firestore collection: traffic_sessions
   One document per visitor session, updated as the user browses.
   ============================================================ */
(function () {
  'use strict';

  if (window.__vlTrafficLoaded) return;
  window.__vlTrafficLoaded = true;

  var VIS_KEY = 'vl_visitor_id';
  var SES_KEY = 'vl_session_id';
  var SES_TS = 'vl_session_last';
  var SESSION_GAP = 30 * 60 * 1000; // 30 min inactivity = new session

  function uid(p) {
    return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function getVisitorId() {
    var v = null;
    try { v = localStorage.getItem(VIS_KEY); } catch (e) {}
    if (!v) {
      v = uid('v_');
      try { localStorage.setItem(VIS_KEY, v); } catch (e) {}
      isNewVisitor = true;
    }
    return v;
  }

  var isNewVisitor = false;

  function getSessionId() {
    var s = null, last = 0;
    try { s = sessionStorage.getItem(SES_KEY); last = parseInt(localStorage.getItem(SES_TS) || '0', 10); } catch (e) {}
    if (!s || !last || (Date.now() - last) > SESSION_GAP) {
      s = uid('s_');
      try { sessionStorage.setItem(SES_KEY, s); } catch (e) {}
    }
    try { localStorage.setItem(SES_TS, String(Date.now())); } catch (e) {}
    return s;
  }

  function deviceType() {
    var w = window.innerWidth || screen.width || 0;
    var ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (w >= 700 && w <= 1024 && /Mobi|Android/i.test(ua))) return 'tablet';
    if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua) || w < 700) return 'mobile';
    return 'desktop';
  }

  function browserName() {
    var ua = navigator.userAgent || '';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\/|Opera/.test(ua)) return 'Opera';
    if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
    return 'Other';
  }

  function osName() {
    var ua = navigator.userAgent || '';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Other';
  }

  function regionGuess() {
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
      var lang = navigator.language || '';
      var m = lang.split('-')[1];
      return (m ? m.toUpperCase() : (tz.split('/')[1] || tz || 'Unknown').replace(/_/g, ' '));
    } catch (e) { return 'Unknown'; }
  }

  function timezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }

  function refHost(ref) {
    if (!ref) return '';
    try {
      var h = new URL(ref).hostname.replace(/^www\./, '');
      if (h === location.hostname.replace(/^www\./, '')) return '';
      return h;
    } catch (e) { return ''; }
  }

  function sourceOf(host, params) {
    var utm = (params.get('utm_source') || '').toLowerCase();
    if (utm) return { source: utm, medium: (params.get('utm_medium') || 'referral').toLowerCase(), channel: channelFor(utm, params.get('utm_medium')) };
    if (!host) return { source: 'direct', medium: 'none', channel: 'Direct' };
    return { source: host, medium: 'referral', channel: channelFor(host, 'referral') };
  }

  function channelFor(src, medium) {
    src = (src || '').toLowerCase(); medium = (medium || '').toLowerCase();
    if (/cpc|ppc|paid/.test(medium)) return 'Paid Search';
    if (/google|bing|yahoo|duckduckgo|ecosia|brave/.test(src)) return 'Organic Search';
    if (/facebook|instagram|twitter|t\.co|x\.com|linkedin|pinterest|tiktok|youtube|whatsapp|reddit|threads/.test(src)) return 'Social';
    if (/mail|gmail|outlook|newsletter|email/.test(src + medium)) return 'Email';
    if (src === 'direct') return 'Direct';
    return 'Referral';
  }

  var visitorId = getVisitorId();
  var sessionId = getSessionId();
  var params = new URLSearchParams(location.search || '');
  var referrer = document.referrer || '';
  var rHost = refHost(referrer);
  var src = sourceOf(rHost, params);
  var startTs = Date.now();
  var pages = [];       // { p: path, t: title, ts }
  var lastPath = '';
  var pendingSave = null;
  var lastSaved = 0;
  var events = [];      // { n: name, ts }

  function currentPath() {
    var h = (location.hash || '').replace(/^#/, '');
    if (h && h !== '/') return '/' + h.replace(/^\/+/, '');
    return location.pathname || '/';
  }

  function pageTitle() {
    return (document.title || '').slice(0, 120);
  }

  function userEmail() {
    try {
      if (window.firebase && firebase.auth && firebase.auth().currentUser) return firebase.auth().currentUser.email || '';
      var u = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return (u && u.email) || '';
    } catch (e) { return ''; }
  }

  function buildDoc() {
    var now = Date.now();
    var d = new Date(startTs);
    var day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return {
      sessionId: sessionId,
      visitorId: visitorId,
      isNewVisitor: !!isNewVisitor,
      start: startTs,
      last: now,
      duration: Math.max(0, Math.round((now - startTs) / 1000)),
      day: day,
      hour: d.getHours(),
      pageviews: pages.length,
      pages: pages.slice(-40),
      landing: (pages[0] && pages[0].p) || currentPath(),
      exit: (pages[pages.length - 1] && pages[pages.length - 1].p) || currentPath(),
      events: events.slice(-40),
      referrer: referrer.slice(0, 300),
      refHost: rHost,
      source: src.source,
      medium: src.medium,
      channel: src.channel,
      campaign: params.get('utm_campaign') || '',
      device: deviceType(),
      browser: browserName(),
      os: osName(),
      screen: (screen.width || 0) + 'x' + (screen.height || 0),
      lang: navigator.language || '',
      region: regionGuess(),
      tz: timezone(),
      email: userEmail(),
      bounce: pages.length <= 1
    };
  }

  function save(force) {
    if (!window.fsSetDoc) return;
    var now = Date.now();
    if (!force && now - lastSaved < 8000) {
      clearTimeout(pendingSave);
      pendingSave = setTimeout(function () { save(true); }, 8000);
      return;
    }
    lastSaved = now;
    try { localStorage.setItem(SES_TS, String(now)); } catch (e) {}
    var doc = buildDoc();
    try { localStorage.setItem('vl_last_session_doc', JSON.stringify(doc)); } catch (e) {}
    try { window.fsSetDoc('traffic_sessions', sessionId, doc); } catch (e) {}
  }

  function trackPageview() {
    var p = currentPath();
    if (p === lastPath) return;
    lastPath = p;
    pages.push({ p: p, t: pageTitle(), ts: Date.now() });
    save(pages.length === 1);
  }

  window.vlTrackEvent = function (name) {
    if (!name) return;
    events.push({ n: String(name).slice(0, 60), ts: Date.now() });
    save(false);
  };

  // initial + route changes
  function boot() {
    trackPageview();
    window.addEventListener('hashchange', function () { setTimeout(trackPageview, 60); });
    window.addEventListener('popstate', function () { setTimeout(trackPageview, 60); });
    // patch history for SPA navigations
    ['pushState', 'replaceState'].forEach(function (m) {
      var orig = history[m];
      if (typeof orig !== 'function') return;
      history[m] = function () { var r = orig.apply(this, arguments); setTimeout(trackPageview, 60); return r; };
    });
    // engagement heartbeat
    setInterval(function () { if (!document.hidden) save(false); }, 30000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) save(true); });
    window.addEventListener('pagehide', function () { save(true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
