/* ═══════════════════════════════════════════════════════════════════
   Product Views + Comments — mirrors blog pattern
   • Real view tracking (12h throttle) + deterministic fake baseline
   • Public comment form on product detail
   • Admin: Views column + Comments moderation modal
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  window.productStats = window.productStats || {};
  window.productComments = window.productComments || {};
  let __statsLoaded = false;

  async function loadProductData(){
    if (__statsLoaded) return;
    __statsLoaded = true;
    try { const s = await (window.fsLoadMap && window.fsLoadMap('product_stats')); if (s) Object.keys(s).forEach(k => { window.productStats[k] = { views:Number(s[k].views)||0 }; }); } catch(e){}
    try { const c = await (window.fsLoadMap && window.fsLoadMap('product_comments')); if (c) Object.keys(c).forEach(k => { window.productComments[k] = Array.isArray(c[k].items) ? c[k].items : []; }); } catch(e){}
    // localStorage fallback
    try {
      const ls = JSON.parse(localStorage.getItem('vextro_product_stats')||'{}');
      Object.keys(ls).forEach(k => { if (!window.productStats[k]) window.productStats[k] = ls[k]; });
      const lc = JSON.parse(localStorage.getItem('vextro_product_comments')||'{}');
      Object.keys(lc).forEach(k => { if (!window.productComments[k]) window.productComments[k] = lc[k]; });
    } catch(e){}
  }

  function persistStats(id){
    try { localStorage.setItem('vextro_product_stats', JSON.stringify(window.productStats)); } catch(e){}
    if (window.fsSetDoc) { try { window.fsSetDoc('product_stats', String(id), { views: window.productStats[String(id)].views }); } catch(e){} }
  }
  function persistComments(id){
    try { localStorage.setItem('vextro_product_comments', JSON.stringify(window.productComments)); } catch(e){}
    if (window.fsSetDoc) { try { window.fsSetDoc('product_comments', String(id), { items: window.productComments[String(id)] }); } catch(e){} }
  }

  function displayViews(id){
    const key = String(id);
    const real = (window.productStats[key]?.views) || 0;
    const p = window.PRODUCTS_DATA && window.PRODUCTS_DATA[key];
    const bonus = (p && Number(p.fakeViewsBonus)) || 0;
    let hash = 0;
    for (let i=0;i<key.length;i++) hash = ((hash<<5)-hash+key.charCodeAt(i))|0;
    const fake = 180 + (Math.abs(hash) % 1420);
    return fake + real + bonus;
  }
  window.getProductDisplayViews = displayViews;
  window.getProductRealViews = (id) => (window.productStats[String(id)]?.views) || 0;
  function allComments(id){
    const key = String(id);
    const real = window.productComments[key] || [];
    const p = window.PRODUCTS_DATA && window.PRODUCTS_DATA[key];
    const fake = (p && Array.isArray(p.fakeReviews)) ? p.fakeReviews : [];
    return fake.concat(real);
  }
  window.getProductCommentCount = (id) => allComments(id).length;


  async function mountProductViewsAndComments(id){
    await loadProductData();
    const key = String(id);

    // 1. Increment real views (12h throttle per browser)
    const cur = window.productStats[key] || { views:0 };
    try {
      const lsKey = 'product_viewed_' + key;
      const last = Number(localStorage.getItem(lsKey)||0);
      if (!last || (Date.now()-last) > 12*60*60*1000) {
        cur.views = (Number(cur.views)||0) + 1;
        localStorage.setItem(lsKey, String(Date.now()));
        window.productStats[key] = cur;
        persistStats(key);
      } else {
        window.productStats[key] = cur;
      }
    } catch(e){}

    // 2. Inject views badge into detail page header
    const dv = displayViews(key);
    const soldEl = document.getElementById('pdSoldCount');
    if (soldEl && soldEl.parentElement && soldEl.parentElement.parentElement) {
      const meta = soldEl.parentElement.parentElement;
      let vs = meta.querySelector('.pd-views');
      if (!vs) {
        vs = document.createElement('div');
        vs.className = 'pd-views';
        vs.style.cssText = 'display:inline-flex;align-items:center;gap:6px;color:#64748b;font-size:0.9rem;margin-left:12px;';
        vs.innerHTML = `<i class="fa-regular fa-eye" style="color:#94a3b8;"></i> <span class="pd-views-n"></span> views`;
        soldEl.parentElement.appendChild(vs);
      }
      const n = vs.querySelector('.pd-views-n');
      if (n) n.textContent = dv.toLocaleString();
    }

    // 3. Replace fake reviews with real comment section
    const reviewsEl = document.getElementById('pdReviews');
    if (reviewsEl) renderProductComments(id, reviewsEl);
  }
  window.mountProductViewsAndComments = mountProductViewsAndComments;

  function renderProductComments(id, container){
    const key = String(id);
    const items = (window.productComments[key] || []).slice().reverse();
    const formHtml = `
      <form id="pdCommentForm" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px;">
        <div style="font-weight:700;color:#0f172a;margin-bottom:12px;font-size:1.05rem;"><i class="fa-regular fa-pen-to-square" style="color:#ff6b35;"></i> Leave a Review</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <input id="pdcName" required maxlength="60" placeholder="Your name" style="padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;">
          <select id="pdcRating" style="padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;">
            <option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Very Good</option><option value="3">★★★☆☆ Good</option><option value="2">★★☆☆☆ Fair</option><option value="1">★☆☆☆☆ Poor</option>
          </select>
        </div>
        <textarea id="pdcText" required maxlength="1000" rows="3" placeholder="Share your experience with this product..." style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <button type="submit" style="background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border:none;padding:11px 22px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);"><i class="fa-regular fa-paper-plane"></i> Post Review</button>
        </div>
      </form>
      <div style="font-weight:700;color:#0f172a;margin-bottom:14px;font-size:1rem;">${items.length} Review${items.length!==1?'s':''}</div>`;

    const listHtml = items.length === 0
      ? `<div style="text-align:center;color:#94a3b8;padding:24px;background:#f8fafc;border-radius:12px;">Be the first to review this product.</div>`
      : items.map(c => {
          const initial = (c.name||'?').trim().charAt(0).toUpperCase();
          const safeName = (c.name||'Anonymous').replace(/</g,'&lt;');
          const safeText = (c.text||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
          const dt = c.date ? new Date(c.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';
          const stars = '★'.repeat(c.rating||5) + '☆'.repeat(5-(c.rating||5));
          return `<div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f1f5f9;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
              <div style="display:flex;gap:12px;align-items:center;">
                <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;">${initial}</div>
                <div><div style="font-weight:700;color:#0f172a;">${safeName}</div><div style="color:#ffb800;font-size:0.85rem;letter-spacing:1px;">${stars}</div></div>
              </div>
              <div style="color:#94a3b8;font-size:0.8rem;white-space:nowrap;">${dt}</div>
            </div>
            <div style="color:#334155;line-height:1.6;margin-top:8px;">${safeText}</div>
          </div>`;
        }).join('');

    container.innerHTML = formHtml + listHtml;
    const form = document.getElementById('pdCommentForm');
    if (form) form.addEventListener('submit', function(e){ e.preventDefault(); submitProductComment(id); });
  }

  async function submitProductComment(id){
    const name = (document.getElementById('pdcName').value||'').trim();
    const text = (document.getElementById('pdcText').value||'').trim();
    const rating = +(document.getElementById('pdcRating').value)||5;
    if (!name || !text) { alert('Please enter your name and review.'); return; }
    const key = String(id);
    const c = { name:name.slice(0,60), text:text.slice(0,1000), rating, date:new Date().toISOString() };
    const arr = window.productComments[key] || [];
    arr.push(c);
    window.productComments[key] = arr;
    persistComments(key);
    const reviewsEl = document.getElementById('pdReviews');
    if (reviewsEl) renderProductComments(id, reviewsEl);
  }

  // 4. Wrap openProduct to mount views/comments after render
  const origOpen = window.openProduct;
  if (origOpen) {
    window.openProduct = function(id){
      origOpen.apply(this, arguments);
      setTimeout(() => { try { mountProductViewsAndComments(id); } catch(e){ console.error('mount err', e); } }, 50);
    };
  } else {
    // If not defined yet, poll briefly
    let tries = 0;
    const iv = setInterval(() => {
      if (window.openProduct && !window.openProduct.__wrapped) {
        const o = window.openProduct;
        window.openProduct = function(id){ o.apply(this, arguments); setTimeout(() => { try { mountProductViewsAndComments(id); } catch(e){} }, 50); };
        window.openProduct.__wrapped = true;
        clearInterval(iv);
      }
      if (++tries > 40) clearInterval(iv);
    }, 250);
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ADMIN — Enhance Products view with Views + Comments
  // ═══════════════════════════════════════════════════════════════
  window.adminViewProductComments = function(id){
    const key = String(id);
    const items = (window.productComments[key] || []).slice().reverse();
    const p = window.PRODUCTS_DATA?.[id];
    const html = `
      <h2 style="margin:0 0 8px;font-size:1.3rem;font-weight:800;">Comments & Reviews</h2>
      <p style="color:#64748b;margin:0 0 20px;">Product: <b>${(p?.title||id).replace(/</g,'&lt;')}</b> · ${items.length} review${items.length!==1?'s':''}</p>
      ${items.length===0 ? `<div style="padding:40px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:12px;"><i class="fa-solid fa-comments" style="font-size:2rem;"></i><p style="margin-top:10px;">No reviews yet</p></div>` : `
      <div style="display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto;">
        ${items.map((c,idx) => {
          const stars = '★'.repeat(c.rating||5) + '☆'.repeat(5-(c.rating||5));
          const safeName = (c.name||'?').replace(/</g,'&lt;');
          const safeText = (c.text||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
          const dt = c.date ? new Date(c.date).toLocaleString() : '';
          const origIdx = ((window.productComments[key]||[]).length - 1 - idx);
          return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;">
              <div><b style="color:#0f172a;">${safeName}</b> <span style="color:#ffb800;">${stars}</span></div>
              <div style="display:flex;gap:8px;align-items:center;"><span style="color:#94a3b8;font-size:0.78rem;">${dt}</span><button onclick="adminDeleteProductComment('${id}',${origIdx})" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;"><i class="fa-solid fa-trash"></i></button></div>
            </div>
            <div style="color:#334155;font-size:0.9rem;">${safeText}</div>
          </div>`;
        }).join('')}
      </div>`}
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div style="color:#64748b;font-size:0.85rem;"><i class="fa-regular fa-eye"></i> <b>${window.getProductRealViews(id)}</b> real views · <b>${window.getProductDisplayViews(id).toLocaleString()}</b> displayed to public</div>
        <button onclick="window.closeAdminOverlay()" style="background:rgba(15,23,42,0.05);border:1px solid rgba(15,23,42,0.12);padding:10px 20px;border-radius:10px;color:#0f172a;font-weight:600;cursor:pointer;">Close</button>
      </div>
    `;
    if (window.showAdminOverlay) window.showAdminOverlay(html);
  };

  window.adminDeleteProductComment = function(id, idx){
    if (!confirm('Delete this review?')) return;
    const key = String(id);
    const arr = window.productComments[key] || [];
    arr.splice(idx, 1);
    window.productComments[key] = arr;
    persistComments(key);
    window.adminViewProductComments(id);
  };

  // Wrap admin products render to add Views + Comments columns
  function enhanceProductsTable(){
    const tbl = document.querySelector('#adminContent table.admin-table');
    if (!tbl || tbl.dataset.pxEnhanced) return;
    // Only enhance products table (has "Sold" column)
    const headers = Array.from(tbl.querySelectorAll('thead th')).map(t=>t.textContent.trim());
    if (!headers.includes('Sold')) return;
    tbl.dataset.pxEnhanced = '1';

    // Insert Views + Reviews columns before "Sold"
    const soldIdx = headers.indexOf('Sold');
    const headRow = tbl.querySelector('thead tr');
    const th1 = document.createElement('th'); th1.textContent = 'Views';
    const th2 = document.createElement('th'); th2.textContent = 'Reviews';
    headRow.insertBefore(th1, headRow.children[soldIdx]);
    headRow.insertBefore(th2, headRow.children[soldIdx+1]);

    loadProductData().then(() => {
      Array.from(tbl.querySelectorAll('tbody tr')).forEach(tr => {
        const editBtn = tr.querySelector('button[onclick*="adminEditProductNew"]');
        const m = editBtn && editBtn.getAttribute('onclick').match(/'([^']+)'/);
        const pid = m ? m[1] : null;
        if (!pid) return;
        const views = window.getProductDisplayViews(pid);
        const real = window.getProductRealViews(pid);
        const cCount = window.getProductCommentCount(pid);
        const c1 = document.createElement('td');
        c1.innerHTML = `<div style="font-weight:700;color:#0f172a;">${views.toLocaleString()}</div><div style="font-size:0.7rem;color:#94a3b8;">${real} real</div>`;
        const c2 = document.createElement('td');
        c2.innerHTML = `<button onclick="adminViewProductComments('${pid}')" style="background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-comments"></i> ${cCount}</button>`;
        tr.insertBefore(c1, tr.children[soldIdx]);
        tr.insertBefore(c2, tr.children[soldIdx+1]);
      });
    });
  }

  // Observe admin content for products table renders
  const mo = new MutationObserver(() => enhanceProductsTable());
  const start = () => { const c = document.getElementById('adminContent'); if (c) { mo.observe(c, { childList:true, subtree:true }); enhanceProductsTable(); } else setTimeout(start, 500); };
  start();

})();
