// ============================================================
// Vextro Lyntra — Multi-currency helper
// USD is the base. Admin can switch display currency; all
// revenue numbers get converted from their stored currency.
// ============================================================
(function () {
  'use strict';

  var CURRENCIES = [
    { code: 'USD',  label: 'US Dollar',         symbol: '$',    rate: 1,      flag: '🇺🇸' },
    { code: 'USDT', label: 'Tether (USDT)',     symbol: '₮',    rate: 1,      flag: '🪙' },
    { code: 'PKR',  label: 'Pakistani Rupee',   symbol: 'Rs ',  rate: 280,    flag: '🇵🇰' },
    { code: 'INR',  label: 'Indian Rupee',      symbol: '₹',    rate: 88,     flag: '🇮🇳' },
    { code: 'BDT',  label: 'Bangladeshi Taka',  symbol: '৳',    rate: 120,    flag: '🇧🇩' },
    { code: 'LKR',  label: 'Sri Lankan Rupee',  symbol: 'Rs ',  rate: 300,    flag: '🇱🇰' },
    { code: 'AED',  label: 'UAE Dirham',        symbol: 'AED ', rate: 3.67,   flag: '🇦🇪' },
    { code: 'SAR',  label: 'Saudi Riyal',       symbol: 'SAR ', rate: 3.75,   flag: '🇸🇦' },
    { code: 'QAR',  label: 'Qatari Riyal',      symbol: 'QAR ', rate: 3.64,   flag: '🇶🇦' },
    { code: 'KWD',  label: 'Kuwaiti Dinar',     symbol: 'KWD ', rate: 0.31,   flag: '🇰🇼' },
    { code: 'OMR',  label: 'Omani Rial',        symbol: 'OMR ', rate: 0.385,  flag: '🇴🇲' },
    { code: 'BHD',  label: 'Bahraini Dinar',    symbol: 'BHD ', rate: 0.376,  flag: '🇧🇭' },
    { code: 'GBP',  label: 'British Pound',     symbol: '£',    rate: 0.78,   flag: '🇬🇧' },
    { code: 'EUR',  label: 'Euro',              symbol: '€',    rate: 0.92,   flag: '🇪🇺' },
    { code: 'CHF',  label: 'Swiss Franc',       symbol: 'CHF ', rate: 0.88,   flag: '🇨🇭' },
    { code: 'CAD',  label: 'Canadian Dollar',   symbol: 'C$',   rate: 1.36,   flag: '🇨🇦' },
    { code: 'AUD',  label: 'Australian Dollar', symbol: 'A$',   rate: 1.52,   flag: '🇦🇺' },
    { code: 'NZD',  label: 'NZ Dollar',         symbol: 'NZ$',  rate: 1.65,   flag: '🇳🇿' },
    { code: 'SGD',  label: 'Singapore Dollar',  symbol: 'S$',   rate: 1.34,   flag: '🇸🇬' },
    { code: 'MYR',  label: 'Malaysian Ringgit', symbol: 'RM ',  rate: 4.50,   flag: '🇲🇾' },
    { code: 'IDR',  label: 'Indonesian Rupiah', symbol: 'Rp ',  rate: 16000,  flag: '🇮🇩' },
    { code: 'PHP',  label: 'Philippine Peso',   symbol: '₱',    rate: 57,     flag: '🇵🇭' },
    { code: 'CNY',  label: 'Chinese Yuan',      symbol: '¥',    rate: 7.2,    flag: '🇨🇳' },
    { code: 'JPY',  label: 'Japanese Yen',      symbol: '¥',    rate: 150,    flag: '🇯🇵' },
    { code: 'TRY',  label: 'Turkish Lira',      symbol: '₺',    rate: 34,     flag: '🇹🇷' },
    { code: 'EGP',  label: 'Egyptian Pound',    symbol: 'E£',   rate: 48,     flag: '🇪🇬' },
    { code: 'NGN',  label: 'Nigerian Naira',    symbol: '₦',    rate: 1500,   flag: '🇳🇬' },
    { code: 'ZAR',  label: 'South African Rand',symbol: 'R ',   rate: 18,     flag: '🇿🇦' },
    { code: 'BRL',  label: 'Brazilian Real',    symbol: 'R$',   rate: 5.4,    flag: '🇧🇷' },
    { code: 'MXN',  label: 'Mexican Peso',      symbol: 'MX$',  rate: 18,     flag: '🇲🇽' },
    { code: 'RUB',  label: 'Russian Ruble',     symbol: '₽',    rate: 92,     flag: '🇷🇺' }
  ];

  var KEY = 'vl_display_currency';

  function get(code) {
    code = String(code || '').toUpperCase();
    for (var i = 0; i < CURRENCIES.length; i++) if (CURRENCIES[i].code === code) return CURRENCIES[i];
    return null;
  }

  var VLC = {
    list: CURRENCIES,
    get: get,

    current: function () {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      return get(saved) || get('USD');
    },

    set: function (code) {
      if (!get(code)) return;
      try { localStorage.setItem(KEY, String(code).toUpperCase()); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('vl:currency-change', { detail: String(code).toUpperCase() })); } catch (e) {}
    },

    // Convert any stored amount to USD (base)
    toUsd: function (amount, fromCode) {
      var n = Number(amount || 0);
      var c = get(fromCode) || get('USD');
      return c.rate ? n / c.rate : n;
    },

    // Convert a USD amount to the active display currency
    fromUsd: function (usd, toCode) {
      var c = get(toCode) || VLC.current();
      return Number(usd || 0) * c.rate;
    },

    // Order helper: normalize an order record to USD
    orderUsd: function (order) {
      if (!order) return 0;
      return VLC.toUsd(order.amount, order.currency || 'USD');
    },

    // Format a USD amount in the active (or given) display currency
    format: function (usd, toCode) {
      var c = get(toCode) || VLC.current();
      var v = VLC.fromUsd(usd, c.code);
      var dec = (c.rate >= 50 || v >= 1000) ? 0 : 2;
      return c.symbol + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    },

    // Format an amount already in a specific currency (no conversion)
    formatRaw: function (amount, code) {
      var c = get(code) || get('USD');
      var v = Number(amount || 0);
      var dec = (c.rate >= 50 || v >= 1000) ? 0 : 2;
      return c.symbol + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    },

    // <select> markup for the admin currency picker
    selectHtml: function (id, extraStyle) {
      var cur = VLC.current().code;
      var opts = CURRENCIES.map(function (c) {
        return '<option value="' + c.code + '"' + (c.code === cur ? ' selected' : '') + '>' +
          c.flag + '  ' + c.code + ' — ' + c.label + '</option>';
      }).join('');
      return '<select id="' + (id || 'vlCurrencySelect') + '" onchange="VLCurrency.set(this.value)" ' +
        'style="padding:10px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:10px;' +
        'color:#0f172a;font-weight:700;font-size:0.85rem;cursor:pointer;' + (extraStyle || '') + '">' + opts + '</select>';
    }
  };

  window.VLCurrency = VLC;
})();
