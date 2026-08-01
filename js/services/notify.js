// ============================================================
// Vextro Lyntra — Instant Email Alerts
// Naya order aate hi admin ki email par alert chala jata hai.
// EmailJS use hota hai (config js/services/main.js me).
//
// Test karne ke liye console me:  vlTestEmail()
// ============================================================
(function () {
  'use strict';

  if (window.vlNotify) return;

  var QUEUE_KEY = 'vl_mail_queue';
  var SERVICE = 'service_60ugcjb';
  var TEMPLATE = 'fa4k04x';
  var PUBLIC_KEY = '8zOJpAjU7J2LOGB0l';
  var ADMIN_EMAIL = 'vextrolyntra@gmail.com';

  function ready() {
    if (typeof emailjs === 'undefined') return false;
    try { if (!window.__vlEmailInit) { emailjs.init(PUBLIC_KEY); window.__vlEmailInit = true; } } catch (e) {}
    return true;
  }

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function writeQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-20))); } catch (e) {}
  }
  function enqueue(payload) {
    var q = readQueue();
    q.push(payload);
    writeQueue(q);
  }

  function sendPayload(payload) {
    if (!ready()) return Promise.reject(new Error('emailjs not loaded'));
    return emailjs.send(SERVICE, TEMPLATE, payload);
  }

  // 3 tries with backoff; agar fir bhi fail ho to queue me save (next visit par retry)
  function sendWithRetry(payload, tries) {
    tries = tries || 0;
    return sendPayload(payload).catch(function (err) {
      if (tries < 2) {
        return new Promise(function (r) { setTimeout(r, 1500 * (tries + 1)); })
          .then(function () { return sendWithRetry(payload, tries + 1); });
      }
      console.warn('Email alert failed, queued for retry:', err && (err.text || err.message));
      enqueue(payload);
      return false;
    });
  }

  function buildPayload(subject, body, fromName) {
    return {
      title: '[Vextro Lyntra] ' + subject,
      subject: '[Vextro Lyntra] ' + subject,
      name: fromName || 'Vextro Lyntra System',
      email: ADMIN_EMAIL,
      to_email: ADMIN_EMAIL,
      reply_to: ADMIN_EMAIL,
      message: String(body || '') + '\n\n---\nSent automatically from Vextro Lyntra.\nTime: ' + new Date().toLocaleString()
    };
  }

  // Ek hi entry point — sab jagah se yahi call hota hai
  window.vlNotify = function (subject, body, fromName) {
    return sendWithRetry(buildPayload(subject, body, fromName));
  };

  window.vlTestEmail = function () {
    return window.vlNotify('TEST ALERT', 'Yeh ek test email hai. Agar yeh mil gayi to order alerts kaam kar rahe hain.', 'Test')
      .then(function (r) {
        console.log(r === false ? '❌ Email fail — queue me save ho gaya' : '✅ Test email bhej di gayi');
        return r;
      });
  };

  // Page load par pending emails dobara bhejo
  function flushQueue() {
    var q = readQueue();
    if (!q.length || !ready()) return;
    writeQueue([]);
    q.forEach(function (p) { sendPayload(p).catch(function () { enqueue(p); }); });
  }
  if (document.readyState === 'complete') setTimeout(flushQueue, 2500);
  else window.addEventListener('load', function () { setTimeout(flushQueue, 2500); });

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
