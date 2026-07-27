/* Vextro Lyntra – Marketing helpers v1.0
   - Newsletter subscribe (Firestore `newsletter` collection + local fallback)
   - Social share buttons for the current page / product
*/
(function () {
    'use strict';

    function isEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
    }

    function saveLocal(email) {
        try {
            var list = JSON.parse(localStorage.getItem('newsletter_subs') || '[]');
            if (list.indexOf(email) === -1) list.push(email);
            localStorage.setItem('newsletter_subs', JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    async function saveRemote(email) {
        try {
            if (window.FirestoreData && typeof window.FirestoreData.addDoc === 'function') {
                await window.FirestoreData.addDoc('newsletter', {
                    email: email,
                    source: location.hash || '/',
                    createdAt: new Date().toISOString()
                });
                return true;
            }
        } catch (e) { /* silent – local fallback already stored */ }
        return false;
    }

    window.subscribeNewsletter = function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        var input = document.getElementById('newsletterEmail');
        var msg = document.getElementById('newsletterMsg');
        var email = input ? input.value.trim().toLowerCase() : '';

        function show(text, cls) {
            if (!msg) return;
            msg.textContent = text;
            msg.className = 'fn-msg ' + cls;
        }

        if (!isEmail(email)) {
            show('Please enter a valid email address.', 'err');
            return false;
        }

        saveLocal(email);
        show('Subscribing…', 'ok');
        saveRemote(email).then(function () {
            show('🎉 Thanks! You are subscribed. Check your inbox for updates.', 'ok');
            if (input) input.value = '';
        });
        return false;
    };

    /* ---------- Social sharing ---------- */
    window.shareCurrentPage = function (network, customTitle) {
        var url = encodeURIComponent(location.href);
        var title = encodeURIComponent(customTitle || document.title);
        var map = {
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
            twitter: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
            linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
            whatsapp: 'https://wa.me/?text=' + title + '%20' + url
        };
        if (network === 'copy') {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(location.href);
                alert('Link copied!');
            }
            return;
        }
        if (map[network]) window.open(map[network], '_blank', 'noopener,width=640,height=560');
    };
})();
