/* Tools system — each tool has its own page at #/tools/<id> */
(function () {
  'use strict';

  let ALL_TOOLS = [];
  let ACTIVE_CAT = 'All';
  let SEARCH = '';
  let CURRENT_TOOL = null; // id of open tool detail

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

  function cardHtml(t) {
    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';
    const badge = t.badge
      ? `<span style="position:absolute;top:14px;right:14px;background:${t.badge === 'Pro' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'rgba(16,185,129,0.12)'};color:${t.badge === 'Pro' ? '#fff' : '#10b981'};font-size:0.7rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.5px;">${safe(t.badge)}</span>` : '';
    return `
      <div class="tool-card" data-tool-open="${safe(t.id)}" style="position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;transition:transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column;gap:14px;cursor:pointer;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(15,23,42,0.08)';" onmouseout="this.style.transform='';this.style.boxShadow='';">
        ${badge}
        <div style="width:56px;height:56px;border-radius:14px;background:${color}18;color:${color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="${icon}"></i></div>
        <div>
          <div style="font-size:0.72rem;font-weight:800;color:${color};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${safe(t.category)}</div>
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
    // Restore grid view (hide detail)
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
    if (catBar && !catBar.dataset.built) {
      catBar.dataset.built = '1';
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

  /* ============ TOOL DETAIL PAGE ============ */
  function ensureDetailContainer() {
    let d = document.getElementById('toolDetailView');
    if (d) return d;
    const page = document.getElementById('toolsPage');
    if (!page) return null;
    d = document.createElement('div');
    d.id = 'toolDetailView';
    d.style.cssText = 'display:none;padding:40px 20px 60px;';
    page.appendChild(d);
    return d;
  }

  function openToolPage(id) {
    const t = ALL_TOOLS.find((x) => x.id === id);
    if (!t) return;
    CURRENT_TOOL = id;
    // Update hash for deep linking
    if (location.hash !== '#/tools/' + id) {
      history.pushState({ tool: id }, '', '#/tools/' + id);
    }
    // Update document title (SEO)
    document.title = `${t.title} — Free Online Tool | Vextrolyntra`;

    // Hide grid, show detail
    const gridWrap = document.getElementById('toolsGridWrap');
    if (gridWrap) gridWrap.style.display = 'none';
    const detail = ensureDetailContainer();
    if (!detail) return;
    detail.style.display = 'block';

    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';
    detail.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <button id="toolBackBtn" style="display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;margin-bottom:20px;">
          <i class="fa-solid fa-arrow-left"></i> Back to All Tools
        </button>
        <div style="background:linear-gradient(135deg,${color}12,${color}05);border:1px solid ${color}30;border-radius:20px;padding:32px;margin-bottom:24px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
          <div style="width:72px;height:72px;border-radius:18px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.9rem;box-shadow:0 12px 28px ${color}55;flex-shrink:0;"><i class="${icon}"></i></div>
          <div style="flex:1;min-width:220px;">
            <div style="font-size:0.72rem;font-weight:800;color:${color};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${safe(t.category)}</div>
            <h1 style="margin:0 0 6px;color:#0f172a;font-size:1.7rem;font-weight:900;">${safe(t.title)}</h1>
            <p style="margin:0;color:#475569;font-size:1rem;line-height:1.55;">${safe(t.description)}</p>
          </div>
        </div>
        <div id="toolBody" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;"></div>
      </div>`;
    document.getElementById('toolBackBtn').addEventListener('click', backToGrid);
    const impl = TOOLS[id];
    const body = document.getElementById('toolBody');
    if (impl) impl(body, t);
    else body.innerHTML = `<p style="color:#64748b;text-align:center;padding:40px;">This tool is coming soon.</p>`;
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

  /* ============ SHARED UI ============ */
  const btn = (color = '#3b82f6') => `background:${color};color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;`;
  const btnGhost = 'background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;';
  const inputCss = 'width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;';
  const areaCss = inputCss + 'min-height:140px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;';
  const rowCss = 'display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;';
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

  // ============ NEW TOOLS ============

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
    // cleanup interval when leaving
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
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;"><div><label style="${labelCss}">X Offset: <span id="bs-x-val">0</span>px</label><input id="bs-x" type="range" min="-50" max="50" value="0" style="width:100%;"></div><div><label style="${labelCss}">Y Offset: <span id="bs-y-val">12</span>px</label><input id="bs-y" type="range" min="-50" max="50" value="12" style="width:100%;"></div><div><label style="${labelCss}">Blur: <span id="bs-b-val">24</span>px</label><input id="bs-b" type="range" min="0" max="100" value="24" style="width:100%;"></div><div><label style="${labelCss}">Spread: <span id="bs-s-val">0</span>px</label><input id="bs-s" type="range" min="-30" max="30" value="0" style="width:100%;"></div><div><label style="${labelCss}">Color</label><input id="bs-c" type="color" value="#0f172a" style="width:100%;height:42px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;"></div><div><label style="${labelCss}">Opacity: <span id="bs-o-val">20</span>%</label><input id="bs-o" type="range" min="0" max="100" value="20" style="width:100%;"></div></div><div style="display:flex;justify-content:center;align-items:center;padding:60px;background:#f8fafc;border-radius:16px;margin-top:16px;"><div id="bs-preview" style="width:140px;height:140px;background:#fff;border-radius:16px;"></div></div><label style="${labelCss};margin-top:14px;">CSS Code</label><textarea id="bs-out" style="${areaCss};min-height:60px;font-family:ui-monospace,monospace;" readonly></textarea><div style="${rowCss}"><button id="bs-copy" style="${btn('#4f46e5')}">Copy CSS</button></div>`;
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

  window.renderToolsPage = async function () {
    await loadTools();
    // Check hash: is deep link to a specific tool?
    const m = location.hash.match(/^#\/tools\/(.+)$/);
    if (m && ALL_TOOLS.find((x) => x.id === m[1])) {
      renderGrid(); // populate grid in background so back works
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

  // Deep link on load
  document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname === '/tools' || location.hash.startsWith('#/tools')) {
      setTimeout(() => window.showPage && window.showPage('tools'), 300);
    }
  });
})();
