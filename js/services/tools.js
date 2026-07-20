/* Tools system — each tool has its own full page at #/tools/<id>
   Detail page is redesigned to match the site's blog-hero + section-container language. */
(function () {
  'use strict';

  let ALL_TOOLS = [];
  let ACTIVE_CAT = 'All';
  let SEARCH = '';
  let CURRENT_TOOL = null;

  async function loadTools() {
    if (ALL_TOOLS.length) return ALL_TOOLS;
    try {
      const res = await fetch('data/tools.json', { cache: 'no-store' });
      ALL_TOOLS = await res.json();
    } catch (e) { console.error('tools.json load failed', e); ALL_TOOLS = []; }
    return ALL_TOOLS;
  }

  const safe = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function categories() {
    const set = new Set(['All']);
    ALL_TOOLS.forEach((t) => t.category && set.add(t.category));
    return Array.from(set);
  }

  function filtered() {
    const q = SEARCH.trim().toLowerCase();
    return ALL_TOOLS.filter((t) => {
      if (ACTIVE_CAT !== 'All' && t.category !== ACTIVE_CAT) return false;
      if (!q) return true;
      return ((t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q));
    });
  }

  function badgeHtml(b) {
    if (!b) return '';
    const map = {
      'Pro': 'background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;',
      'New': 'background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;',
      'Free': 'background:rgba(16,185,129,0.12);color:#059669;',
    };
    return `<span style="position:absolute;top:14px;right:14px;${map[b] || map.Free}font-size:0.68rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.5px;">${safe(b)}</span>`;
  }

  function cardHtml(t) {
    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';
    return `
      <div class="tool-card" data-tool-open="${safe(t.id)}" style="position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;display:flex;flex-direction:column;gap:14px;cursor:pointer;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 14px 34px rgba(15,23,42,0.10)';this.style.borderColor='${color}55';" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#e2e8f0';">
        ${badgeHtml(t.badge)}
        <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,${color}22,${color}0a);color:${color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="${icon}"></i></div>
        <div>
          <div style="font-size:0.7rem;font-weight:800;color:${color};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${safe(t.category)}</div>
          <h3 style="margin:0 0 8px;color:#0f172a;font-size:1.15rem;font-weight:800;">${safe(t.title)}</h3>
          <p style="margin:0;color:#64748b;font-size:0.92rem;line-height:1.55;">${safe(t.description)}</p>
        </div>
        <div style="margin-top:auto;">
          <span style="display:inline-flex;align-items:center;gap:8px;background:${color};color:#fff;padding:10px 18px;border-radius:10px;font-weight:700;font-size:0.9rem;">Open Tool <i class="fa-solid fa-arrow-right" style="font-size:0.8rem;"></i></span>
        </div>
      </div>`;
  }

  function renderGrid() {
    const page = document.getElementById('toolsPage');
    if (!page) return;
    const detail = document.getElementById('toolDetailView');
    if (detail) detail.style.display = 'none';
    const gridWrap = document.getElementById('toolsGridWrap');
    if (gridWrap) gridWrap.style.display = 'block';

    const grid = document.getElementById('toolsGrid');
    const empty = document.getElementById('toolsEmpty');
    if (!grid) return;
    const list = filtered();
    if (!list.length) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; }
    else {
      if (empty) empty.style.display = 'none';
      grid.innerHTML = list.map(cardHtml).join('');
      grid.querySelectorAll('[data-tool-open]').forEach((el) => {
        el.addEventListener('click', () => openToolPage(el.getAttribute('data-tool-open')));
      });
    }
    const catBar = document.getElementById('toolsCategories');
    if (catBar) {
      catBar.innerHTML = categories().map((c) => `<button class="blog-cat-btn${c === ACTIVE_CAT ? ' active' : ''}" data-cat="${safe(c)}">${safe(c)}</button>`).join('');
      catBar.querySelectorAll('button').forEach((btnEl) => {
        btnEl.addEventListener('click', () => {
          ACTIVE_CAT = btnEl.dataset.cat;
          catBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btnEl));
          renderGrid();
        });
      });
    }
  }

  /* ============ TOOL DETAIL PAGE (redesigned to match site style) ============ */
  function ensureDetailContainer() {
    let d = document.getElementById('toolDetailView');
    if (d) return d;
    const page = document.getElementById('toolsPage');
    if (!page) return null;
    d = document.createElement('div');
    d.id = 'toolDetailView';
    d.style.display = 'none';
    page.appendChild(d);
    return d;
  }

  function relatedTools(current, n = 4) {
    return ALL_TOOLS.filter((t) => t.id !== current.id && t.category === current.category).slice(0, n)
      .concat(ALL_TOOLS.filter((t) => t.id !== current.id && t.category !== current.category)).slice(0, n);
  }

  function openToolPage(id) {
    const t = ALL_TOOLS.find((x) => x.id === id);
    if (!t) return;
    CURRENT_TOOL = id;
    if (location.hash !== '#/tools/' + id) history.pushState({ tool: id }, '', '#/tools/' + id);
    document.title = `${t.title} — Free Online Tool | Vextrolyntra`;

    const gridWrap = document.getElementById('toolsGridWrap');
    if (gridWrap) gridWrap.style.display = 'none';
    const detail = ensureDetailContainer();
    if (!detail) return;
    detail.style.display = 'block';

    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';

    detail.innerHTML = `
      <!-- Hero (matches site .blog-hero style) -->
      <section class="blog-hero" style="background:linear-gradient(135deg,${color}18 0%,#ffffff 60%,${color}0a 100%);padding-bottom:32px;">
        <div class="section-container">
          <nav aria-label="breadcrumb" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:0.85rem;color:#64748b;margin-bottom:18px;font-weight:600;">
            <a href="javascript:void(0)" onclick="showPage('home')" style="color:#64748b;text-decoration:none;">Home</a>
            <i class="fa-solid fa-chevron-right" style="font-size:0.65rem;color:#cbd5e1;"></i>
            <a href="javascript:void(0)" id="tdBackCrumb" style="color:#64748b;text-decoration:none;">Tools</a>
            <i class="fa-solid fa-chevron-right" style="font-size:0.65rem;color:#cbd5e1;"></i>
            <span style="color:${color};font-weight:700;">${safe(t.title)}</span>
          </nav>
          <div class="badge blog-hero-badge" style="background:${color}20;color:${color};">
            <i class="${icon}"></i> ${safe(t.category).toUpperCase()}
          </div>
          <h1>${safe(t.title.replace(/(&|and|to)/i, (m) => m))} <span class="gradient-text" style="background:linear-gradient(135deg,${color},${color}aa);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Tool</span></h1>
          <p class="blog-subtitle">${safe(t.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;">
            <span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;padding:8px 14px;border-radius:999px;font-size:0.82rem;font-weight:700;color:#0f172a;"><i class="fa-solid fa-bolt" style="color:#f59e0b;"></i> Instant</span>
            <span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;padding:8px 14px;border-radius:999px;font-size:0.82rem;font-weight:700;color:#0f172a;"><i class="fa-solid fa-lock" style="color:#10b981;"></i> 100% Private</span>
            <span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;padding:8px 14px;border-radius:999px;font-size:0.82rem;font-weight:700;color:#0f172a;"><i class="fa-solid fa-heart" style="color:#ef4444;"></i> Free Forever</span>
          </div>
        </div>
      </section>

      <!-- Body -->
      <section style="padding:40px 0 60px;background:#f8fafc;">
        <div class="section-container" style="display:grid;grid-template-columns:minmax(0,1fr);gap:24px;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px;box-shadow:0 4px 20px rgba(15,23,42,0.04);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #f1f5f9;">
              <div style="width:44px;height:44px;border-radius:12px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.15rem;box-shadow:0 8px 20px ${color}55;"><i class="${icon}"></i></div>
              <div>
                <div style="font-size:0.7rem;font-weight:800;color:${color};letter-spacing:1px;text-transform:uppercase;">Tool</div>
                <div style="font-weight:800;color:#0f172a;font-size:1.05rem;">${safe(t.title)}</div>
              </div>
            </div>
            <div id="toolBody"></div>
          </div>

          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <button id="toolBackBtn" style="display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0f172a;border:1px solid #e2e8f0;padding:12px 20px;border-radius:12px;font-weight:700;cursor:pointer;font-size:0.9rem;">
              <i class="fa-solid fa-arrow-left"></i> Back to All Tools
            </button>
            <button id="toolShareBtn" style="display:inline-flex;align-items:center;gap:8px;background:${color};color:#fff;border:none;padding:12px 20px;border-radius:12px;font-weight:700;cursor:pointer;font-size:0.9rem;">
              <i class="fa-solid fa-share-nodes"></i> Share Tool
            </button>
          </div>

          <div id="toolRelated" style="margin-top:8px;"></div>
        </div>
      </section>`;

    document.getElementById('toolBackBtn').addEventListener('click', backToGrid);
    document.getElementById('tdBackCrumb').addEventListener('click', backToGrid);
    document.getElementById('toolShareBtn').addEventListener('click', () => {
      const url = location.origin + location.pathname + '#/tools/' + t.id;
      if (navigator.share) navigator.share({ title: t.title, url }).catch(() => copyText(url));
      else copyText(url);
    });

    // Render related
    const rel = document.getElementById('toolRelated');
    const others = relatedTools(t, 4);
    if (others.length) {
      rel.innerHTML = `
        <h3 style="margin:20px 0 14px;color:#0f172a;font-size:1.15rem;font-weight:800;">You may also like</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;">
          ${others.map((o) => `
            <div data-tool-open="${safe(o.id)}" style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;cursor:pointer;display:flex;gap:12px;align-items:center;transition:transform 0.15s,box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 24px rgba(15,23,42,0.08)';" onmouseout="this.style.transform='';this.style.boxShadow='';">
              <div style="width:40px;height:40px;border-radius:10px;background:${o.color}18;color:${o.color};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;"><i class="${o.icon}"></i></div>
              <div style="min-width:0;"><div style="font-size:0.9rem;font-weight:800;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safe(o.title)}</div><div style="font-size:0.72rem;color:${o.color};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${safe(o.category)}</div></div>
            </div>`).join('')}
        </div>`;
      rel.querySelectorAll('[data-tool-open]').forEach((el) => el.addEventListener('click', () => openToolPage(el.getAttribute('data-tool-open'))));
    }

    const impl = TOOLS[id];
    const body = document.getElementById('toolBody');
    if (impl) impl(body, t);
    else body.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#64748b;"><i class="fa-solid fa-hammer" style="font-size:2rem;color:#cbd5e1;display:block;margin-bottom:12px;"></i><b>Coming Soon</b><p style="margin-top:8px;font-size:0.9rem;">This tool is under development.</p></div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToGrid() {
    CURRENT_TOOL = null;
    if (location.hash.startsWith('#/tools/')) history.pushState({}, '', '#/tools');
    document.title = 'Free Online Tools | Vextrolyntra';
    renderGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#\/tools\/(.+)$/);
    if (m) openToolPage(m[1]);
    else if (CURRENT_TOOL) backToGrid();
  });

  /* ============ SHARED UI HELPERS ============ */
  const btn = (color = '#3b82f6') => `background:${color};color:#fff;border:none;padding:11px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;box-shadow:0 4px 12px ${color}40;transition:transform 0.15s,box-shadow 0.15s;`;
  const btnGhost = 'background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;padding:11px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;';
  const inputCss = 'width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;background:#fff;color:#0f172a;';
  const areaCss = inputCss + 'min-height:140px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;';
  const rowCss = 'display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;';
  const labelCss = 'display:block;font-size:0.85rem;font-weight:700;color:#334155;margin-bottom:6px;';
  function copyText(text) { navigator.clipboard.writeText(text).then(() => flash('Copied to clipboard!')); }
  function flash(msg) {
    let f = document.getElementById('toolFlash');
    if (!f) { f = document.createElement('div'); f.id = 'toolFlash'; f.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;z-index:10000;box-shadow:0 12px 32px rgba(0,0,0,0.3);'; document.body.appendChild(f); }
    f.textContent = msg; f.style.display = 'block';
    clearTimeout(f._t); f._t = setTimeout(() => (f.style.display = 'none'), 1800);
  }

  /* ============ TOOL IMPLEMENTATIONS ============ */
  const TOOLS = {};

  TOOLS['json-formatter'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Paste JSON</label><textarea id="jf-in" style="${areaCss}" placeholder='{"hello":"world"}'></textarea><div style="${rowCss}"><button id="jf-beautify" style="${btn('#3b82f6')}">Beautify</button><button id="jf-minify" style="${btnGhost}">Minify</button><button id="jf-copy" style="${btnGhost}">Copy Result</button></div><label style="${labelCss};margin-top:16px;">Result</label><textarea id="jf-out" style="${areaCss}" readonly></textarea><div id="jf-status" style="margin-top:8px;font-size:0.85rem;font-weight:700;"></div>`;
    const run = (indent) => {
      try { const p = JSON.parse(body.querySelector('#jf-in').value); body.querySelector('#jf-out').value = JSON.stringify(p, null, indent); body.querySelector('#jf-status').textContent = '✓ Valid JSON'; body.querySelector('#jf-status').style.color = '#10b981'; }
      catch (e) { body.querySelector('#jf-out').value = ''; body.querySelector('#jf-status').textContent = '✗ ' + e.message; body.querySelector('#jf-status').style.color = '#ef4444'; }
    };
    body.querySelector('#jf-beautify').onclick = () => run(2);
    body.querySelector('#jf-minify').onclick = () => run(0);
    body.querySelector('#jf-copy').onclick = () => copyText(body.querySelector('#jf-out').value);
  };

  TOOLS['password-generator'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Length: <span id="pg-len-val">16</span></label><input id="pg-len" type="range" min="6" max="64" value="16" style="width:100%;"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px;"><label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-upper" checked> Uppercase</label><label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-lower" checked> Lowercase</label><label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-num" checked> Numbers</label><label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-sym" checked> Symbols</label></div><div style="${rowCss}"><button id="pg-gen" style="${btn('#10b981')}">Generate</button><button id="pg-copy" style="${btnGhost}">Copy</button></div><input id="pg-out" style="${inputCss};margin-top:14px;font-family:ui-monospace,monospace;font-size:1.05rem;" readonly>`;
    const gen = () => {
      const len = +body.querySelector('#pg-len').value;
      body.querySelector('#pg-len-val').textContent = len;
      let cs = '';
      if (body.querySelector('#pg-upper').checked) cs += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (body.querySelector('#pg-lower').checked) cs += 'abcdefghijklmnopqrstuvwxyz';
      if (body.querySelector('#pg-num').checked) cs += '0123456789';
      if (body.querySelector('#pg-sym').checked) cs += '!@#$%^&*()-_=+[]{}<>?';
      if (!cs) { flash('Select at least one option'); return; }
      const arr = new Uint32Array(len); crypto.getRandomValues(arr);
      let out = ''; for (let i = 0; i < len; i++) out += cs[arr[i] % cs.length];
      body.querySelector('#pg-out').value = out;
    };
    body.querySelector('#pg-len').oninput = () => (body.querySelector('#pg-len-val').textContent = body.querySelector('#pg-len').value);
    body.querySelector('#pg-gen').onclick = gen;
    body.querySelector('#pg-copy').onclick = () => copyText(body.querySelector('#pg-out').value);
    gen();
  };

  TOOLS['qr-generator'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Text or URL</label><input id="qr-in" style="${inputCss}" value="https://vextrolyntra.online"><label style="${labelCss};margin-top:12px;">Size (px)</label><input id="qr-size" type="number" min="100" max="800" value="300" style="${inputCss}"><div style="${rowCss}"><button id="qr-gen" style="${btn('#f97316')}">Generate QR</button><a id="qr-dl" style="${btnGhost};text-decoration:none;display:inline-block;" download="qrcode.png">Download</a></div><div style="margin-top:20px;text-align:center;"><img id="qr-img" alt="QR" style="max-width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#fff;display:none;"></div>`;
    const run = () => {
      const txt = body.querySelector('#qr-in').value.trim();
      if (!txt) { flash('Enter text or URL'); return; }
      const size = +body.querySelector('#qr-size').value || 300;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(txt)}`;
      const img = body.querySelector('#qr-img'); img.src = url; img.style.display = 'inline-block';
      body.querySelector('#qr-dl').href = url;
    };
    body.querySelector('#qr-gen').onclick = run; run();
  };

  TOOLS['word-counter'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Text</label><textarea id="wc-in" style="${areaCss}" placeholder="Paste or type text..."></textarea><div id="wc-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:16px;"></div>`;
    const update = () => {
      const t = body.querySelector('#wc-in').value;
      const items = [
        ['Words', (t.trim().match(/\S+/g) || []).length, '#8b5cf6'],
        ['Characters', t.length, '#3b82f6'],
        ['No Spaces', t.replace(/\s/g, '').length, '#10b981'],
        ['Sentences', (t.match(/[.!?]+(\s|$)/g) || []).length, '#f97316'],
        ['Paragraphs', t.split(/\n{2,}/).filter((p) => p.trim()).length, '#ec4899'],
        ['Read Time', Math.max(1, Math.ceil((t.trim().match(/\S+/g) || []).length / 200)) + ' min', '#14b8a6'],
      ];
      body.querySelector('#wc-stats').innerHTML = items.map(([l, v, c]) => `<div style="background:${c}12;border:1px solid ${c}30;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${l}</div></div>`).join('');
    };
    body.querySelector('#wc-in').oninput = update; update();
  };

  TOOLS['color-picker'] = (body) => {
    body.innerHTML = `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;"><input id="cp-pick" type="color" value="#ef4444" style="width:120px;height:120px;border:none;border-radius:16px;cursor:pointer;"><div style="flex:1;min-width:220px;"><label style="${labelCss}">HEX</label><input id="cp-hex" style="${inputCss};font-family:ui-monospace,monospace;"><label style="${labelCss};margin-top:10px;">RGB</label><input id="cp-rgb" style="${inputCss};font-family:ui-monospace,monospace;" readonly><label style="${labelCss};margin-top:10px;">HSL</label><input id="cp-hsl" style="${inputCss};font-family:ui-monospace,monospace;" readonly></div></div><div style="${rowCss}"><button id="cp-copy-hex" style="${btn('#ef4444')}">Copy HEX</button><button id="cp-copy-rgb" style="${btnGhost}">Copy RGB</button><button id="cp-copy-hsl" style="${btnGhost}">Copy HSL</button></div>`;
    const hexToRgb = (h) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null; };
    const rgbToHsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2; if (mx === mn) h = s = 0; else { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); switch (mx) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; };
    const update = (hex) => { const rgb = hexToRgb(hex); if (!rgb) return; const [r, g, b] = rgb; const [h, s, l] = rgbToHsl(r, g, b); body.querySelector('#cp-hex').value = hex.toUpperCase(); body.querySelector('#cp-rgb').value = `rgb(${r}, ${g}, ${b})`; body.querySelector('#cp-hsl').value = `hsl(${h}, ${s}%, ${l}%)`; body.querySelector('#cp-pick').value = hex; };
    body.querySelector('#cp-pick').oninput = (e) => update(e.target.value);
    body.querySelector('#cp-hex').oninput = (e) => update(e.target.value);
    body.querySelector('#cp-copy-hex').onclick = () => copyText(body.querySelector('#cp-hex').value);
    body.querySelector('#cp-copy-rgb').onclick = () => copyText(body.querySelector('#cp-rgb').value);
    body.querySelector('#cp-copy-hsl').onclick = () => copyText(body.querySelector('#cp-hsl').value);
    update('#ef4444');
  };

  TOOLS['meta-tag-generator'] = (body) => {
    body.innerHTML = `<div style="display:grid;gap:10px;"><div><label style="${labelCss}">Page Title</label><input id="mt-title" style="${inputCss}"></div><div><label style="${labelCss}">Description</label><textarea id="mt-desc" style="${areaCss};min-height:70px;"></textarea></div><div><label style="${labelCss}">Keywords</label><input id="mt-kw" style="${inputCss}"></div><div><label style="${labelCss}">Author</label><input id="mt-author" style="${inputCss}"></div><div><label style="${labelCss}">Page URL</label><input id="mt-url" style="${inputCss}"></div><div><label style="${labelCss}">Image URL (og:image)</label><input id="mt-img" style="${inputCss}"></div></div><div style="${rowCss}"><button id="mt-gen" style="${btn('#14b8a6')}">Generate</button><button id="mt-copy" style="${btnGhost}">Copy HTML</button></div><label style="${labelCss};margin-top:14px;">Generated Meta Tags</label><textarea id="mt-out" style="${areaCss};min-height:200px;" readonly></textarea>`;
    const gen = () => {
      const g = (id) => body.querySelector(id).value.trim(); const esc = (s) => s.replace(/"/g, '&quot;');
      const title = g('#mt-title'), desc = g('#mt-desc'), kw = g('#mt-kw'), author = g('#mt-author'), url = g('#mt-url'), img = g('#mt-img');
      body.querySelector('#mt-out').value = [
        title && `<title>${esc(title)}</title>`, desc && `<meta name="description" content="${esc(desc)}">`,
        kw && `<meta name="keywords" content="${esc(kw)}">`, author && `<meta name="author" content="${esc(author)}">`,
        url && `<link rel="canonical" href="${esc(url)}">`, '', '<!-- Open Graph -->',
        title && `<meta property="og:title" content="${esc(title)}">`, desc && `<meta property="og:description" content="${esc(desc)}">`,
        url && `<meta property="og:url" content="${esc(url)}">`, img && `<meta property="og:image" content="${esc(img)}">`,
        `<meta property="og:type" content="website">`, '', '<!-- Twitter -->',
        `<meta name="twitter:card" content="summary_large_image">`,
        title && `<meta name="twitter:title" content="${esc(title)}">`, desc && `<meta name="twitter:description" content="${esc(desc)}">`,
        img && `<meta name="twitter:image" content="${esc(img)}">`,
      ].filter(Boolean).join('\n');
    };
    body.querySelector('#mt-gen').onclick = gen;
    body.querySelector('#mt-copy').onclick = () => copyText(body.querySelector('#mt-out').value);
  };

  TOOLS['base64'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Input</label><textarea id="b64-in" style="${areaCss}"></textarea><div style="${rowCss}"><button id="b64-enc" style="${btn('#6366f1')}">Encode</button><button id="b64-dec" style="${btnGhost}">Decode</button><button id="b64-copy" style="${btnGhost}">Copy</button></div><label style="${labelCss};margin-top:14px;">Output</label><textarea id="b64-out" style="${areaCss}" readonly></textarea>`;
    body.querySelector('#b64-enc').onclick = () => { try { body.querySelector('#b64-out').value = btoa(unescape(encodeURIComponent(body.querySelector('#b64-in').value))); } catch { flash('Encode failed'); } };
    body.querySelector('#b64-dec').onclick = () => { try { body.querySelector('#b64-out').value = decodeURIComponent(escape(atob(body.querySelector('#b64-in').value))); } catch { flash('Invalid Base64'); } };
    body.querySelector('#b64-copy').onclick = () => copyText(body.querySelector('#b64-out').value);
  };

  TOOLS['image-compressor'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Select Image</label><input id="ic-file" type="file" accept="image/*" style="${inputCss}"><label style="${labelCss};margin-top:12px;">Quality: <span id="ic-q-val">70</span>%</label><input id="ic-q" type="range" min="10" max="100" value="70" style="width:100%;"><label style="${labelCss};margin-top:12px;">Max Width (0 = original)</label><input id="ic-w" type="number" value="0" min="0" style="${inputCss}"><div style="${rowCss}"><button id="ic-run" style="${btn('#ec4899')}">Compress</button><a id="ic-dl" style="${btnGhost};text-decoration:none;display:none;" download="compressed.jpg">Download</a></div><div id="ic-info" style="margin-top:14px;color:#64748b;font-size:0.9rem;"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;"><div><div style="${labelCss}">Original</div><img id="ic-orig" style="max-width:100%;border-radius:10px;border:1px solid #e2e8f0;"></div><div><div style="${labelCss}">Compressed</div><img id="ic-out" style="max-width:100%;border-radius:10px;border:1px solid #e2e8f0;"></div></div>`;
    body.querySelector('#ic-q').oninput = () => (body.querySelector('#ic-q-val').textContent = body.querySelector('#ic-q').value);
    let origBlob = null, origBytes = 0;
    body.querySelector('#ic-file').onchange = (e) => { const f = e.target.files[0]; if (!f) return; origBlob = f; origBytes = f.size; body.querySelector('#ic-orig').src = URL.createObjectURL(f); };
    body.querySelector('#ic-run').onclick = () => {
      if (!origBlob) { flash('Select an image first'); return; }
      const q = +body.querySelector('#ic-q').value / 100; const maxW = +body.querySelector('#ic-w').value || 0;
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (maxW && w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          body.querySelector('#ic-out').src = url;
          const dl = body.querySelector('#ic-dl'); dl.href = url; dl.style.display = 'inline-block';
          const kb = (n) => (n / 1024).toFixed(1) + ' KB';
          const saved = Math.max(0, Math.round((1 - blob.size / origBytes) * 100));
          body.querySelector('#ic-info').innerHTML = `<b>Original:</b> ${kb(origBytes)} → <b>Compressed:</b> ${kb(blob.size)} <span style="color:#10b981;font-weight:800;">(-${saved}%)</span>`;
        }, 'image/jpeg', q);
      };
      img.src = URL.createObjectURL(origBlob);
    };
  };

  TOOLS['url-encoder'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Input</label><textarea id="ue-in" style="${areaCss}"></textarea><div style="${rowCss}"><button id="ue-enc" style="${btn('#0ea5e9')}">Encode</button><button id="ue-dec" style="${btnGhost}">Decode</button><button id="ue-copy" style="${btnGhost}">Copy</button></div><label style="${labelCss};margin-top:14px;">Output</label><textarea id="ue-out" style="${areaCss}" readonly></textarea>`;
    body.querySelector('#ue-enc').onclick = () => { try { body.querySelector('#ue-out').value = encodeURIComponent(body.querySelector('#ue-in').value); } catch { flash('Failed'); } };
    body.querySelector('#ue-dec').onclick = () => { try { body.querySelector('#ue-out').value = decodeURIComponent(body.querySelector('#ue-in').value); } catch { flash('Invalid input'); } };
    body.querySelector('#ue-copy').onclick = () => copyText(body.querySelector('#ue-out').value);
  };

  TOOLS['lorem-ipsum'] = (body) => {
    const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
    body.innerHTML = `<label style="${labelCss}">Type</label><select id="li-type" style="${inputCss}"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select><label style="${labelCss};margin-top:12px;">Count</label><input id="li-count" type="number" min="1" max="50" value="3" style="${inputCss}"><div style="${rowCss}"><button id="li-gen" style="${btn('#a855f7')}">Generate</button><button id="li-copy" style="${btnGhost}">Copy</button></div><textarea id="li-out" style="${areaCss};margin-top:14px;min-height:220px;font-family:inherit;" readonly></textarea>`;
    const word = () => LOREM[Math.floor(Math.random() * LOREM.length)];
    const sentence = () => { const n = 8 + Math.floor(Math.random() * 12); const w = []; for (let i = 0; i < n; i++) w.push(word()); return w.join(' ').replace(/^./, c => c.toUpperCase()) + '.'; };
    const paragraph = () => { const n = 4 + Math.floor(Math.random() * 4); const s = []; for (let i = 0; i < n; i++) s.push(sentence()); return s.join(' '); };
    const gen = () => {
      const type = body.querySelector('#li-type').value; const n = +body.querySelector('#li-count').value || 1;
      let out = '';
      if (type === 'words') { const w = []; for (let i = 0; i < n; i++) w.push(word()); out = w.join(' '); }
      else if (type === 'sentences') { const s = []; for (let i = 0; i < n; i++) s.push(sentence()); out = s.join(' '); }
      else { const p = []; for (let i = 0; i < n; i++) p.push(paragraph()); out = p.join('\n\n'); }
      body.querySelector('#li-out').value = out;
    };
    body.querySelector('#li-gen').onclick = gen;
    body.querySelector('#li-copy').onclick = () => copyText(body.querySelector('#li-out').value);
    gen();
  };

  TOOLS['case-converter'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Input Text</label><textarea id="cc-in" style="${areaCss};font-family:inherit;" placeholder="Type or paste text..."></textarea><div id="cc-out" style="display:grid;gap:10px;margin-top:16px;"></div>`;
    const conv = {
      'UPPERCASE': (s) => s.toUpperCase(),
      'lowercase': (s) => s.toLowerCase(),
      'Title Case': (s) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()),
      'Sentence case': (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
      'camelCase': (s) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()),
      'PascalCase': (s) => { const c = s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, ch) => ch.toUpperCase()); return c.charAt(0).toUpperCase() + c.slice(1); },
      'snake_case': (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      'kebab-case': (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      'CONSTANT_CASE': (s) => s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
    };
    const update = () => {
      const t = body.querySelector('#cc-in').value;
      body.querySelector('#cc-out').innerHTML = Object.keys(conv).map((k) => {
        const v = conv[k](t);
        return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-weight:800;color:#0f172a;font-size:0.85rem;">${k}</span><button data-copy="${safe(v)}" style="${btnGhost};padding:4px 12px;font-size:0.75rem;">Copy</button></div><div style="color:#334155;font-family:ui-monospace,monospace;font-size:0.9rem;word-break:break-all;">${safe(v) || '<span style="color:#94a3b8;">—</span>'}</div></div>`;
      }).join('');
      body.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => copyText(b.getAttribute('data-copy')));
    };
    body.querySelector('#cc-in').oninput = update; update();
  };

  TOOLS['slugify'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Title / Text</label><input id="sl-in" style="${inputCss}" placeholder="How to Build a Website in 2026"><label style="${labelCss};margin-top:12px;">Separator</label><select id="sl-sep" style="${inputCss}"><option value="-">Hyphen ( - )</option><option value="_">Underscore ( _ )</option></select><div style="${rowCss}"><button id="sl-copy" style="${btn('#059669')}">Copy Slug</button></div><label style="${labelCss};margin-top:14px;">Slug</label><input id="sl-out" style="${inputCss};font-family:ui-monospace,monospace;" readonly>`;
    const slug = (s, sep) => s.toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, sep).replace(new RegExp('^' + sep + '+|' + sep + '+$', 'g'), '');
    const update = () => body.querySelector('#sl-out').value = slug(body.querySelector('#sl-in').value, body.querySelector('#sl-sep').value);
    body.querySelector('#sl-in').oninput = update;
    body.querySelector('#sl-sep').onchange = update;
    body.querySelector('#sl-copy').onclick = () => copyText(body.querySelector('#sl-out').value);
    body.querySelector('#sl-in').value = 'How to Build a Website in 2026'; update();
  };

  TOOLS['regex-tester'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Regular Expression</label><div style="display:flex;gap:8px;"><span style="display:flex;align-items:center;padding:0 12px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;font-family:ui-monospace,monospace;font-weight:800;">/</span><input id="re-pat" style="${inputCss};font-family:ui-monospace,monospace;" placeholder="\\d+" value="\\d+"><span style="display:flex;align-items:center;padding:0 12px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;font-family:ui-monospace,monospace;font-weight:800;">/</span><input id="re-flags" style="${inputCss};max-width:80px;font-family:ui-monospace,monospace;" value="g"></div><label style="${labelCss};margin-top:12px;">Test String</label><textarea id="re-str" style="${areaCss}">Order 123 shipped on 2025-12-31 costing $99.</textarea><div id="re-info" style="margin-top:12px;font-size:0.9rem;font-weight:700;"></div><label style="${labelCss};margin-top:14px;">Highlighted Matches</label><div id="re-out" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;min-height:80px;font-family:ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;"></div>`;
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const run = () => {
      const pat = body.querySelector('#re-pat').value, flags = body.querySelector('#re-flags').value, str = body.querySelector('#re-str').value;
      const info = body.querySelector('#re-info'), out = body.querySelector('#re-out');
      if (!pat) { info.textContent = ''; out.innerHTML = esc(str); return; }
      try {
        const re = new RegExp(pat, flags.includes('g') ? flags : flags + 'g');
        const matches = [...str.matchAll(re)];
        info.innerHTML = `<span style="color:#10b981;">✓ ${matches.length} match${matches.length !== 1 ? 'es' : ''}</span>`;
        let result = '', last = 0;
        matches.forEach((m) => { result += esc(str.slice(last, m.index)); result += `<mark style="background:#fef08a;padding:1px 3px;border-radius:3px;font-weight:700;">${esc(m[0])}</mark>`; last = m.index + m[0].length; });
        result += esc(str.slice(last));
        out.innerHTML = result;
      } catch (e) { info.innerHTML = `<span style="color:#ef4444;">✗ ${e.message}</span>`; out.innerHTML = esc(str); }
    };
    ['#re-pat', '#re-flags', '#re-str'].forEach((s) => body.querySelector(s).oninput = run);
    run();
  };

  TOOLS['jwt-decoder'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">JWT Token</label><textarea id="jwt-in" style="${areaCss};font-size:0.85rem;" placeholder="eyJhbGciOi..."></textarea><div style="${rowCss}"><button id="jwt-dec" style="${btn('#7c3aed')}">Decode</button></div><div style="display:grid;gap:12px;margin-top:16px;"><div><label style="${labelCss}">Header</label><pre id="jwt-h" style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px;font-size:0.85rem;overflow:auto;color:#3730a3;margin:0;"></pre></div><div><label style="${labelCss}">Payload</label><pre id="jwt-p" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;font-size:0.85rem;overflow:auto;color:#166534;margin:0;"></pre></div><div><label style="${labelCss}">Signature</label><pre id="jwt-s" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;font-size:0.85rem;overflow:auto;color:#991b1b;margin:0;word-break:break-all;white-space:pre-wrap;"></pre></div></div>`;
    const dec = () => {
      const tok = body.querySelector('#jwt-in').value.trim();
      const parts = tok.split('.');
      if (parts.length !== 3) { flash('Invalid JWT format'); return; }
      const b64 = (s) => { try { return JSON.stringify(JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/'))), null, 2); } catch { return 'Invalid'; } };
      body.querySelector('#jwt-h').textContent = b64(parts[0]);
      body.querySelector('#jwt-p').textContent = b64(parts[1]);
      body.querySelector('#jwt-s').textContent = parts[2];
    };
    body.querySelector('#jwt-dec').onclick = dec;
  };

  TOOLS['hash-generator'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Input Text</label><textarea id="hg-in" style="${areaCss}" placeholder="Type text to hash..."></textarea><div style="${rowCss}"><button id="hg-run" style="${btn('#dc2626')}">Generate Hashes</button></div><div id="hg-out" style="display:grid;gap:10px;margin-top:16px;"></div>`;
    const run = async () => {
      const t = body.querySelector('#hg-in').value;
      const enc = new TextEncoder().encode(t);
      const algs = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
      const out = [];
      for (const a of algs) {
        const buf = await crypto.subtle.digest(a, enc);
        const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
        out.push([a, hex]);
      }
      body.querySelector('#hg-out').innerHTML = out.map(([a, h]) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-weight:800;color:#dc2626;font-size:0.85rem;">${a}</span><button data-copy="${h}" style="${btnGhost};padding:4px 12px;font-size:0.75rem;">Copy</button></div><div style="font-family:ui-monospace,monospace;font-size:0.8rem;color:#334155;word-break:break-all;">${h}</div></div>`).join('');
      body.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => copyText(b.getAttribute('data-copy')));
    };
    body.querySelector('#hg-run').onclick = run;
    body.querySelector('#hg-in').value = 'hello world'; run();
  };

  TOOLS['timestamp'] = (body) => {
    body.innerHTML = `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;"><div style="font-size:0.8rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:1px;">Current Unix Timestamp</div><div id="ts-now" style="font-size:1.6rem;font-weight:900;color:#0284c7;font-family:ui-monospace,monospace;margin-top:4px;"></div></div><label style="${labelCss}">Unix Timestamp (seconds)</label><input id="ts-in" type="number" style="${inputCss};font-family:ui-monospace,monospace;"><div style="${rowCss}"><button id="ts-dec" style="${btn('#0284c7')}">To Date</button></div><div id="ts-date-out" style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;font-family:ui-monospace,monospace;min-height:40px;"></div><label style="${labelCss};margin-top:16px;">Date & Time</label><input id="ts-date" type="datetime-local" style="${inputCss}"><div style="${rowCss}"><button id="ts-enc" style="${btnGhost}">To Timestamp</button></div><div id="ts-ts-out" style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;font-family:ui-monospace,monospace;min-height:40px;"></div>`;
    const tick = () => body.querySelector('#ts-now').textContent = Math.floor(Date.now() / 1000);
    tick(); const iv = setInterval(tick, 1000);
    body.querySelector('#ts-in').value = Math.floor(Date.now() / 1000);
    body.querySelector('#ts-dec').onclick = () => { const t = +body.querySelector('#ts-in').value; const d = new Date(t * 1000); body.querySelector('#ts-date-out').innerHTML = `<b>Local:</b> ${d.toString()}<br><b>UTC:</b> ${d.toUTCString()}<br><b>ISO:</b> ${d.toISOString()}`; };
    body.querySelector('#ts-enc').onclick = () => { const v = body.querySelector('#ts-date').value; if (!v) { flash('Pick a date'); return; } const t = Math.floor(new Date(v).getTime() / 1000); body.querySelector('#ts-ts-out').innerHTML = `<b>Timestamp:</b> ${t}<br><b>Milliseconds:</b> ${t * 1000}`; };
    body.querySelector('#ts-dec').click();
    const obs = new MutationObserver(() => { if (!document.body.contains(body)) { clearInterval(iv); obs.disconnect(); } });
    obs.observe(document.body, { childList: true, subtree: true });
  };

  TOOLS['gradient-generator'] = (body) => {
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;"><div><label style="${labelCss}">Color 1</label><input id="gg-c1" type="color" value="#3b82f6" style="width:100%;height:52px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;"></div><div><label style="${labelCss}">Color 2</label><input id="gg-c2" type="color" value="#ec4899" style="width:100%;height:52px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;"></div><div><label style="${labelCss}">Angle: <span id="gg-a-val">135</span>°</label><input id="gg-a" type="range" min="0" max="360" value="135" style="width:100%;"></div></div><div id="gg-preview" style="height:220px;border-radius:16px;margin-top:16px;border:1px solid #e2e8f0;"></div><label style="${labelCss};margin-top:14px;">CSS Code</label><textarea id="gg-out" style="${areaCss};min-height:80px;font-family:ui-monospace,monospace;" readonly></textarea><div style="${rowCss}"><button id="gg-copy" style="${btn('#db2777')}">Copy CSS</button></div>`;
    const update = () => {
      const c1 = body.querySelector('#gg-c1').value, c2 = body.querySelector('#gg-c2').value, a = body.querySelector('#gg-a').value;
      body.querySelector('#gg-a-val').textContent = a;
      const grad = `linear-gradient(${a}deg, ${c1} 0%, ${c2} 100%)`;
      body.querySelector('#gg-preview').style.background = grad;
      body.querySelector('#gg-out').value = `background: ${grad};`;
    };
    ['#gg-c1', '#gg-c2', '#gg-a'].forEach((s) => body.querySelector(s).oninput = update);
    body.querySelector('#gg-copy').onclick = () => copyText(body.querySelector('#gg-out').value);
    update();
  };

  TOOLS['box-shadow'] = (body) => {
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;"><div><label style="${labelCss}">X: <span id="bs-x-val">0</span>px</label><input id="bs-x" type="range" min="-50" max="50" value="0" style="width:100%;"></div><div><label style="${labelCss}">Y: <span id="bs-y-val">12</span>px</label><input id="bs-y" type="range" min="-50" max="50" value="12" style="width:100%;"></div><div><label style="${labelCss}">Blur: <span id="bs-b-val">24</span>px</label><input id="bs-b" type="range" min="0" max="100" value="24" style="width:100%;"></div><div><label style="${labelCss}">Spread: <span id="bs-s-val">0</span>px</label><input id="bs-s" type="range" min="-30" max="30" value="0" style="width:100%;"></div><div><label style="${labelCss}">Color</label><input id="bs-c" type="color" value="#0f172a" style="width:100%;height:42px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;"></div><div><label style="${labelCss}">Opacity: <span id="bs-o-val">20</span>%</label><input id="bs-o" type="range" min="0" max="100" value="20" style="width:100%;"></div></div><div style="display:flex;justify-content:center;align-items:center;padding:60px;background:#f8fafc;border-radius:16px;margin-top:16px;"><div id="bs-preview" style="width:140px;height:140px;background:#fff;border-radius:16px;"></div></div><label style="${labelCss};margin-top:14px;">CSS Code</label><textarea id="bs-out" style="${areaCss};min-height:60px;font-family:ui-monospace,monospace;" readonly></textarea><div style="${rowCss}"><button id="bs-copy" style="${btn('#4f46e5')}">Copy CSS</button></div>`;
    const hexToRgb = (h) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0]; };
    const update = () => {
      const x = body.querySelector('#bs-x').value, y = body.querySelector('#bs-y').value, b = body.querySelector('#bs-b').value, s = body.querySelector('#bs-s').value;
      const c = body.querySelector('#bs-c').value, o = body.querySelector('#bs-o').value;
      ['x', 'y', 'b', 's', 'o'].forEach((k) => body.querySelector('#bs-' + k + '-val').textContent = body.querySelector('#bs-' + k).value);
      const [r, g, bl] = hexToRgb(c);
      const shadow = `${x}px ${y}px ${b}px ${s}px rgba(${r}, ${g}, ${bl}, ${o / 100})`;
      body.querySelector('#bs-preview').style.boxShadow = shadow;
      body.querySelector('#bs-out').value = `box-shadow: ${shadow};`;
    };
    ['#bs-x', '#bs-y', '#bs-b', '#bs-s', '#bs-c', '#bs-o'].forEach((sel) => body.querySelector(sel).oninput = update);
    body.querySelector('#bs-copy').onclick = () => copyText(body.querySelector('#bs-out').value);
    update();
  };

  TOOLS['bmi-calculator'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Units</label><select id="bmi-u" style="${inputCss}"><option value="metric">Metric (kg / cm)</option><option value="imperial">Imperial (lb / in)</option></select><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;"><div><label style="${labelCss}"><span id="bmi-wl">Weight (kg)</span></label><input id="bmi-w" type="number" step="0.1" style="${inputCss}" value="70"></div><div><label style="${labelCss}"><span id="bmi-hl">Height (cm)</span></label><input id="bmi-h" type="number" step="0.1" style="${inputCss}" value="170"></div></div><div style="${rowCss}"><button id="bmi-run" style="${btn('#16a34a')}">Calculate BMI</button></div><div id="bmi-out" style="margin-top:16px;"></div>`;
    body.querySelector('#bmi-u').onchange = () => {
      const m = body.querySelector('#bmi-u').value === 'metric';
      body.querySelector('#bmi-wl').textContent = m ? 'Weight (kg)' : 'Weight (lb)';
      body.querySelector('#bmi-hl').textContent = m ? 'Height (cm)' : 'Height (in)';
    };
    body.querySelector('#bmi-run').onclick = () => {
      const w = +body.querySelector('#bmi-w').value, h = +body.querySelector('#bmi-h').value;
      if (!w || !h) { flash('Enter valid values'); return; }
      let bmi; if (body.querySelector('#bmi-u').value === 'metric') bmi = w / ((h / 100) ** 2); else bmi = (703 * w) / (h * h);
      let cat, color;
      if (bmi < 18.5) { cat = 'Underweight'; color = '#0ea5e9'; }
      else if (bmi < 25) { cat = 'Healthy Weight'; color = '#10b981'; }
      else if (bmi < 30) { cat = 'Overweight'; color = '#f59e0b'; }
      else { cat = 'Obese'; color = '#ef4444'; }
      body.querySelector('#bmi-out').innerHTML = `<div style="background:${color}12;border:1px solid ${color}40;border-radius:14px;padding:24px;text-align:center;"><div style="font-size:0.8rem;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">Your BMI</div><div style="font-size:3rem;font-weight:900;color:${color};margin:8px 0;">${bmi.toFixed(1)}</div><div style="font-size:1.1rem;font-weight:800;color:#0f172a;">${cat}</div></div>`;
    };
    body.querySelector('#bmi-run').click();
  };

  TOOLS['age-calculator'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Date of Birth</label><input id="ac-dob" type="date" style="${inputCss}"><label style="${labelCss};margin-top:12px;">Calculate as of</label><input id="ac-on" type="date" style="${inputCss}"><div style="${rowCss}"><button id="ac-run" style="${btn('#f59e0b')}">Calculate Age</button></div><div id="ac-out" style="margin-top:16px;"></div>`;
    const today = new Date().toISOString().split('T')[0];
    body.querySelector('#ac-on').value = today;
    body.querySelector('#ac-dob').value = '2000-01-01';
    body.querySelector('#ac-run').onclick = () => {
      const dob = new Date(body.querySelector('#ac-dob').value), on = new Date(body.querySelector('#ac-on').value);
      if (isNaN(dob) || isNaN(on) || dob > on) { flash('Invalid dates'); return; }
      let y = on.getFullYear() - dob.getFullYear(), m = on.getMonth() - dob.getMonth(), d = on.getDate() - dob.getDate();
      if (d < 0) { m--; d += new Date(on.getFullYear(), on.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      const ms = on - dob;
      const items = [['Years', y, '#f59e0b'], ['Months', m, '#f97316'], ['Days', d, '#ef4444'], ['Total Days', Math.floor(ms / 86400000), '#8b5cf6'], ['Hours', Math.floor(ms / 3600000), '#3b82f6'], ['Minutes', Math.floor(ms / 60000).toLocaleString(), '#10b981']];
      body.querySelector('#ac-out').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">${items.map(([l, v, c]) => `<div style="background:${c}12;border:1px solid ${c}30;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${l}</div></div>`).join('')}</div>`;
    };
    body.querySelector('#ac-run').click();
  };

  /* ============ NEW PREMIUM TOOLS ============ */

  TOOLS['url-shortener'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Long URL</label><input id="us-in" style="${inputCss}" placeholder="https://example.com/very/long/link?with=params"><div style="${rowCss}"><button id="us-run" style="${btn('#2563eb')}">Shorten URL</button><button id="us-copy" style="${btnGhost}">Copy Short URL</button></div><label style="${labelCss};margin-top:14px;">Short URL</label><input id="us-out" style="${inputCss};font-family:ui-monospace,monospace;font-size:1rem;" readonly><div id="us-info" style="margin-top:10px;font-size:0.85rem;color:#64748b;"></div><div style="margin-top:18px;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;color:#1e40af;font-size:0.85rem;line-height:1.5;"><b><i class="fa-solid fa-circle-info"></i> Powered by is.gd</b> — free, permanent short URLs with no signup.</div>`;
    body.querySelector('#us-run').onclick = async () => {
      const url = body.querySelector('#us-in').value.trim();
      if (!/^https?:\/\//i.test(url)) { flash('Enter a valid URL starting with http:// or https://'); return; }
      body.querySelector('#us-info').textContent = 'Shortening…';
      try {
        const r = await fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(url));
        const short = (await r.text()).trim();
        if (!short.startsWith('http')) throw new Error(short);
        body.querySelector('#us-out').value = short;
        body.querySelector('#us-info').innerHTML = `<span style="color:#10b981;font-weight:700;">✓ Shortened</span> — saved ${url.length - short.length} characters`;
      } catch (e) { body.querySelector('#us-info').innerHTML = `<span style="color:#ef4444;">✗ ${e.message || 'Failed to shorten'}</span>`; }
    };
    body.querySelector('#us-copy').onclick = () => copyText(body.querySelector('#us-out').value);
  };

  TOOLS['text-to-speech'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Text</label><textarea id="tts-in" style="${areaCss};font-family:inherit;" placeholder="Type or paste any text to hear it spoken aloud...">Hello! Welcome to Vextrolyntra — your one-stop shop for premium digital tools.</textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;"><div><label style="${labelCss}">Voice</label><select id="tts-voice" style="${inputCss}"></select></div><div><label style="${labelCss}">Speed: <span id="tts-rate-val">1.0</span>×</label><input id="tts-rate" type="range" min="0.5" max="2" step="0.1" value="1" style="width:100%;"></div></div><div><label style="${labelCss};margin-top:10px;">Pitch: <span id="tts-pitch-val">1.0</span></label><input id="tts-pitch" type="range" min="0" max="2" step="0.1" value="1" style="width:100%;"></div><div style="${rowCss}"><button id="tts-play" style="${btn('#9333ea')}"><i class="fa-solid fa-play"></i> Play</button><button id="tts-pause" style="${btnGhost}"><i class="fa-solid fa-pause"></i> Pause</button><button id="tts-stop" style="${btnGhost}"><i class="fa-solid fa-stop"></i> Stop</button></div><div id="tts-status" style="margin-top:12px;font-size:0.85rem;color:#64748b;"></div>`;
    if (!('speechSynthesis' in window)) { body.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b;"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:#f59e0b;"></i><p>Your browser does not support Text to Speech.</p></div>`; return; }
    const voiceSel = body.querySelector('#tts-voice');
    const populate = () => {
      const voices = speechSynthesis.getVoices();
      voiceSel.innerHTML = voices.map((v, i) => `<option value="${i}"${v.default ? ' selected' : ''}>${safe(v.name)} — ${safe(v.lang)}</option>`).join('');
    };
    populate(); speechSynthesis.onvoiceschanged = populate;
    body.querySelector('#tts-rate').oninput = (e) => body.querySelector('#tts-rate-val').textContent = (+e.target.value).toFixed(1);
    body.querySelector('#tts-pitch').oninput = (e) => body.querySelector('#tts-pitch-val').textContent = (+e.target.value).toFixed(1);
    body.querySelector('#tts-play').onclick = () => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(body.querySelector('#tts-in').value);
      const voices = speechSynthesis.getVoices();
      const idx = +voiceSel.value; if (voices[idx]) u.voice = voices[idx];
      u.rate = +body.querySelector('#tts-rate').value;
      u.pitch = +body.querySelector('#tts-pitch').value;
      u.onstart = () => body.querySelector('#tts-status').innerHTML = '<span style="color:#9333ea;font-weight:700;">🔊 Speaking…</span>';
      u.onend = () => body.querySelector('#tts-status').innerHTML = '<span style="color:#10b981;font-weight:700;">✓ Done</span>';
      speechSynthesis.speak(u);
    };
    body.querySelector('#tts-pause').onclick = () => { if (speechSynthesis.paused) speechSynthesis.resume(); else speechSynthesis.pause(); };
    body.querySelector('#tts-stop').onclick = () => { speechSynthesis.cancel(); body.querySelector('#tts-status').textContent = ''; };
  };

  TOOLS['speech-to-text'] = (body) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { body.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b;"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:#f59e0b;"></i><p style="margin-top:10px;">Speech Recognition not supported in this browser.<br>Please use <b>Chrome</b>, <b>Edge</b>, or <b>Safari</b>.</p></div>`; return; }
    body.innerHTML = `<label style="${labelCss}">Language</label><select id="st-lang" style="${inputCss}"><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ur-PK">Urdu</option><option value="hi-IN">Hindi</option><option value="ar-SA">Arabic</option><option value="es-ES">Spanish</option><option value="fr-FR">French</option><option value="de-DE">German</option><option value="zh-CN">Chinese</option><option value="ja-JP">Japanese</option></select><div style="${rowCss}"><button id="st-start" style="${btn('#e11d48')}"><i class="fa-solid fa-microphone"></i> Start Recording</button><button id="st-stop" style="${btnGhost}"><i class="fa-solid fa-stop"></i> Stop</button><button id="st-clear" style="${btnGhost}">Clear</button><button id="st-copy" style="${btnGhost}">Copy</button></div><div id="st-status" style="margin-top:12px;font-size:0.9rem;font-weight:700;color:#64748b;">Click "Start Recording" and allow mic access.</div><label style="${labelCss};margin-top:14px;">Transcript</label><textarea id="st-out" style="${areaCss};font-family:inherit;min-height:180px;" placeholder="Your spoken words will appear here..."></textarea>`;
    let rec = null, finalText = '';
    body.querySelector('#st-start').onclick = () => {
      rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = body.querySelector('#st-lang').value;
      rec.onstart = () => body.querySelector('#st-status').innerHTML = '<span style="color:#e11d48;">🎤 Listening…</span>';
      rec.onerror = (e) => body.querySelector('#st-status').innerHTML = `<span style="color:#ef4444;">✗ ${e.error}</span>`;
      rec.onend = () => body.querySelector('#st-status').innerHTML = '<span style="color:#10b981;">✓ Stopped</span>';
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
        }
        body.querySelector('#st-out').value = finalText + interim;
      };
      rec.start();
    };
    body.querySelector('#st-stop').onclick = () => rec && rec.stop();
    body.querySelector('#st-clear').onclick = () => { finalText = ''; body.querySelector('#st-out').value = ''; };
    body.querySelector('#st-copy').onclick = () => copyText(body.querySelector('#st-out').value);
  };

  TOOLS['youtube-thumbnail'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">YouTube Video URL or ID</label><input id="yt-in" style="${inputCss}" placeholder="https://www.youtube.com/watch?v=..."><div style="${rowCss}"><button id="yt-run" style="${btn('#dc2626')}">Fetch Thumbnails</button></div><div id="yt-out" style="margin-top:18px;"></div>`;
    body.querySelector('#yt-run').onclick = () => {
      const v = body.querySelector('#yt-in').value.trim();
      const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/) || v.match(/^([\w-]{11})$/);
      if (!m) { flash('Invalid YouTube URL or ID'); return; }
      const id = m[1];
      const sizes = [['maxresdefault', 'Max Resolution (1280×720)'], ['sddefault', 'Standard (640×480)'], ['hqdefault', 'High Quality (480×360)'], ['mqdefault', 'Medium Quality (320×180)'], ['default', 'Default (120×90)']];
      body.querySelector('#yt-out').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">${sizes.map(([s, l]) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><img src="https://i.ytimg.com/vi/${id}/${s}.jpg" style="width:100%;display:block;" onerror="this.parentElement.style.display='none'"><div style="padding:10px;"><div style="font-weight:800;color:#0f172a;font-size:0.85rem;">${l}</div><a href="https://i.ytimg.com/vi/${id}/${s}.jpg" download="youtube-${id}-${s}.jpg" style="${btnGhost};text-decoration:none;display:inline-block;margin-top:8px;padding:6px 12px;font-size:0.8rem;"><i class="fa-solid fa-download"></i> Download</a></div></div>`).join('')}</div>`;
    };
    body.querySelector('#yt-in').value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    body.querySelector('#yt-run').click();
  };

  TOOLS['image-watermark'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Select Image</label><input id="iw-file" type="file" accept="image/*" style="${inputCss}"><label style="${labelCss};margin-top:12px;">Watermark Text</label><input id="iw-text" style="${inputCss}" value="© Vextrolyntra"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;"><div><label style="${labelCss}">Color</label><input id="iw-color" type="color" value="#ffffff" style="width:100%;height:42px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;"></div><div><label style="${labelCss}">Opacity: <span id="iw-op-val">70</span>%</label><input id="iw-op" type="range" min="10" max="100" value="70" style="width:100%;"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;"><div><label style="${labelCss}">Font Size: <span id="iw-size-val">48</span>px</label><input id="iw-size" type="range" min="16" max="200" value="48" style="width:100%;"></div><div><label style="${labelCss}">Position</label><select id="iw-pos" style="${inputCss}"><option value="br">Bottom Right</option><option value="bl">Bottom Left</option><option value="tr">Top Right</option><option value="tl">Top Left</option><option value="center">Center</option><option value="tile">Tiled (repeated)</option></select></div></div><div style="${rowCss}"><button id="iw-run" style="${btn('#7c3aed')}">Apply Watermark</button><a id="iw-dl" style="${btnGhost};text-decoration:none;display:none;" download="watermarked.jpg">Download</a></div><div style="margin-top:16px;text-align:center;"><canvas id="iw-canvas" style="max-width:100%;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"></canvas></div>`;
    let img = null;
    body.querySelector('#iw-op').oninput = () => body.querySelector('#iw-op-val').textContent = body.querySelector('#iw-op').value;
    body.querySelector('#iw-size').oninput = () => body.querySelector('#iw-size-val').textContent = body.querySelector('#iw-size').value;
    body.querySelector('#iw-file').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { img = im; render(); }; im.src = URL.createObjectURL(f); };
    const render = () => {
      if (!img) return;
      const canvas = body.querySelector('#iw-canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const text = body.querySelector('#iw-text').value || ''; if (!text) return;
      const size = +body.querySelector('#iw-size').value;
      const op = +body.querySelector('#iw-op').value / 100;
      const color = body.querySelector('#iw-color').value;
      const pos = body.querySelector('#iw-pos').value;
      ctx.font = `bold ${size}px sans-serif`; ctx.fillStyle = color; ctx.globalAlpha = op;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
      const pad = 24;
      const tw = ctx.measureText(text).width;
      let x, y;
      if (pos === 'br') { x = canvas.width - tw - pad; y = canvas.height - pad; ctx.fillText(text, x, y); }
      else if (pos === 'bl') { ctx.fillText(text, pad, canvas.height - pad); }
      else if (pos === 'tr') { ctx.fillText(text, canvas.width - tw - pad, size + pad); }
      else if (pos === 'tl') { ctx.fillText(text, pad, size + pad); }
      else if (pos === 'center') { ctx.fillText(text, (canvas.width - tw) / 2, canvas.height / 2); }
      else if (pos === 'tile') {
        ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(-Math.PI / 6); ctx.translate(-canvas.width / 2, -canvas.height / 2);
        const stepX = tw + size * 2, stepY = size * 3;
        for (let yy = -canvas.height; yy < canvas.height * 2; yy += stepY) for (let xx = -canvas.width; xx < canvas.width * 2; xx += stepX) ctx.fillText(text, xx, yy);
        ctx.restore();
      }
      canvas.toBlob((blob) => { const dl = body.querySelector('#iw-dl'); dl.href = URL.createObjectURL(blob); dl.style.display = 'inline-block'; }, 'image/jpeg', 0.92);
    };
    body.querySelector('#iw-run').onclick = render;
    ['#iw-text', '#iw-color', '#iw-op', '#iw-size', '#iw-pos'].forEach((s) => body.querySelector(s).oninput = () => img && render());
  };

  TOOLS['image-to-base64'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Select Image</label><input id="ib-file" type="file" accept="image/*" style="${inputCss}"><div id="ib-preview" style="margin-top:12px;text-align:center;"></div><label style="${labelCss};margin-top:12px;">Base64 Data URI</label><textarea id="ib-out" style="${areaCss};font-size:0.75rem;" readonly></textarea><div style="${rowCss}"><button id="ib-copy" style="${btn('#0d9488')}">Copy Data URI</button><button id="ib-copy-css" style="${btnGhost}">Copy as CSS</button><button id="ib-copy-html" style="${btnGhost}">Copy as &lt;img&gt;</button></div><div id="ib-info" style="margin-top:10px;font-size:0.85rem;color:#64748b;"></div>`;
    let dataUri = '';
    body.querySelector('#ib-file').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        dataUri = r.result;
        body.querySelector('#ib-out').value = dataUri;
        body.querySelector('#ib-preview').innerHTML = `<img src="${dataUri}" style="max-width:200px;max-height:200px;border-radius:10px;border:1px solid #e2e8f0;">`;
        body.querySelector('#ib-info').innerHTML = `<b>File:</b> ${safe(f.name)} • <b>Size:</b> ${(f.size / 1024).toFixed(1)} KB • <b>Base64 Length:</b> ${dataUri.length.toLocaleString()} chars`;
      };
      r.readAsDataURL(f);
    };
    body.querySelector('#ib-copy').onclick = () => copyText(dataUri);
    body.querySelector('#ib-copy-css').onclick = () => copyText(`background-image: url("${dataUri}");`);
    body.querySelector('#ib-copy-html').onclick = () => copyText(`<img src="${dataUri}" alt="">`);
  };

  TOOLS['csv-to-json'] = (body) => {
    body.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;"><label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#334155;font-size:0.9rem;"><input type="radio" name="cj-mode" value="c2j" checked> CSV → JSON</label><label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#334155;font-size:0.9rem;"><input type="radio" name="cj-mode" value="j2c"> JSON → CSV</label></div><label style="${labelCss}">Input</label><textarea id="cj-in" style="${areaCss};min-height:160px;" placeholder="name,age,city&#10;Alice,30,Karachi&#10;Bob,25,Lahore"></textarea><div style="${rowCss}"><button id="cj-run" style="${btn('#059669')}">Convert</button><button id="cj-copy" style="${btnGhost}">Copy Output</button></div><label style="${labelCss};margin-top:14px;">Output</label><textarea id="cj-out" style="${areaCss};min-height:160px;" readonly></textarea><div id="cj-info" style="margin-top:8px;font-size:0.85rem;font-weight:700;"></div>`;
    body.querySelector('#cj-in').value = 'name,age,city\nAlice,30,Karachi\nBob,25,Lahore';
    body.querySelector('#cj-run').onclick = () => {
      const mode = body.querySelector('input[name="cj-mode"]:checked').value;
      const inp = body.querySelector('#cj-in').value.trim();
      const info = body.querySelector('#cj-info');
      try {
        if (mode === 'c2j') {
          const lines = inp.split(/\r?\n/).filter(Boolean);
          const headers = lines[0].split(',').map((h) => h.trim());
          const rows = lines.slice(1).map((l) => { const cells = l.split(','); const o = {}; headers.forEach((h, i) => o[h] = (cells[i] || '').trim()); return o; });
          body.querySelector('#cj-out').value = JSON.stringify(rows, null, 2);
          info.innerHTML = `<span style="color:#10b981;">✓ Converted ${rows.length} rows</span>`;
        } else {
          const arr = JSON.parse(inp);
          if (!Array.isArray(arr) || !arr.length) throw new Error('Expected non-empty JSON array');
          const headers = Array.from(new Set(arr.flatMap((o) => Object.keys(o))));
          const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
          const csv = [headers.join(','), ...arr.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
          body.querySelector('#cj-out').value = csv;
          info.innerHTML = `<span style="color:#10b981;">✓ Converted ${arr.length} rows</span>`;
        }
      } catch (e) { info.innerHTML = `<span style="color:#ef4444;">✗ ${e.message}</span>`; }
    };
    body.querySelector('#cj-copy').onclick = () => copyText(body.querySelector('#cj-out').value);
    body.querySelector('#cj-run').click();
  };

  TOOLS['markdown-preview'] = (body) => {
    body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;min-height:400px;"><div><label style="${labelCss}">Markdown</label><textarea id="md-in" style="${areaCss};min-height:400px;font-family:ui-monospace,monospace;font-size:0.85rem;"></textarea></div><div><label style="${labelCss}">Preview</label><div id="md-out" style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;min-height:400px;overflow:auto;font-size:0.95rem;line-height:1.6;color:#0f172a;"></div></div></div><div style="${rowCss}"><button id="md-copy-html" style="${btn('#334155')}">Copy HTML</button></div>`;
    body.querySelector('#md-in').value = '# Hello World\n\nThis is **bold**, this is *italic*, and this is `code`.\n\n## Features\n\n- Item one\n- Item two\n- Item three\n\n[Visit Vextrolyntra](https://vextrolyntra.online)\n\n```js\nconsole.log("hello");\n```\n\n> A famous quote goes here.';
    const md = (t) => {
      let s = t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<pre style="background:#0f172a;color:#f1f5f9;padding:12px;border-radius:8px;overflow:auto;font-size:0.85rem;"><code>${c.trim()}</code></pre>`);
      s = s.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:0.9em;">$1</code>');
      s = s.replace(/^###### (.*)$/gm, '<h6>$1</h6>').replace(/^##### (.*)$/gm, '<h5>$1</h5>').replace(/^#### (.*)$/gm, '<h4>$1</h4>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2 style="font-size:1.4rem;font-weight:800;margin:14px 0 8px;">$1</h2>').replace(/^# (.*)$/gm, '<h1 style="font-size:1.8rem;font-weight:900;margin:16px 0 10px;">$1</h1>');
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#3b82f6;">$1</a>');
      s = s.replace(/^&gt; (.*)$/gm, '<blockquote style="border-left:4px solid #3b82f6;padding:6px 12px;background:#eff6ff;color:#1e40af;margin:8px 0;">$1</blockquote>');
      s = s.replace(/^- (.*)$/gm, '<li>$1</li>').replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="padding-left:22px;">$1</ul>').replace(/<\/ul>\s*<ul[^>]*>/g, '');
      s = s.split(/\n{2,}/).map((p) => /^<(h\d|ul|pre|blockquote)/.test(p.trim()) ? p : `<p style="margin:6px 0;">${p.replace(/\n/g, '<br>')}</p>`).join('\n');
      return s;
    };
    const update = () => body.querySelector('#md-out').innerHTML = md(body.querySelector('#md-in').value);
    body.querySelector('#md-in').oninput = update;
    body.querySelector('#md-copy-html').onclick = () => copyText(body.querySelector('#md-out').innerHTML);
    update();
  };

  TOOLS['favicon-generator'] = (body) => {
    body.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;"><label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#334155;font-size:0.9rem;"><input type="radio" name="fv-mode" value="emoji" checked> From Emoji</label><label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#334155;font-size:0.9rem;"><input type="radio" name="fv-mode" value="text"> From Text</label><label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#334155;font-size:0.9rem;"><input type="radio" name="fv-mode" value="image"> From Image</label></div><div id="fv-emoji-wrap"><label style="${labelCss}">Emoji</label><input id="fv-emoji" style="${inputCss};font-size:1.3rem;" value="🚀" maxlength="4"></div><div id="fv-text-wrap" style="display:none;"><label style="${labelCss}">Text (1-3 letters)</label><input id="fv-text" style="${inputCss};font-size:1.1rem;font-weight:900;text-transform:uppercase;" value="V" maxlength="3"><label style="${labelCss};margin-top:8px;">Background</label><input id="fv-bg" type="color" value="#3b82f6" style="width:100%;height:42px;border:1px solid #e2e8f0;border-radius:10px;"><label style="${labelCss};margin-top:8px;">Text Color</label><input id="fv-fg" type="color" value="#ffffff" style="width:100%;height:42px;border:1px solid #e2e8f0;border-radius:10px;"></div><div id="fv-image-wrap" style="display:none;"><label style="${labelCss}">Image</label><input id="fv-file" type="file" accept="image/*" style="${inputCss}"></div><div style="${rowCss}"><button id="fv-gen" style="${btn('#f59e0b')}">Generate Favicons</button></div><div id="fv-out" style="margin-top:20px;"></div>`;
    const showMode = () => {
      const m = body.querySelector('input[name="fv-mode"]:checked').value;
      body.querySelector('#fv-emoji-wrap').style.display = m === 'emoji' ? 'block' : 'none';
      body.querySelector('#fv-text-wrap').style.display = m === 'text' ? 'block' : 'none';
      body.querySelector('#fv-image-wrap').style.display = m === 'image' ? 'block' : 'none';
    };
    body.querySelectorAll('input[name="fv-mode"]').forEach((r) => r.onchange = showMode);
    const drawSize = (size, cb) => {
      const c = document.createElement('canvas'); c.width = size; c.height = size; const ctx = c.getContext('2d');
      const mode = body.querySelector('input[name="fv-mode"]:checked').value;
      if (mode === 'emoji') {
        ctx.font = `${Math.floor(size * 0.8)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(body.querySelector('#fv-emoji').value || '🚀', size / 2, size / 2 + size * 0.02);
        cb(c);
      } else if (mode === 'text') {
        ctx.fillStyle = body.querySelector('#fv-bg').value; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = body.querySelector('#fv-fg').value; ctx.font = `900 ${Math.floor(size * 0.55)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText((body.querySelector('#fv-text').value || 'V').toUpperCase(), size / 2, size / 2 + size * 0.04);
        cb(c);
      } else {
        const f = body.querySelector('#fv-file').files[0]; if (!f) { flash('Select an image'); return; }
        const im = new Image(); im.onload = () => { ctx.drawImage(im, 0, 0, size, size); cb(c); }; im.src = URL.createObjectURL(f);
      }
    };
    body.querySelector('#fv-gen').onclick = () => {
      const sizes = [16, 32, 64, 128, 180, 192, 512];
      const out = body.querySelector('#fv-out'); out.innerHTML = '';
      out.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;" id="fv-grid"></div><div style="margin-top:16px;padding:14px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;color:#78350f;font-size:0.85rem;line-height:1.6;"><b>HTML for &lt;head&gt;:</b><pre style="background:#fff;padding:10px;border-radius:8px;margin-top:8px;font-size:0.75rem;overflow:auto;">&lt;link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png"&gt;&#10;&lt;link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png"&gt;&#10;&lt;link rel="apple-touch-icon" sizes="180x180" href="favicon-180.png"&gt;</pre></div>`;
      const grid = out.querySelector('#fv-grid');
      sizes.forEach((s) => drawSize(s, (c) => {
        c.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const item = document.createElement('div');
          item.style.cssText = 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;';
          item.innerHTML = `<img src="${url}" style="width:64px;height:64px;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;background:#fff;"><div style="font-weight:800;color:#0f172a;margin-top:6px;font-size:0.85rem;">${s}×${s}</div><a href="${url}" download="favicon-${s}.png" style="${btnGhost};text-decoration:none;padding:5px 10px;font-size:0.75rem;margin-top:6px;display:inline-block;"><i class="fa-solid fa-download"></i> Download</a>`;
          grid.appendChild(item);
        }, 'image/png');
      }));
    };
    body.querySelector('#fv-gen').click();
  };

  TOOLS['percentage-calculator'] = (body) => {
    body.innerHTML = `<div style="display:grid;gap:16px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;"><div style="font-weight:800;color:#0f172a;margin-bottom:10px;">What is X% of Y?</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input id="p1-x" type="number" style="${inputCss};max-width:120px;" value="15"><span style="font-weight:700;">% of</span><input id="p1-y" type="number" style="${inputCss};max-width:150px;" value="200"><span style="font-weight:700;">=</span><span id="p1-out" style="font-weight:900;color:#0ea5e9;font-size:1.2rem;"></span></div></div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;"><div style="font-weight:800;color:#0f172a;margin-bottom:10px;">X is what % of Y?</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input id="p2-x" type="number" style="${inputCss};max-width:120px;" value="30"><span style="font-weight:700;">is what % of</span><input id="p2-y" type="number" style="${inputCss};max-width:150px;" value="150"><span style="font-weight:700;">=</span><span id="p2-out" style="font-weight:900;color:#0ea5e9;font-size:1.2rem;"></span></div></div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;"><div style="font-weight:800;color:#0f172a;margin-bottom:10px;">% Change from X to Y</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input id="p3-x" type="number" style="${inputCss};max-width:120px;" value="100"><span style="font-weight:700;">to</span><input id="p3-y" type="number" style="${inputCss};max-width:150px;" value="125"><span style="font-weight:700;">=</span><span id="p3-out" style="font-weight:900;color:#0ea5e9;font-size:1.2rem;"></span></div></div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;"><div style="font-weight:800;color:#0f172a;margin-bottom:10px;">Discount Calculator</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">Price <input id="p4-p" type="number" style="${inputCss};max-width:120px;" value="1000"> − <input id="p4-d" type="number" style="${inputCss};max-width:100px;" value="20">% = <span id="p4-out" style="font-weight:900;color:#10b981;font-size:1.2rem;"></span></div></div>
    </div>`;
    const upd = () => {
      const g = (id) => +body.querySelector(id).value || 0;
      body.querySelector('#p1-out').textContent = ((g('#p1-x') * g('#p1-y')) / 100).toFixed(2);
      body.querySelector('#p2-out').textContent = g('#p2-y') ? ((g('#p2-x') / g('#p2-y')) * 100).toFixed(2) + '%' : '—';
      const c = g('#p3-x') ? (((g('#p3-y') - g('#p3-x')) / g('#p3-x')) * 100) : 0;
      body.querySelector('#p3-out').innerHTML = `<span style="color:${c >= 0 ? '#10b981' : '#ef4444'};">${c >= 0 ? '+' : ''}${c.toFixed(2)}%</span>`;
      const p = g('#p4-p'), d = g('#p4-d'); body.querySelector('#p4-out').textContent = (p - (p * d) / 100).toFixed(2);
    };
    body.querySelectorAll('input').forEach((i) => i.oninput = upd); upd();
  };

  TOOLS['emi-calculator'] = (body) => {
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;"><div><label style="${labelCss}">Loan Amount</label><input id="em-p" type="number" style="${inputCss}" value="100000"></div><div><label style="${labelCss}">Annual Interest Rate (%)</label><input id="em-r" type="number" step="0.01" style="${inputCss}" value="10"></div><div><label style="${labelCss}">Tenure (months)</label><input id="em-n" type="number" style="${inputCss}" value="24"></div></div><div style="${rowCss}"><button id="em-run" style="${btn('#16a34a')}">Calculate EMI</button></div><div id="em-out" style="margin-top:18px;"></div>`;
    body.querySelector('#em-run').onclick = () => {
      const P = +body.querySelector('#em-p').value, r = +body.querySelector('#em-r').value / 100 / 12, n = +body.querySelector('#em-n').value;
      if (!P || !r || !n) { flash('Enter valid values'); return; }
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = emi * n, interest = total - P;
      const fmt = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
      const items = [['Monthly EMI', fmt(emi), '#16a34a'], ['Total Interest', fmt(interest), '#f59e0b'], ['Total Payment', fmt(total), '#3b82f6']];
      body.querySelector('#em-out').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">${items.map(([l, v, c]) => `<div style="background:${c}12;border:1px solid ${c}40;border-radius:14px;padding:18px;text-align:center;"><div style="font-size:0.75rem;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:1px;">${l}</div><div style="font-size:1.4rem;font-weight:900;color:#0f172a;margin-top:6px;">${v}</div></div>`).join('')}</div>`;
    };
    body.querySelector('#em-run').click();
  };

  TOOLS['image-cropper'] = (body) => {
    body.innerHTML = `<label style="${labelCss}">Select Image</label><input id="cr-file" type="file" accept="image/*" style="${inputCss}"><div id="cr-wrap" style="position:relative;margin-top:14px;display:none;overflow:hidden;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><canvas id="cr-canvas" style="max-width:100%;display:block;cursor:crosshair;"></canvas></div><div id="cr-hint" style="margin-top:10px;font-size:0.85rem;color:#64748b;">👆 Select an image, then <b>click and drag</b> on it to select the crop area.</div><div style="${rowCss}"><button id="cr-run" style="${btn('#ec4899')}">Crop & Preview</button><a id="cr-dl" style="${btnGhost};text-decoration:none;display:none;" download="cropped.png">Download</a></div><div id="cr-preview" style="margin-top:14px;text-align:center;"></div>`;
    let img = null, canvas, ctx, dpr = 1, dragging = false, sel = null, start = null;
    body.querySelector('#cr-file').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      img = new Image();
      img.onload = () => {
        canvas = body.querySelector('#cr-canvas'); ctx = canvas.getContext('2d');
        const maxW = 720; dpr = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        canvas.width = img.naturalWidth * dpr; canvas.height = img.naturalHeight * dpr;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        body.querySelector('#cr-wrap').style.display = 'block';
        sel = null;
      };
      img.src = URL.createObjectURL(f);
    };
    const getPos = (e) => { const r = canvas.getBoundingClientRect(); const sx = canvas.width / r.width; const sy = canvas.height / r.height; const p = e.touches ? e.touches[0] : e; return { x: (p.clientX - r.left) * sx, y: (p.clientY - r.top) * sy }; };
    const draw = () => {
      if (!img) return; ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (sel) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.clearRect(sel.x, sel.y, sel.w, sel.h); ctx.drawImage(img, sel.x / dpr, sel.y / dpr, sel.w / dpr, sel.h / dpr, sel.x, sel.y, sel.w, sel.h); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2; ctx.strokeRect(sel.x, sel.y, sel.w, sel.h); }
    };
    body.querySelector('#cr-wrap').addEventListener('mousedown', (e) => { if (!img) return; dragging = true; start = getPos(e); sel = { x: start.x, y: start.y, w: 0, h: 0 }; });
    body.querySelector('#cr-wrap').addEventListener('mousemove', (e) => { if (!dragging) return; const p = getPos(e); sel = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) }; draw(); });
    window.addEventListener('mouseup', () => { dragging = false; });
    body.querySelector('#cr-run').onclick = () => {
      if (!img || !sel || sel.w < 5 || sel.h < 5) { flash('Drag on the image to select an area first'); return; }
      const c = document.createElement('canvas'); c.width = sel.w / dpr; c.height = sel.h / dpr;
      c.getContext('2d').drawImage(img, sel.x / dpr, sel.y / dpr, sel.w / dpr, sel.h / dpr, 0, 0, c.width, c.height);
      c.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        body.querySelector('#cr-preview').innerHTML = `<div style="${labelCss}">Cropped Result (${Math.round(c.width)}×${Math.round(c.height)})</div><img src="${url}" style="max-width:100%;border:1px solid #e2e8f0;border-radius:10px;">`;
        const dl = body.querySelector('#cr-dl'); dl.href = url; dl.style.display = 'inline-block';
      }, 'image/png');
    };
  };

  window.renderToolsPage = async function () {
    await loadTools();
    const m = location.hash.match(/^#\/tools\/(.+)$/);
    if (m && ALL_TOOLS.find((x) => x.id === m[1])) {
      renderGrid();
      openToolPage(m[1]);
      return;
    }
    renderGrid();
    const s = document.getElementById('toolsSearchInput');
    if (s && !s.dataset.bound) {
      s.dataset.bound = '1';
      s.addEventListener('input', (e) => { SEARCH = e.target.value || ''; renderGrid(); });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname === '/tools' || location.hash.startsWith('#/tools')) {
      setTimeout(() => window.showPage && window.showPage('tools'), 300);
    }
  });
})();
