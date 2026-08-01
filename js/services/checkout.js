// ============================================================
// Vextro Lyntra — Checkout / Payment Page
// Buy Now  ->  Payment page
//   Tab 1: Pakistan  (JazzCash / Easypaisa / Bank Transfer)
//   Tab 2: International (Crypto — USDT / BTC / ETH)
// Client pays manually, uploads screenshot / TxID,
// order lands in Firestore `orders` with status "pending".
// ============================================================
(function () {
  'use strict';

  // ---- PAYMENT DETAILS (yahan apne asli numbers daal dena) ----
  window.PAYMENT_CONFIG = window.PAYMENT_CONFIG || {
    usdToPkr: 280,
    whatsapp: '923228824375',
    pk: [
      { key: 'jazzcash', name: 'JazzCash',   icon: 'fa-mobile-screen-button', color: '#e11d48', account: 'Zeenat Mushtaq', number: '0322-8824375', note: 'JazzCash app se "Send Money" karein.' },
      { key: 'easypaisa', name: 'Easypaisa', icon: 'fa-wallet',               color: '#16a34a', account: 'Zeenat Mushtaq', number: '0322-8824375', note: 'Easypaisa app ya shop se transfer karein.' },
      { key: 'sadapay',  name: 'SadaPay',    icon: 'fa-credit-card',          color: '#0ea5e9', account: 'Zeenat Mushtaq', number: '0322-8824375', note: 'SadaPay app se Raast / mobile number par bhejein.' },
      { key: 'nayapay',  name: 'NayaPay',    icon: 'fa-bolt',                 color: '#7c3aed', account: 'Asim Rizwan',    number: '0328-1806910', note: 'NayaPay app se Raast / mobile number par bhejein.' }
    ],
    crypto: [
      { key: 'usdt_trc20', name: 'USDT (TRC20)', icon: 'fa-dollar-sign', color: '#26a17b', network: 'Tron / TRC20', address: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', note: 'Lowest fees — recommended.' },
      { key: 'usdt_bep20', name: 'USDT (BEP20)', icon: 'fa-dollar-sign', color: '#f0b90b', network: 'BNB Smart Chain', address: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', note: 'Binance Smart Chain network only.' },
      { key: 'btc',        name: 'Bitcoin',      icon: 'fa-bitcoin-sign', color: '#f7931a', network: 'BTC', address: 'bc1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', note: 'Send only BTC to this address.' },
      { key: 'eth',        name: 'Ethereum',     icon: 'fa-ethereum',     color: '#627eea', network: 'ERC20', address: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', note: 'ERC20 network only.' }
    ]
  };

  var CO = { item: null, region: 'pk', method: null, file: null };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function priceNum(p) {
    var n = parseFloat(String(p == null ? '' : p).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function ensureShell() {
    var page = document.getElementById('checkoutPage');
    if (page) return page;
    var host = document.getElementById('shopPage');
    var parent = (host && host.parentNode) || document.body;
    page = document.createElement('div');
    page.id = 'checkoutPage';
    page.className = 'page-section';
    page.style.display = 'none';
    parent.appendChild(page);
    return page;
  }

  function hideOtherPages() {
    var ids = ['homePage', 'blogsPage', 'shopPage', 'marketplacePage', 'guidePage', 'aboutPage',
      'privacyPage', 'termsPage', 'refundPage', 'contactPage', 'founderPage', 'faqPage',
      'emailSupportPage', 'authPage', 'dashboardPage', 'servicesMainPage', 'servicesPage',
      'productDetailPage', 'mpDetailPage', 'blogDetailPage', 'createBlogPage', 'createListingPage', 'toolsPage'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  // ---------- open ----------
  window.openCheckout = function (item) {
    CO.item = item || { title: 'Order', price: 0 };
    CO.region = 'pk';
    CO.method = null;
    CO.file = null;
    var page = ensureShell();
    hideOtherPages();
    page.style.display = 'block';
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    try { history.pushState(null, null, '/checkout'); } catch (e) {}
  };

  window.closeCheckout = function () {
    var page = document.getElementById('checkoutPage');
    if (page) page.style.display = 'none';
    if (window.showPage) window.showPage('shop');
  };

  // ---------- render ----------
  function render() {
    var page = document.getElementById('checkoutPage');
    if (!page) return;
    var cfg = window.PAYMENT_CONFIG;
    var it = CO.item;
    var usd = priceNum(it.price);
    var pkr = Math.round(usd * cfg.usdToPkr);

    page.innerHTML =
      '<div class="co-wrap">' +
        '<button class="co-back" onclick="closeCheckout()"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<div class="co-head">' +
          '<h1>Secure Checkout</h1>' +
          '<p>Choose your payment method — Pakistan (local) or International (crypto).</p>' +
        '</div>' +
        '<div class="co-grid">' +
          '<div class="co-main">' +
            '<div class="co-tabs">' +
              '<button class="co-tab ' + (CO.region === 'pk' ? 'active' : '') + '" onclick="checkoutSetRegion(\'pk\')">' +
                '<i class="fa-solid fa-location-dot"></i> Pakistan' +
              '</button>' +
              '<button class="co-tab ' + (CO.region === 'intl' ? 'active' : '') + '" onclick="checkoutSetRegion(\'intl\')">' +
                '<i class="fa-solid fa-globe"></i> International — Crypto' +
              '</button>' +
            '</div>' +
            (CO.region === 'pk' ? renderPk(pkr) : renderCrypto(usd)) +
            renderForm() +
          '</div>' +
          renderSummary(it, usd, pkr) +
        '</div>' +
      '</div>';
  }

  function renderPk(pkr) {
    var list = window.PAYMENT_CONFIG.pk;
    return '<div class="co-card">' +
      '<h3 class="co-card-title">1. Select a payment method</h3>' +
      '<div class="co-methods">' +
        list.map(function (m) {
          var active = CO.method === m.key;
          return '<button class="co-method ' + (active ? 'active' : '') + '" onclick="checkoutSetMethod(\'' + m.key + '\')">' +
            '<span class="co-method-ic" style="background:' + m.color + '"><i class="fa-solid ' + m.icon + '"></i></span>' +
            '<span class="co-method-tx"><strong>' + esc(m.name) + '</strong><small>' + esc(m.note) + '</small></span>' +
            '<span class="co-method-chk"><i class="fa-solid fa-circle-check"></i></span>' +
          '</button>';
        }).join('') +
      '</div>' +
      (CO.method ? renderPkDetails(pkr) : '<p class="co-hint">Method select karein to account details show honge.</p>') +
    '</div>';
  }

  function renderPkDetails(pkr) {
    var m = window.PAYMENT_CONFIG.pk.filter(function (x) { return x.key === CO.method; })[0];
    if (!m) return '';
    return '<div class="co-detail">' +
      '<div class="co-detail-head"><i class="fa-solid ' + m.icon + '"></i> ' + esc(m.name) + ' details</div>' +
      row('Account Title', m.account) +
      (m.bank ? row('Bank', m.bank) : '') +
      row('Mobile Number', m.number, true) +
      row('Amount to send', 'PKR ' + pkr.toLocaleString('en-US'), true) +
      '<p class="co-note"><i class="fa-solid fa-circle-info"></i> Payment bhejne ke baad neeche form me screenshot ya Transaction ID zaroor add karein — warna order verify nahi hoga.</p>' +
    '</div>';
  }

  function renderCrypto(usd) {
    var list = window.PAYMENT_CONFIG.crypto;
    var m = list.filter(function (x) { return x.key === CO.method; })[0];
    return '<div class="co-card">' +
      '<h3 class="co-card-title">1. Select a coin / network</h3>' +
      '<div class="co-methods">' +
        list.map(function (c) {
          var active = CO.method === c.key;
          return '<button class="co-method ' + (active ? 'active' : '') + '" onclick="checkoutSetMethod(\'' + c.key + '\')">' +
            '<span class="co-method-ic" style="background:' + c.color + '"><i class="fa-brands ' + c.icon + '"></i></span>' +
            '<span class="co-method-tx"><strong>' + esc(c.name) + '</strong><small>' + esc(c.network) + ' — ' + esc(c.note) + '</small></span>' +
            '<span class="co-method-chk"><i class="fa-solid fa-circle-check"></i></span>' +
          '</button>';
        }).join('') +
      '</div>' +
      (m ? '<div class="co-detail">' +
        '<div class="co-detail-head"><i class="fa-solid fa-wallet"></i> ' + esc(m.name) + ' — ' + esc(m.network) + '</div>' +
        row('Wallet Address', m.address, true) +
        row('Amount to send', '$' + usd.toLocaleString('en-US') + ' USD', true) +
        '<p class="co-note"><i class="fa-solid fa-triangle-exclamation"></i> Sirf <b>' + esc(m.network) + '</b> network use karein. Galat network par bheji gayi payment recover nahi hoti.</p>' +
      '</div>' : '<p class="co-hint">Coin select karein to wallet address show hoga.</p>');
  }

  function row(label, value, copy) {
    var id = 'co_' + Math.random().toString(36).slice(2, 8);
    return '<div class="co-row">' +
      '<span class="co-row-l">' + esc(label) + '</span>' +
      '<span class="co-row-v"><code id="' + id + '">' + esc(value) + '</code>' +
      (copy ? '<button class="co-copy" onclick="checkoutCopy(\'' + id + '\', this)"><i class="fa-regular fa-copy"></i></button>' : '') +
      '</span></div>';
  }

  function waText() {
    var it = CO.item || {};
    var usd = priceNum(it.price);
    var lines = ['Hi Vextro Lyntra! I want to buy:', '', 'Product: ' + (it.title || 'Order')];
    if (usd) lines.push('Price: $' + usd + (CO.region === 'pk' ? ' (PKR ' + Math.round(usd * window.PAYMENT_CONFIG.usdToPkr).toLocaleString('en-US') + ')' : ''));
    var m = (window.PAYMENT_CONFIG.pk.concat(window.PAYMENT_CONFIG.crypto)).filter(function (x) { return x.key === CO.method; })[0];
    if (m) lines.push('Payment method: ' + m.name);
    lines.push('', 'Please guide me with the payment.');
    return lines.join('\n');
  }

  function renderForm() {
    return '<div class="co-card">' +
      '<h3 class="co-card-title">2. Confirm your payment</h3>' +
      '<div class="co-fields">' +
        '<div><label>Full Name *</label><input id="coName" type="text" placeholder="Your name"></div>' +
        '<div><label>Email *</label><input id="coEmail" type="email" placeholder="you@email.com"></div>' +
        '<div><label>WhatsApp / Phone *</label><input id="coPhone" type="text" placeholder="+92 3XX XXXXXXX"></div>' +
        '<div><label>Transaction ID / TxID *</label><input id="coTxn" type="text" placeholder="e.g. 9F3K2L or TxHash"></div>' +
        '<div class="co-full"><label>Payment Screenshot (optional)</label><input id="coProof" type="file" accept="image/*" onchange="checkoutPickFile(this)"><div id="coProofPrev"></div></div>' +
        '<div class="co-full"><label>Note for us (optional)</label><textarea id="coNote" rows="3" placeholder="Koi special requirement?"></textarea></div>' +
      '</div>' +
      '<div id="coMsg" class="co-msg"></div>' +
      '<button class="co-submit" onclick="checkoutSubmit()"><i class="fa-solid fa-paper-plane"></i> Submit Payment Confirmation</button>' +
      '<a class="co-wa" href="https://wa.me/' + String(window.PAYMENT_CONFIG.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(waText()) + '" target="_blank" rel="noopener">' +
        '<span class="co-wa-ic"><i class="fa-brands fa-whatsapp"></i></span>' +
        '<span class="co-wa-tx"><strong>Need help? Chat on WhatsApp</strong><small>Usually replies within a few minutes</small></span>' +
        '<i class="fa-solid fa-arrow-right co-wa-ar"></i>' +
      '</a>' +
    '</div>';
  }

  function renderSummary(it, usd, pkr) {
    return '<aside class="co-side">' +
      '<div class="co-card co-summary">' +
        '<h3 class="co-card-title">Order Summary</h3>' +
        '<div class="co-item">' +
          (it.image ? '<img src="' + esc(it.image) + '" alt="">' : '<div class="co-item-ph"><i class="fa-solid fa-box"></i></div>') +
          '<div><strong>' + esc(it.title || 'Order') + '</strong><small>' + esc(it.category || 'Digital Product') + '</small></div>' +
        '</div>' +
        '<div class="co-row"><span class="co-row-l">Price (USD)</span><span class="co-row-v"><b>$' + usd.toLocaleString('en-US') + '</b></span></div>' +
        '<div class="co-row"><span class="co-row-l">In PKR</span><span class="co-row-v"><b>Rs ' + pkr.toLocaleString('en-US') + '</b></span></div>' +
        '<div class="co-total"><span>Total</span><b>' + (CO.region === 'pk' ? 'PKR ' + pkr.toLocaleString('en-US') : '$' + usd.toLocaleString('en-US')) + '</b></div>' +
        '<ul class="co-trust">' +
          '<li><i class="fa-solid fa-shield-halved"></i> Manual verified payment — 100% safe</li>' +
          '<li><i class="fa-solid fa-clock"></i> Delivery within 2–12 hours of verification</li>' +
          '<li><i class="fa-solid fa-rotate-left"></i> Refund if we can\'t deliver</li>' +
        '</ul>' +
      '</div>' +
    '</aside>';
  }

  // ---------- actions ----------
  window.checkoutSetRegion = function (r) { CO.region = r; CO.method = null; render(); };
  window.checkoutSetMethod = function (k) { CO.method = k; render(); };

  window.checkoutCopy = function (id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    var txt = el.innerText;
    var done = function () {
      if (!btn) return;
      var old = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(function () { btn.innerHTML = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  };

  window.checkoutPickFile = function (input) {
    var f = input && input.files && input.files[0];
    var prev = document.getElementById('coProofPrev');
    if (!f) { CO.file = null; if (prev) prev.innerHTML = ''; return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      compress(e.target.result, function (small) {
        CO.file = small;
        if (prev) prev.innerHTML = '<img src="' + small + '" alt="proof" style="max-width:170px;border-radius:10px;margin-top:10px;border:1px solid rgba(15,23,42,.12);">';
      });
    };
    reader.readAsDataURL(f);
  };

  function compress(dataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      var max = 900;
      var w = img.width, h = img.height;
      if (w > max || h > max) { var s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      try { cb(c.toDataURL('image/jpeg', 0.7)); } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function methodLabel() {
    var all = (window.PAYMENT_CONFIG.pk || []).concat(window.PAYMENT_CONFIG.crypto || []);
    var m = all.filter(function (x) { return x.key === CO.method; })[0];
    return m ? m.name : '';
  }

  window.checkoutSubmit = function () {
    var msg = document.getElementById('coMsg');
    var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    var name = val('coName'), email = val('coEmail'), phone = val('coPhone'), txn = val('coTxn'), note = val('coNote');

    var err = '';
    if (!CO.method) err = 'Pehle payment method select karein.';
    else if (name.length < 2) err = 'Apna pura naam likhein.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err = 'Valid email address likhein.';
    else if (phone.replace(/\D/g, '').length < 8) err = 'Valid WhatsApp / phone number likhein.';
    else if (txn.length < 4 && !CO.file) err = 'Transaction ID ya payment screenshot me se ek zaroori hai.';
    if (err) { if (msg) { msg.className = 'co-msg err'; msg.innerText = err; } return; }

    var usd = priceNum(CO.item.price);
    var pkr = Math.round(usd * window.PAYMENT_CONFIG.usdToPkr);
    var order = {
      id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: methodLabel(),
      paymentRegion: CO.region === 'pk' ? 'Pakistan' : 'International (Crypto)',
      currency: CO.region === 'pk' ? 'PKR' : 'USD',
      amount: CO.region === 'pk' ? pkr : usd,
      amountPaid: 0,
      buyerName: name,
      buyerEmail: email,
      buyerPhone: phone,
      service: 'Digital Product',
      package: CO.item.title || '',
      productId: CO.item.id || '',
      txn: txn,
      notes: note,
      proof: CO.file || '',
      userId: (window.auth && window.auth.currentUser) ? window.auth.currentUser.uid : null
    };

    if (msg) { msg.className = 'co-msg'; msg.innerText = 'Submitting…'; }

    var save = window.fsSetDoc
      ? window.fsSetDoc('orders', order.id, order)
      : Promise.reject(new Error('offline'));

    save.then(function () { done(order); })
      .catch(function () {
        try {
          var k = 'vextro_pending_orders';
          var l = JSON.parse(localStorage.getItem(k) || '[]');
          l.unshift(order); localStorage.setItem(k, JSON.stringify(l));
        } catch (e) {}
        done(order);
      });
  };

  function done(order) {
    try {
      if (window.notifyAdmin) {
        window.notifyAdmin('New Order — ' + (order.package || 'Item'),
          'Naya order aya hai (payment confirmation).\n\n' +
          'Order: ' + order.id + '\nItem: ' + order.package +
          '\nAmount: ' + order.currency + ' ' + order.amount +
          '\nMethod: ' + order.paymentMethod + ' (' + order.paymentRegion + ')' +
          '\nTxID: ' + (order.txn || '-') +
          '\nBuyer: ' + order.buyerName + ' | ' + order.buyerEmail + ' | ' + order.buyerPhone,
          order.buyerName);
      }
    } catch (e) {}

    var page = document.getElementById('checkoutPage');
    if (!page) return;
    page.innerHTML =
      '<div class="co-wrap"><div class="co-card co-done">' +
        '<div class="co-done-ic"><i class="fa-solid fa-circle-check"></i></div>' +
        '<h2>Payment confirmation received!</h2>' +
        '<p>Order ID: <code>' + esc(order.id) + '</code></p>' +
        '<p>Hum aapki payment verify kar rahe hain. Verification ke baad 2–12 hours me delivery aapke email <b>' + esc(order.buyerEmail) + '</b> par ho jayegi.</p>' +
        '<div class="co-done-btns">' +
          '<a class="co-submit" href="https://wa.me/' + window.PAYMENT_CONFIG.whatsapp + '?text=' + encodeURIComponent('Hi, my order ID is ' + order.id) + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Send us the receipt</a>' +
          '<button class="co-ghost" onclick="closeCheckout()">Continue shopping</button>' +
        '</div>' +
      '</div></div>';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ---------- hook Buy Now ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('#pdBuyNow');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    var pid = window.currentProductId || (window.currentProduct && window.currentProduct.id);
    var p = (pid && window.PRODUCTS_DATA) ? window.PRODUCTS_DATA[pid] : (window.currentProduct || null);
    window.openCheckout(p ? {
      id: p.id, title: p.title, price: p.price, image: p.image, category: p.category
    } : { title: 'Order', price: 0 });
  });

  // Hide checkout whenever the site navigates elsewhere
  var origShowPage = window.showPage;
  function patchShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage.__coPatched) return;
    var orig = window.showPage;
    var wrapped = function () {
      var page = document.getElementById('checkoutPage');
      if (page) page.style.display = 'none';
      return orig.apply(this, arguments);
    };
    wrapped.__coPatched = true;
    window.showPage = wrapped;
  }
  patchShowPage();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchShowPage);
  } else {
    setTimeout(patchShowPage, 0);
  }
  void origShowPage;

  // ---------- styles ----------
  var css = '' +
  '#checkoutPage{background:#f1f5f9;min-height:100vh;padding:28px 16px 70px;}' +
  '.co-wrap{max-width:1080px;margin:0 auto;}' +
  '.co-back{background:#fff;border:1px solid rgba(15,23,42,.12);color:#0f172a;padding:9px 16px;border-radius:9px;font-weight:600;cursor:pointer;margin-bottom:18px;font-size:.9rem;}' +
  '.co-head h1{margin:0 0 6px;font-size:2rem;color:#0f172a;}' +
  '.co-head p{margin:0 0 22px;color:#64748b;}' +
  '.co-grid{display:grid;grid-template-columns:1fr 340px;gap:22px;align-items:start;}' +
  '.co-card{background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:16px;padding:22px;margin-bottom:18px;box-shadow:0 6px 24px rgba(15,23,42,.05);}' +
  '.co-card-title{margin:0 0 16px;font-size:1.05rem;color:#0f172a;font-weight:800;}' +
  '.co-tabs{display:flex;gap:10px;margin-bottom:18px;}' +
  '.co-tab{flex:1;padding:14px 12px;border-radius:13px;border:2px solid rgba(15,23,42,.1);background:#fff;color:#475569;font-weight:700;cursor:pointer;font-size:.92rem;}' +
  '.co-tab.active{border-color:#4f46e5;color:#4f46e5;background:#eef2ff;}' +
  '.co-methods{display:grid;gap:10px;}' +
  '.co-method{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 14px;border-radius:12px;border:2px solid rgba(15,23,42,.1);background:#fff;cursor:pointer;}' +
  '.co-method.active{border-color:#4f46e5;background:#f5f3ff;}' +
  '.co-method-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;flex:0 0 38px;}' +
  '.co-method-tx{flex:1;display:flex;flex-direction:column;}' +
  '.co-method-tx strong{color:#0f172a;font-size:.95rem;}' +
  '.co-method-tx small{color:#64748b;font-size:.78rem;}' +
  '.co-method-chk{color:#cbd5e1;}' +
  '.co-method.active .co-method-chk{color:#4f46e5;}' +
  '.co-hint{color:#94a3b8;font-size:.85rem;margin:14px 0 0;}' +
  '.co-detail{margin-top:16px;background:#f8fafc;border:1px dashed rgba(79,70,229,.35);border-radius:13px;padding:16px;}' +
  '.co-detail-head{font-weight:800;color:#0f172a;margin-bottom:10px;}' +
  '.co-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(15,23,42,.06);}' +
  '.co-row:last-child{border-bottom:none;}' +
  '.co-row-l{color:#64748b;font-size:.83rem;font-weight:600;}' +
  '.co-row-v{display:flex;align-items:center;gap:8px;color:#0f172a;font-size:.88rem;word-break:break-all;text-align:right;}' +
  '.co-row-v code{background:#eef2ff;padding:4px 8px;border-radius:6px;font-size:.82rem;color:#3730a3;}' +
  '.co-copy{background:#4f46e5;border:none;color:#fff;width:30px;height:28px;border-radius:7px;cursor:pointer;}' +
  '.co-note{margin:12px 0 0;font-size:.8rem;color:#475569;line-height:1.5;}' +
  '.co-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;}' +
  '.co-fields .co-full{grid-column:1/-1;}' +
  '.co-fields label{display:block;font-size:.76rem;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;}' +
  '.co-fields input,.co-fields textarea{width:100%;padding:11px 13px;background:#f8fafc;border:1px solid rgba(15,23,42,.12);border-radius:9px;color:#0f172a;font-size:.9rem;box-sizing:border-box;font-family:inherit;}' +
  '.co-msg{margin:14px 0 0;font-size:.86rem;color:#475569;min-height:18px;}' +
  '.co-msg.err{color:#dc2626;font-weight:600;}' +
  '.co-submit{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;padding:14px;border:none;border-radius:11px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:800;font-size:.97rem;cursor:pointer;text-decoration:none;}' +
  '.co-ghost{padding:13px 18px;border-radius:11px;border:1px solid rgba(15,23,42,.15);background:#fff;color:#0f172a;font-weight:700;cursor:pointer;}' +
  '.co-wa{display:flex;align-items:center;gap:12px;margin-top:14px;padding:13px 16px;border-radius:14px;text-decoration:none;background:linear-gradient(135deg,rgba(37,211,102,.12),rgba(22,163,74,.08));border:1px solid rgba(22,163,74,.28);transition:transform .18s ease,box-shadow .18s ease,background .18s ease;}' +
  '.co-wa:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(22,163,74,.22);background:linear-gradient(135deg,rgba(37,211,102,.2),rgba(22,163,74,.12));}' +
  '.co-wa-ic{width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.15rem;box-shadow:0 4px 12px rgba(37,211,102,.35);}' +
  '.co-wa-tx{display:flex;flex-direction:column;line-height:1.3;}' +
  '.co-wa-tx strong{color:#166534;font-size:.9rem;font-weight:800;}' +
  '.co-wa-tx small{color:#15803d;font-size:.76rem;opacity:.85;}' +
  '.co-wa-ar{margin-left:auto;color:#16a34a;font-size:.85rem;}' +
  '.co-item{display:flex;gap:12px;align-items:center;margin-bottom:14px;}' +
  '.co-item img,.co-item-ph{width:56px;height:56px;border-radius:11px;object-fit:cover;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#4f46e5;}' +
  '.co-item strong{display:block;color:#0f172a;font-size:.95rem;}' +
  '.co-item small{color:#64748b;font-size:.78rem;}' +
  '.co-total{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:2px solid rgba(15,23,42,.08);font-size:1.05rem;color:#0f172a;font-weight:800;}' +
  '.co-trust{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:9px;}' +
  '.co-trust li{font-size:.8rem;color:#475569;display:flex;gap:8px;align-items:flex-start;}' +
  '.co-trust i{color:#16a34a;margin-top:2px;}' +
  '.co-done{text-align:center;max-width:620px;margin:0 auto;}' +
  '.co-done-ic{font-size:3.2rem;color:#16a34a;margin-bottom:10px;}' +
  '.co-done h2{color:#0f172a;margin:0 0 10px;}' +
  '.co-done p{color:#475569;}' +
  '.co-done-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px;}' +
  '.co-done-btns .co-submit{width:auto;padding:13px 22px;}' +
  '@media(max-width:900px){.co-grid{grid-template-columns:1fr;}.co-fields{grid-template-columns:1fr;}.co-tabs{flex-direction:column;}#checkoutPage{padding-bottom:110px;}}';

  var st = document.createElement('style');
  st.id = 'checkoutStyles';
  st.textContent = css;
  document.head.appendChild(st);
})();
