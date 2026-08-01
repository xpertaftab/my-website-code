// ============================================================
// Vextro Lyntra — Instant Alerts (Telegram)
// Naya order / message aate hi admin ke phone par Telegram notification.
// Config: neeche TELEGRAM_CONFIG me bot token + chat id daalein,
// ya browser console me:
//   localStorage.setItem('vl_tg', JSON.stringify({token:'...', chatId:'...'}))
// ============================================================
(function () {
  'use strict';

  if (window.vlNotify) return;

  var TELEGRAM_CONFIG = {
    token: '',    // BotFather se mila token  (e.g. 123456:AAE...)
    chatId: ''    // aapka chat id (@userinfobot se milta hai)
  };

  function cfg() {
    var c = { token: TELEGRAM_CONFIG.token, chatId: TELEGRAM_CONFIG.chatId };
    try {
      var o = JSON.parse(localStorage.getItem('vl_tg') || 'null');
      if (o && o.token) c.token = o.token;
      if (o && o.chatId) c.chatId = o.chatId;
    } catch (e) {}
    return c;
  }

  window.vlTelegramConfigured = function () {
    var c = cfg();
    return !!(c.token && c.chatId);
  };

  window.vlTelegramSet = function (token, chatId) {
    try { localStorage.setItem('vl_tg', JSON.stringify({ token: token, chatId: chatId })); } catch (e) {}
    return window.vlTelegramSend('✅ Vextro Lyntra alerts connected!');
  };

  window.vlTelegramSend = function (text) {
    var c = cfg();
    if (!c.token || !c.chatId) return Promise.resolve(false);
    return fetch('https://api.telegram.org/bot' + c.token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: c.chatId,
        text: String(text || '').slice(0, 3800),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }).then(function (r) { return r.ok; })
      .catch(function (e) { console.warn('Telegram alert failed:', e && e.message); return false; });
  };

  // Ek hi jagah se sab channels par alert: Telegram + email
  window.vlNotify = function (subject, body, fromName) {
    try { window.vlTelegramSend('<b>' + escHtml(subject) + '</b>\n\n' + escHtml(body)); } catch (e) {}
    try { if (window.notifyAdmin) window.notifyAdmin(subject, body, fromName || 'Website'); } catch (e) {}
  };

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  // Naye order aate hi alert (checkout.js is event ko fire karta hai)
  window.addEventListener('vl:new-order', function (ev) {
    var o = (ev && ev.detail) || {};
    window.vlNotify(
      '🛒 NEW ORDER — ' + (o.package || 'Item'),
      'Order ID: ' + o.id +
      '\nItem: ' + (o.package || '-') +
      '\nAmount: ' + (o.currency || '') + ' ' + (o.amount || '') +
      (o.amountPkr ? ' (~PKR ' + o.amountPkr + ')' : '') +
      '\nMethod: ' + (o.paymentMethod || '-') + ' (' + (o.paymentRegion || '-') + ')' +
      '\nTxID: ' + (o.txn || '-') +
      '\nBuyer: ' + (o.buyerName || '-') +
      '\nEmail: ' + (o.buyerEmail || '-') +
      '\nPhone: ' + (o.buyerPhone || '-') +
      '\nStatus: pending — admin panel me verify karein.',
      o.buyerName
    );
  });
})();
