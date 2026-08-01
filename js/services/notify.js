// ============================================================
// Vextro Lyntra — Instant Alerts (WhatsApp + Email)
// Naya order aate hi admin ke WhatsApp par message aa jata hai.
// WhatsApp alert CallMeBot ke through jata hai (free).
//
// Setup (ek dafa, 2 minute):
//   1) Apne phone se +34 644 51 95 23 ko WhatsApp par bhejein:
//        I allow callmebot to send me messages
//   2) Bot reply me ek API key dega.
//   3) Neeche WA_CONFIG me phone + apikey daal dein,
//      ya website console me:  vlWhatsAppSet('923228824375','APIKEY')
// ============================================================
(function () {
  'use strict';

  if (window.vlNotify) return;

  var WA_CONFIG = {
    phone: '923228824375',   // admin ka WhatsApp number (country code ke saath, bina +)
    apikey: ''               // CallMeBot se mili API key
  };

  function cfg() {
    var c = { phone: WA_CONFIG.phone, apikey: WA_CONFIG.apikey };
    try {
      var o = JSON.parse(localStorage.getItem('vl_wa') || 'null');
      if (o && o.phone) c.phone = o.phone;
      if (o && o.apikey) c.apikey = o.apikey;
    } catch (e) {}
    return c;
  }

  window.vlWhatsAppConfigured = function () {
    var c = cfg();
    return !!(c.phone && c.apikey);
  };

  window.vlWhatsAppSet = function (phone, apikey) {
    try { localStorage.setItem('vl_wa', JSON.stringify({ phone: String(phone).replace(/\D/g, ''), apikey: apikey })); } catch (e) {}
    return window.vlWhatsAppSend('✅ Vextro Lyntra alerts connected! Ab har naye order par yahan message aayega.');
  };

  window.vlWhatsAppSend = function (text) {
    var c = cfg();
    if (!c.phone || !c.apikey) return Promise.resolve(false);
    var url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(c.phone) +
      '&apikey=' + encodeURIComponent(c.apikey) +
      '&text=' + encodeURIComponent(String(text || '').slice(0, 900));
    // no-cors: response read nahi hota, par message deliver ho jata hai
    return fetch(url, { mode: 'no-cors', cache: 'no-store' })
      .then(function () { return true; })
      .catch(function (e) { console.warn('WhatsApp alert failed:', e && e.message); return false; });
  };

  // Ek hi jagah se sab channels par alert: WhatsApp + email
  window.vlNotify = function (subject, body, fromName) {
    try { window.vlWhatsAppSend(subject + '\n\n' + body); } catch (e) {}
    try { if (window.notifyAdmin) window.notifyAdmin(subject, body, fromName || 'Website'); } catch (e) {}
  };

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
