// ============================================================
// Vextro Lyntra — User Dashboard → Orders
// Shows every order the logged-in user placed, with full detail.
// ============================================================
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(o) {
    if (window.VLCurrency) return window.VLCurrency.formatRaw(o.amount, o.currency || 'USD');
    return (o.currency === 'PKR' ? 'Rs ' : '$') + Number(o.amount || 0).toLocaleString('en-US');
  }

  function dt(ts) {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return '-'; }
  }

  var STATUS = {
    pending:    { bg: '#fef3c7', fg: '#b45309', ic: 'fa-hourglass-half', txt: 'Pending verification' },
    processing: { bg: '#ede9fe', fg: '#6d28d9', ic: 'fa-gears',          txt: 'Processing' },
    completed:  { bg: '#dcfce7', fg: '#15803d', ic: 'fa-circle-check',   txt: 'Completed' },
    delivered:  { bg: '#dcfce7', fg: '#15803d', ic: 'fa-truck-fast',     txt: 'Delivered' },
    cancelled:  { bg: '#fee2e2', fg: '#b91c1c', ic: 'fa-ban',            txt: 'Cancelled' },
    refunded:   { bg: '#fee2e2', fg: '#b91c1c', ic: 'fa-rotate-left',    txt: 'Refunded' }
  };

  function badge(status) {
    var s = STATUS[String(status || 'pending').toLowerCase()] || STATUS.pending;
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:' + s.bg + ';color:' + s.fg +
      ';padding:6px 12px;border-radius:999px;font-size:0.72rem;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;">' +
      '<i class="fa-solid ' + s.ic + '"></i>' + s.txt + '</span>';
  }

  function payBadge(o) {
    var paid = o.paymentStatus === 'paid';
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:' + (paid ? '#dcfce7' : '#f1f5f9') +
      ';color:' + (paid ? '#15803d' : '#475569') + ';padding:6px 12px;border-radius:999px;font-size:0.72rem;font-weight:800;text-transform:uppercase;">' +
      '<i class="fa-solid ' + (paid ? 'fa-circle-check' : 'fa-clock') + '"></i>' + (paid ? 'Paid' : 'Awaiting confirmation') + '</span>';
  }

  function row(label, value) {
    if (!value && value !== 0) return '';
    return '<div style="display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px dashed #eef2f7;">' +
      '<span style="color:#94a3b8;font-size:0.74rem;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;">' + esc(label) + '</span>' +
      '<span style="color:#0f172a;font-size:0.86rem;font-weight:700;text-align:right;word-break:break-all;">' + value + '</span>' +
      '</div>';
  }

  function card(o) {
    var img = o.productImage
      ? '<img src="' + esc(o.productImage) + '" alt="' + esc(o.package || 'Order') + '" style="width:74px;height:74px;object-fit:cover;border-radius:14px;flex-shrink:0;">'
      : '<div style="width:74px;height:74px;border-radius:14px;background:#f1f5f9;color:#cbd5e1;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;"><i class="fa-solid fa-box"></i></div>';

    var proof = o.proof
      ? '<a href="' + esc(o.proof) + '" target="_blank" rel="noopener" style="color:#ff6b35;font-weight:800;">View screenshot</a>'
      : '';

    return '' +
      '<div style="background:#fff;border:1px solid #eef2f7;border-radius:20px;padding:20px;box-shadow:0 6px 20px rgba(15,23,42,0.04);">' +
        '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">' +
          img +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="font-size:1.05rem;font-weight:800;color:#0f172a;margin-bottom:4px;">' + esc(o.package || o.service || 'Order') + '</div>' +
            '<div style="font-size:0.76rem;color:#94a3b8;font-weight:700;letter-spacing:0.5px;">ORDER #' + esc(String(o.id || '').toUpperCase()) + '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">' + badge(o.status) + payBadge(o) + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:1.35rem;font-weight:900;color:#0f172a;">' + money(o) + '</div>' +
            '<div style="font-size:0.74rem;color:#94a3b8;font-weight:700;">' + esc(o.currency || 'USD') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:16px;">' +
          row('Placed on', esc(dt(o.createdAt))) +
          row('Category', esc(o.productCategory || o.service || '')) +
          row('Payment method', esc(o.paymentMethod || '-')) +
          row('Region', esc(o.paymentRegion || '-')) +
          row('Transaction ID', esc(o.txn || '')) +
          row('Payment proof', proof) +
          row('Buyer name', esc(o.buyerName || '')) +
          row('Email', esc(o.buyerEmail || '')) +
          row('Phone / WhatsApp', esc(o.buyerPhone || '')) +
          row('Your note', esc(o.notes || '')) +
          row('Delivery / admin note', esc(o.adminNote || o.deliveryNote || '')) +
          (o.deliveryLink ? row('Download / access', '<a href="' + esc(o.deliveryLink) + '" target="_blank" rel="noopener" style="color:#ff6b35;font-weight:800;">Open link</a>') : '') +
        '</div>' +
        '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">' +
          '<a href="https://wa.me/' + ((window.PAYMENT_CONFIG && window.PAYMENT_CONFIG.whatsapp) || '923228824375') +
            '?text=' + encodeURIComponent('Hi, my order ID is ' + (o.id || '')) + '" target="_blank" rel="noopener" ' +
            'style="background:#25d366;color:#fff;padding:11px 18px;border-radius:12px;font-size:0.8rem;font-weight:800;text-decoration:none;">' +
            '<i class="fa-brands fa-whatsapp"></i> Ask about this order</a>' +
          '<button onclick="vlCopyOrderId(\'' + esc(o.id) + '\')" ' +
            'style="background:#f1f5f9;color:#0f172a;border:none;padding:11px 18px;border-radius:12px;font-size:0.8rem;font-weight:800;cursor:pointer;">' +
            '<i class="fa-regular fa-copy"></i> Copy order ID</button>' +
        '</div>' +
      '</div>';
  }

  window.vlCopyOrderId = function (id) {
    try { navigator.clipboard.writeText(id); } catch (e) {}
    if (window.showToast) window.showToast('Order ID copied');
  };

  function stat(label, value, color) {
    return '<div style="background:#fff;border:1px solid #eef2f7;border-radius:16px;padding:16px 18px;flex:1;min-width:150px;">' +
      '<div style="font-size:0.7rem;font-weight:800;letter-spacing:0.8px;color:#94a3b8;text-transform:uppercase;">' + label + '</div>' +
      '<div style="font-size:1.5rem;font-weight:900;color:' + color + ';margin-top:6px;">' + value + '</div></div>';
  }

  function host() {
    var view = document.getElementById('dashViewOrders');
    if (!view) return null;
    // Hide the original static empty-state / grid, we render our own list
    Array.prototype.forEach.call(view.children, function (ch) {
      if (ch.id === 'vlUserOrders') return;
      if (ch.classList && ch.classList.contains('dash-header')) return;
      ch.style.display = 'none';
    });
    var wrap = document.getElementById('vlUserOrders');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'vlUserOrders';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '18px';
      view.appendChild(wrap);
    }
    return wrap;
  }

  function empty(msg, sub) {
    return '<div style="background:#fcfcfd;border-radius:20px;padding:70px 20px;text-align:center;">' +
      '<div style="width:70px;height:70px;border-radius:50%;background:#f1f5f9;color:#cbd5e1;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 16px;"><i class="fa-solid fa-bag-shopping"></i></div>' +
      '<h4 style="font-size:1.25rem;margin:0 0 6px;color:#0f172a;font-weight:800;">' + msg + '</h4>' +
      '<p style="font-size:0.8rem;font-weight:700;color:#94a3b8;letter-spacing:0.5px;margin-bottom:22px;">' + sub + '</p>' +
      '<button onclick="showPage(\'shop\')" style="background:#0f172a;color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:0.85rem;font-weight:800;cursor:pointer;">Browse Shop</button>' +
      '</div>';
  }

  async function fetchMyOrders(user) {
    var out = [];
    if (window.fsQueryWhere) {
      var rows = await window.fsQueryWhere('orders', 'userId', user.uid, 200);
      if (rows && rows.length) out = rows;
    }
    if (!out.length && window.fsLoadMap) {
      try {
        var map = await window.fsLoadMap('orders');
        if (map) {
          out = Object.values(map).filter(function (o) {
            return o && (o.userId === user.uid ||
              (user.email && o.buyerEmail && String(o.buyerEmail).toLowerCase() === String(user.email).toLowerCase()));
          });
        }
      } catch (e) {}
    }
    // Offline orders saved locally when Firestore was unreachable
    try {
      var local = JSON.parse(localStorage.getItem('vextro_pending_orders') || '[]');
      var ids = out.map(function (o) { return o.id; });
      local.forEach(function (o) {
        if (o && ids.indexOf(o.id) === -1 &&
            (o.userId === user.uid || (user.email && o.buyerEmail === user.email))) out.push(o);
      });
    } catch (e) {}

    out.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return out;
  }

  window.renderUserOrders = async function () {
    var wrap = host();
    if (!wrap) return;

    var user = window.auth && window.auth.currentUser;
    if (!user) {
      wrap.innerHTML = empty('Login required', 'PLEASE LOGIN TO SEE YOUR ORDERS');
      return;
    }

    wrap.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8;font-weight:700;">' +
      '<i class="fa-solid fa-spinner fa-spin"></i> Loading your orders…</div>';

    var list = [];
    try { list = await fetchMyOrders(user); } catch (e) {}

    if (!list.length) {
      wrap.innerHTML = empty('No Orders Found', 'YOUR PURCHASE HISTORY IS EMPTY');
      return;
    }

    var totalUsd = list.reduce(function (s, o) {
      return s + (window.VLCurrency ? window.VLCurrency.orderUsd(o) : Number(o.amount || 0));
    }, 0);
    var pending = list.filter(function (o) { return o.status === 'pending' || o.status === 'processing'; }).length;
    var done = list.filter(function (o) { return o.status === 'completed' || o.status === 'delivered'; }).length;

    wrap.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
        stat('Total Orders', list.length, '#0f172a') +
        stat('In Progress', pending, '#b45309') +
        stat('Completed', done, '#15803d') +
        stat('Total Spent', '$' + Math.round(totalUsd).toLocaleString('en-US'), '#ff6b35') +
      '</div>' +
      list.map(card).join('');
  };

  // Hook into dashboard view switching
  function hook() {
    var orig = window.switchDashView;
    if (typeof orig !== 'function' || orig.__vlOrders) return;
    var wrapped = function (view) {
      orig.apply(this, arguments);
      if (view === 'orders') { try { window.renderUserOrders(); } catch (e) {} }
    };
    wrapped.__vlOrders = true;
    window.switchDashView = wrapped;
    try { switchDashView = wrapped; } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    hook();
    setTimeout(hook, 800);
    if (window.auth && window.auth.onAuthStateChanged) {
      window.auth.onAuthStateChanged(function () {
        var v = document.getElementById('dashViewOrders');
        if (v && v.style.display !== 'none') { try { window.renderUserOrders(); } catch (e) {} }
      });
    }
  });
})();
