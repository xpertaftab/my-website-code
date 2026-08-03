// ============================================================
// Vextro Lyntra — Pretty Order IDs
// Format: VL-YYMMDD-XXXX  (e.g. VL-260803-7K42)
// ============================================================
(function () {
  'use strict';

  var ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I confusion

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function datePart(ts) {
    var d = ts ? new Date(ts) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  function randPart(len) {
    var s = '';
    for (var i = 0; i < (len || 4); i++) {
      s += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return s;
  }

  // Generate a brand-new order id
  window.vlNewOrderId = function () {
    return 'VL-' + datePart(Date.now()) + '-' + randPart(4);
  };

  // Display number for any order (new or legacy)
  window.vlOrderNo = function (o) {
    if (!o) return '';
    if (typeof o === 'string') o = { id: o };
    if (o.orderNo) return String(o.orderNo);
    var id = String(o.id || '');
    if (/^VL-/i.test(id)) return id.toUpperCase();
    // Legacy ids like ord_msdi123abcd → VL-260803-BCD1
    var tail = id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    while (tail.length < 4) tail = 'X' + tail;
    return 'VL-' + datePart(o.createdAt) + '-' + tail;
  };
})();
