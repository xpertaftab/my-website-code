/* Vextro Lyntra – Performance helpers v1.0
   - Lazy-loads every non-critical image (static + dynamically injected)
   - Adds async decoding so images never block the main thread
   - Adds fetchpriority to the hero/logo so LCP stays fast
*/
(function () {
    'use strict';

    var CRITICAL = ['assets/logo.png'];

    function isCritical(img) {
        var src = img.getAttribute('src') || '';
        for (var i = 0; i < CRITICAL.length; i++) {
            if (src.indexOf(CRITICAL[i]) !== -1) return true;
        }
        return false;
    }

    function tune(img) {
        if (!img || img.dataset.perfTuned === '1') return;
        img.dataset.perfTuned = '1';
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
        if (isCritical(img)) {
            img.setAttribute('fetchpriority', 'high');
            return;
        }
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    }

    function tuneAll(root) {
        var imgs = (root || document).querySelectorAll ? (root || document).querySelectorAll('img') : [];
        for (var i = 0; i < imgs.length; i++) tune(imgs[i]);
        var frames = (root || document).querySelectorAll ? (root || document).querySelectorAll('iframe') : [];
        for (var j = 0; j < frames.length; j++) {
            if (!frames[j].hasAttribute('loading')) frames[j].setAttribute('loading', 'lazy');
        }
    }

    function start() {
        tuneAll(document);
        if (!('MutationObserver' in window)) return;
        var mo = new MutationObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                var added = records[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'IMG') tune(node);
                    else tuneAll(node);
                }
            }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
