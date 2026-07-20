/* Tools page — loads data/tools.json, renders grid, and runs tools ON-SITE in a modal */
(function () {
  'use strict';

  let ALL_TOOLS = [];
  let ACTIVE_CAT = 'All';
  let SEARCH = '';

  async function loadTools() {
    if (ALL_TOOLS.length) return ALL_TOOLS;
    try {
      const res = await fetch('data/tools.json', { cache: 'no-store' });
      ALL_TOOLS = await res.json();
    } catch (e) {
      console.error('tools.json load failed', e);
      ALL_TOOLS = [];
    }
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
      return (
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    });
  }

  function cardHtml(t) {
    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';
    const badge = t.badge
      ? `<span style="position:absolute;top:14px;right:14px;background:${
          t.badge === 'Pro' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'rgba(16,185,129,0.12)'
        };color:${t.badge === 'Pro' ? '#fff' : '#10b981'};font-size:0.7rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.5px;">${safe(t.badge)}</span>`
      : '';

    return `
      <div style="position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;transition:transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column;gap:14px;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(15,23,42,0.08)';" onmouseout="this.style.transform='';this.style.boxShadow='';">
        ${badge}
        <div style="width:56px;height:56px;border-radius:14px;background:${color}18;color:${color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
          <i class="${icon}"></i>
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:800;color:${color};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${safe(t.category)}</div>
          <h3 style="margin:0 0 8px;color:#0f172a;font-size:1.15rem;font-weight:800;">${safe(t.title)}</h3>
          <p style="margin:0;color:#64748b;font-size:0.92rem;line-height:1.55;">${safe(t.description)}</p>
        </div>
        <div style="margin-top:auto;">
          <button data-tool-open="${safe(t.id)}" style="display:inline-flex;align-items:center;gap:8px;background:${color};color:#fff;padding:10px 18px;border-radius:10px;font-weight:700;font-size:0.9rem;border:none;cursor:pointer;box-shadow:0 6px 16px ${color}55;">Open Tool <i class="fa-solid fa-arrow-right" style="font-size:0.8rem;"></i></button>
        </div>
      </div>`;
  }

  function render() {
    const grid = document.getElementById('toolsGrid');
    const empty = document.getElementById('toolsEmpty');
    if (!grid) return;
    const list = filtered();
    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
    } else {
      if (empty) empty.style.display = 'none';
      grid.innerHTML = list.map(cardHtml).join('');
      grid.querySelectorAll('[data-tool-open]').forEach((btn) => {
        btn.addEventListener('click', () => openTool(btn.getAttribute('data-tool-open')));
      });
    }
    const catBar = document.getElementById('toolsCategories');
    if (catBar && !catBar.dataset.built) {
      catBar.dataset.built = '1';
      catBar.innerHTML = categories()
        .map((c) => `<button class="blog-cat-btn${c === ACTIVE_CAT ? ' active' : ''}" data-cat="${safe(c)}">${safe(c)}</button>`)
        .join('');
      catBar.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          ACTIVE_CAT = btn.dataset.cat;
          catBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
          render();
        });
      });
    }
  }

  /* ============== MODAL ============== */
  function ensureModal() {
    let m = document.getElementById('toolModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'toolModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.72);display:none;align-items:flex-start;justify-content:center;z-index:9999;padding:24px;overflow-y:auto;backdrop-filter:blur(4px);';
    m.innerHTML = `
      <div id="toolModalCard" style="background:#fff;border-radius:20px;max-width:820px;width:100%;margin:auto;box-shadow:0 24px 60px rgba(0,0,0,0.3);overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div id="toolModalIcon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;"></div>
            <h3 id="toolModalTitle" style="margin:0;color:#0f172a;font-size:1.15rem;font-weight:800;"></h3>
          </div>
          <button id="toolModalClose" style="background:transparent;border:none;font-size:1.4rem;color:#64748b;cursor:pointer;padding:6px 10px;border-radius:8px;">&times;</button>
        </div>
        <div id="toolModalBody" style="padding:24px;"></div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    m.querySelector('#toolModalClose').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    return m;
  }
  function closeModal() {
    const m = document.getElementById('toolModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
  }
  function openTool(id) {
    const t = ALL_TOOLS.find((x) => x.id === id);
    if (!t) return;
    const m = ensureModal();
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const iconEl = m.querySelector('#toolModalIcon');
    iconEl.style.background = (t.color || '#3b82f6') + '18';
    iconEl.style.color = t.color || '#3b82f6';
    iconEl.innerHTML = `<i class="${t.icon || 'fa-solid fa-toolbox'}"></i>`;
    m.querySelector('#toolModalTitle').textContent = t.title;
    const body = m.querySelector('#toolModalBody');
    body.innerHTML = '';
    const impl = TOOLS[id];
    if (impl) impl(body, t);
    else body.innerHTML = `<p style="color:#64748b;">This tool is coming soon.</p>`;
  }

  /* ============== SHARED UI HELPERS ============== */
  const btn = (label, color = '#3b82f6') => `background:${color};color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;`;
  const btnGhost = 'background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;';
  const inputCss = 'width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;';
  const areaCss = inputCss + 'min-height:140px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;';
  const rowCss = 'display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;';
  const labelCss = 'display:block;font-size:0.85rem;font-weight:700;color:#334155;margin-bottom:6px;';
  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => flash('Copied to clipboard!'));
  }
  function flash(msg) {
    let f = document.getElementById('toolFlash');
    if (!f) { f = document.createElement('div'); f.id = 'toolFlash'; f.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;z-index:10000;box-shadow:0 12px 32px rgba(0,0,0,0.3);'; document.body.appendChild(f); }
    f.textContent = msg; f.style.display = 'block';
    clearTimeout(f._t); f._t = setTimeout(() => (f.style.display = 'none'), 1800);
  }

  /* ============== TOOL IMPLEMENTATIONS ============== */
  const TOOLS = {};

  // 1. JSON Formatter
  TOOLS['json-formatter'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Paste JSON</label>
      <textarea id="jf-in" style="${areaCss}" placeholder='{"hello":"world"}'></textarea>
      <div style="${rowCss}">
        <button id="jf-beautify" style="${btn('#3b82f6')}">Beautify</button>
        <button id="jf-minify" style="${btnGhost}">Minify</button>
        <button id="jf-copy" style="${btnGhost}">Copy Result</button>
      </div>
      <label style="${labelCss};margin-top:16px;">Result</label>
      <textarea id="jf-out" style="${areaCss}" readonly></textarea>
      <div id="jf-status" style="margin-top:8px;font-size:0.85rem;font-weight:700;"></div>`;
    const run = (indent) => {
      const inp = body.querySelector('#jf-in').value;
      const out = body.querySelector('#jf-out');
      const st = body.querySelector('#jf-status');
      try { const p = JSON.parse(inp); out.value = JSON.stringify(p, null, indent); st.textContent = '✓ Valid JSON'; st.style.color = '#10b981'; }
      catch (e) { out.value = ''; st.textContent = '✗ ' + e.message; st.style.color = '#ef4444'; }
    };
    body.querySelector('#jf-beautify').onclick = () => run(2);
    body.querySelector('#jf-minify').onclick = () => run(0);
    body.querySelector('#jf-copy').onclick = () => copyText(body.querySelector('#jf-out').value);
  };

  // 2. Password Generator
  TOOLS['password-generator'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Length: <span id="pg-len-val">16</span></label>
      <input id="pg-len" type="range" min="6" max="64" value="16" style="width:100%;">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px;">
        <label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-upper" checked> Uppercase (A-Z)</label>
        <label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-lower" checked> Lowercase (a-z)</label>
        <label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-num" checked> Numbers (0-9)</label>
        <label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#334155;"><input type="checkbox" id="pg-sym" checked> Symbols (!@#$)</label>
      </div>
      <div style="${rowCss}">
        <button id="pg-gen" style="${btn('#10b981')}">Generate</button>
        <button id="pg-copy" style="${btnGhost}">Copy</button>
      </div>
      <input id="pg-out" style="${inputCss};margin-top:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1.05rem;" readonly>`;
    const gen = () => {
      const len = +body.querySelector('#pg-len').value;
      body.querySelector('#pg-len-val').textContent = len;
      let charset = '';
      if (body.querySelector('#pg-upper').checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (body.querySelector('#pg-lower').checked) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (body.querySelector('#pg-num').checked) charset += '0123456789';
      if (body.querySelector('#pg-sym').checked) charset += '!@#$%^&*()-_=+[]{}<>?';
      if (!charset) { flash('Select at least one option'); return; }
      const arr = new Uint32Array(len); crypto.getRandomValues(arr);
      let out = ''; for (let i = 0; i < len; i++) out += charset[arr[i] % charset.length];
      body.querySelector('#pg-out').value = out;
    };
    body.querySelector('#pg-len').oninput = () => (body.querySelector('#pg-len-val').textContent = body.querySelector('#pg-len').value);
    body.querySelector('#pg-gen').onclick = gen;
    body.querySelector('#pg-copy').onclick = () => copyText(body.querySelector('#pg-out').value);
    gen();
  };

  // 3. QR Code Generator (via public API image)
  TOOLS['qr-generator'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Text or URL</label>
      <input id="qr-in" style="${inputCss}" placeholder="https://vextrolyntra.online" value="https://vextrolyntra.online">
      <label style="${labelCss};margin-top:12px;">Size (px)</label>
      <input id="qr-size" type="number" min="100" max="800" value="300" style="${inputCss}">
      <div style="${rowCss}">
        <button id="qr-gen" style="${btn('#f97316')}">Generate QR</button>
        <a id="qr-dl" style="${btnGhost};text-decoration:none;display:inline-block;" download="qrcode.png">Download</a>
      </div>
      <div style="margin-top:20px;text-align:center;">
        <img id="qr-img" alt="QR Code" style="max-width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#fff;display:none;">
      </div>`;
    const run = () => {
      const txt = body.querySelector('#qr-in').value.trim();
      if (!txt) { flash('Enter text or URL'); return; }
      const size = +body.querySelector('#qr-size').value || 300;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(txt)}`;
      const img = body.querySelector('#qr-img'); img.src = url; img.style.display = 'inline-block';
      body.querySelector('#qr-dl').href = url;
    };
    body.querySelector('#qr-gen').onclick = run;
    run();
  };

  // 4. Word & Character Counter
  TOOLS['word-counter'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Text</label>
      <textarea id="wc-in" style="${areaCss}" placeholder="Paste or type your text here..."></textarea>
      <div id="wc-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:16px;"></div>`;
    const stats = body.querySelector('#wc-stats');
    const update = () => {
      const t = body.querySelector('#wc-in').value;
      const words = (t.trim().match(/\S+/g) || []).length;
      const chars = t.length;
      const charsNoSpace = t.replace(/\s/g, '').length;
      const sentences = (t.match(/[.!?]+(\s|$)/g) || []).length;
      const paragraphs = (t.split(/\n{2,}/).filter((p) => p.trim())).length;
      const readMin = Math.max(1, Math.ceil(words / 200));
      const items = [
        ['Words', words, '#8b5cf6'], ['Characters', chars, '#3b82f6'], ['No Spaces', charsNoSpace, '#10b981'],
        ['Sentences', sentences, '#f97316'], ['Paragraphs', paragraphs, '#ec4899'], ['Read Time', readMin + ' min', '#14b8a6'],
      ];
      stats.innerHTML = items.map(([l, v, c]) => `<div style="background:${c}12;border:1px solid ${c}30;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${l}</div></div>`).join('');
    };
    body.querySelector('#wc-in').oninput = update; update();
  };

  // 5. Color Picker & Converter
  TOOLS['color-picker'] = (body) => {
    body.innerHTML = `
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
        <input id="cp-pick" type="color" value="#ef4444" style="width:120px;height:120px;border:none;border-radius:16px;cursor:pointer;">
        <div style="flex:1;min-width:220px;">
          <label style="${labelCss}">HEX</label>
          <input id="cp-hex" style="${inputCss};font-family:ui-monospace,monospace;">
          <label style="${labelCss};margin-top:10px;">RGB</label>
          <input id="cp-rgb" style="${inputCss};font-family:ui-monospace,monospace;" readonly>
          <label style="${labelCss};margin-top:10px;">HSL</label>
          <input id="cp-hsl" style="${inputCss};font-family:ui-monospace,monospace;" readonly>
        </div>
      </div>
      <div style="${rowCss}">
        <button id="cp-copy-hex" style="${btn('#ef4444')}">Copy HEX</button>
        <button id="cp-copy-rgb" style="${btnGhost}">Copy RGB</button>
        <button id="cp-copy-hsl" style="${btnGhost}">Copy HSL</button>
      </div>`;
    const hexToRgb = (h) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null; };
    const rgbToHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2;
      if (max === min) h = s = 0;
      else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
        h /= 6; }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };
    const update = (hex) => {
      const rgb = hexToRgb(hex); if (!rgb) return;
      const [r, g, b] = rgb; const [h, s, l] = rgbToHsl(r, g, b);
      body.querySelector('#cp-hex').value = hex.toUpperCase();
      body.querySelector('#cp-rgb').value = `rgb(${r}, ${g}, ${b})`;
      body.querySelector('#cp-hsl').value = `hsl(${h}, ${s}%, ${l}%)`;
      body.querySelector('#cp-pick').value = hex;
    };
    body.querySelector('#cp-pick').oninput = (e) => update(e.target.value);
    body.querySelector('#cp-hex').oninput = (e) => update(e.target.value);
    body.querySelector('#cp-copy-hex').onclick = () => copyText(body.querySelector('#cp-hex').value);
    body.querySelector('#cp-copy-rgb').onclick = () => copyText(body.querySelector('#cp-rgb').value);
    body.querySelector('#cp-copy-hsl').onclick = () => copyText(body.querySelector('#cp-hsl').value);
    update('#ef4444');
  };

  // 6. Meta Tag Generator
  TOOLS['meta-tag-generator'] = (body) => {
    body.innerHTML = `
      <div style="display:grid;gap:10px;">
        <div><label style="${labelCss}">Page Title</label><input id="mt-title" style="${inputCss}" placeholder="My Awesome Page"></div>
        <div><label style="${labelCss}">Description</label><textarea id="mt-desc" style="${areaCss};min-height:70px;" placeholder="A short summary of the page..."></textarea></div>
        <div><label style="${labelCss}">Keywords (comma separated)</label><input id="mt-kw" style="${inputCss}" placeholder="seo, marketing, tools"></div>
        <div><label style="${labelCss}">Author</label><input id="mt-author" style="${inputCss}" placeholder="Your Name"></div>
        <div><label style="${labelCss}">Page URL</label><input id="mt-url" style="${inputCss}" placeholder="https://example.com/page"></div>
        <div><label style="${labelCss}">Image URL (og:image)</label><input id="mt-img" style="${inputCss}" placeholder="https://example.com/cover.jpg"></div>
      </div>
      <div style="${rowCss}"><button id="mt-gen" style="${btn('#14b8a6')}">Generate</button><button id="mt-copy" style="${btnGhost}">Copy HTML</button></div>
      <label style="${labelCss};margin-top:14px;">Generated Meta Tags</label>
      <textarea id="mt-out" style="${areaCss};min-height:200px;" readonly></textarea>`;
    const gen = () => {
      const g = (id) => body.querySelector(id).value.trim();
      const title = g('#mt-title'), desc = g('#mt-desc'), kw = g('#mt-kw'), author = g('#mt-author'), url = g('#mt-url'), img = g('#mt-img');
      const esc = (s) => s.replace(/"/g, '&quot;');
      const out = [
        title && `<title>${esc(title)}</title>`,
        desc && `<meta name="description" content="${esc(desc)}">`,
        kw && `<meta name="keywords" content="${esc(kw)}">`,
        author && `<meta name="author" content="${esc(author)}">`,
        url && `<link rel="canonical" href="${esc(url)}">`,
        '',
        '<!-- Open Graph -->',
        title && `<meta property="og:title" content="${esc(title)}">`,
        desc && `<meta property="og:description" content="${esc(desc)}">`,
        url && `<meta property="og:url" content="${esc(url)}">`,
        img && `<meta property="og:image" content="${esc(img)}">`,
        `<meta property="og:type" content="website">`,
        '',
        '<!-- Twitter -->',
        `<meta name="twitter:card" content="summary_large_image">`,
        title && `<meta name="twitter:title" content="${esc(title)}">`,
        desc && `<meta name="twitter:description" content="${esc(desc)}">`,
        img && `<meta name="twitter:image" content="${esc(img)}">`,
      ].filter(Boolean).join('\n');
      body.querySelector('#mt-out').value = out;
    };
    body.querySelector('#mt-gen').onclick = gen;
    body.querySelector('#mt-copy').onclick = () => copyText(body.querySelector('#mt-out').value);
  };

  // 7. Base64
  TOOLS['base64'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Input</label>
      <textarea id="b64-in" style="${areaCss}" placeholder="Enter text..."></textarea>
      <div style="${rowCss}">
        <button id="b64-enc" style="${btn('#6366f1')}">Encode</button>
        <button id="b64-dec" style="${btnGhost}">Decode</button>
        <button id="b64-copy" style="${btnGhost}">Copy Result</button>
      </div>
      <label style="${labelCss};margin-top:14px;">Output</label>
      <textarea id="b64-out" style="${areaCss}" readonly></textarea>`;
    body.querySelector('#b64-enc').onclick = () => {
      try { body.querySelector('#b64-out').value = btoa(unescape(encodeURIComponent(body.querySelector('#b64-in').value))); }
      catch (e) { flash('Encode failed'); }
    };
    body.querySelector('#b64-dec').onclick = () => {
      try { body.querySelector('#b64-out').value = decodeURIComponent(escape(atob(body.querySelector('#b64-in').value))); }
      catch (e) { flash('Invalid Base64'); }
    };
    body.querySelector('#b64-copy').onclick = () => copyText(body.querySelector('#b64-out').value);
  };

  // 8. Image Compressor
  TOOLS['image-compressor'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Select Image (PNG / JPG)</label>
      <input id="ic-file" type="file" accept="image/*" style="${inputCss}">
      <label style="${labelCss};margin-top:12px;">Quality: <span id="ic-q-val">70</span>%</label>
      <input id="ic-q" type="range" min="10" max="100" value="70" style="width:100%;">
      <label style="${labelCss};margin-top:12px;">Max Width (px, 0 = original)</label>
      <input id="ic-w" type="number" value="0" min="0" style="${inputCss}">
      <div style="${rowCss}">
        <button id="ic-run" style="${btn('#ec4899')}">Compress</button>
        <a id="ic-dl" style="${btnGhost};text-decoration:none;display:none;" download="compressed.jpg">Download</a>
      </div>
      <div id="ic-info" style="margin-top:14px;color:#64748b;font-size:0.9rem;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
        <div><div style="${labelCss}">Original</div><img id="ic-orig" style="max-width:100%;border-radius:10px;border:1px solid #e2e8f0;"></div>
        <div><div style="${labelCss}">Compressed</div><img id="ic-out" style="max-width:100%;border-radius:10px;border:1px solid #e2e8f0;"></div>
      </div>`;
    body.querySelector('#ic-q').oninput = () => (body.querySelector('#ic-q-val').textContent = body.querySelector('#ic-q').value);
    let origBlob = null, origBytes = 0;
    body.querySelector('#ic-file').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return; origBlob = f; origBytes = f.size;
      body.querySelector('#ic-orig').src = URL.createObjectURL(f);
    };
    body.querySelector('#ic-run').onclick = () => {
      if (!origBlob) { flash('Select an image first'); return; }
      const q = +body.querySelector('#ic-q').value / 100;
      const maxW = +body.querySelector('#ic-w').value || 0;
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

  // 9. URL Encoder / Decoder
  TOOLS['url-encoder'] = (body) => {
    body.innerHTML = `
      <label style="${labelCss}">Input</label>
      <textarea id="ue-in" style="${areaCss}" placeholder="Enter URL or text..."></textarea>
      <div style="${rowCss}">
        <button id="ue-enc" style="${btn('#0ea5e9')}">Encode</button>
        <button id="ue-dec" style="${btnGhost}">Decode</button>
        <button id="ue-copy" style="${btnGhost}">Copy Result</button>
      </div>
      <label style="${labelCss};margin-top:14px;">Output</label>
      <textarea id="ue-out" style="${areaCss}" readonly></textarea>`;
    body.querySelector('#ue-enc').onclick = () => { try { body.querySelector('#ue-out').value = encodeURIComponent(body.querySelector('#ue-in').value); } catch (e) { flash('Encode failed'); } };
    body.querySelector('#ue-dec').onclick = () => { try { body.querySelector('#ue-out').value = decodeURIComponent(body.querySelector('#ue-in').value); } catch (e) { flash('Invalid input'); } };
    body.querySelector('#ue-copy').onclick = () => copyText(body.querySelector('#ue-out').value);
  };

  window.renderToolsPage = async function () {
    await loadTools();
    render();
    const s = document.getElementById('toolsSearchInput');
    if (s && !s.dataset.bound) {
      s.dataset.bound = '1';
      s.addEventListener('input', (e) => { SEARCH = e.target.value || ''; render(); });
    }
  };

  // Auto-open on /tools deep link
  document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname === '/tools') {
      setTimeout(() => window.showPage && window.showPage('tools'), 300);
    }
  });
})();
