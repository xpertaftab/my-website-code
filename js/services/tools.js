/* Tools page — loads data/tools.json and renders a searchable grid */
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
    const safe = (s) => String(s || '').replace(/</g, '&lt;');
    const color = t.color || '#3b82f6';
    const icon = t.icon || 'fa-solid fa-toolbox';
    const url = t.url && t.url !== '#' ? t.url : '';
    const badge = t.badge
      ? `<span style="position:absolute;top:14px;right:14px;background:${
          t.badge === 'Pro' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'rgba(16,185,129,0.12)'
        };color:${t.badge === 'Pro' ? '#fff' : '#10b981'};font-size:0.7rem;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.5px;">${safe(
          t.badge,
        )}</span>`
      : '';
    const action = url
      ? `<a href="${safe(url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:${color};color:#fff;padding:10px 18px;border-radius:10px;font-weight:700;font-size:0.9rem;text-decoration:none;box-shadow:0 6px 16px ${color}55;">Open Tool <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.8rem;"></i></a>`
      : `<span style="display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;color:#94a3b8;padding:10px 18px;border-radius:10px;font-weight:700;font-size:0.9rem;">Coming Soon</span>`;

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
        <div style="margin-top:auto;">${action}</div>
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
    }
    // categories
    const catBar = document.getElementById('toolsCategories');
    if (catBar && !catBar.dataset.built) {
      catBar.dataset.built = '1';
      catBar.innerHTML = categories()
        .map(
          (c) =>
            `<button class="tools-cat-btn${c === ACTIVE_CAT ? ' active' : ''}" data-cat="${c.replace(/"/g, '&quot;')}">${c}</button>`,
        )
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

  window.renderToolsPage = async function () {
    await loadTools();
    render();
    const s = document.getElementById('toolsSearchInput');
    if (s && !s.dataset.bound) {
      s.dataset.bound = '1';
      s.addEventListener('input', (e) => {
        SEARCH = e.target.value || '';
        render();
      });
    }
  };

  // Hook into showPage
  const tryHook = () => {
    if (typeof window.showPage !== 'function') return setTimeout(tryHook, 250);
    const orig = window.showPage;
    if (orig.__toolsWrapped) return;
    window.showPage = function (page, subview) {
      const r = orig.apply(this, arguments);
      if (page === 'tools') {
        const el = document.getElementById('toolsPage');
        if (el) el.style.display = 'block';
        window.renderToolsPage();
      }
      return r;
    };
    window.showPage.__toolsWrapped = true;
  };
  tryHook();

  // Also hide toolsPage when other pages are shown (showPage doesn't know about it)
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('toolsPage');
    if (!el) return;
    // Watch home/blogs/etc for style changes so we hide tools when they show
    const observer = new MutationObserver(() => {
      // If any other main page is visible, hide tools (unless current path is /tools)
      const paths = ['homePage', 'blogsPage', 'shopPage', 'marketplacePage', 'guidePage', 'aboutPage', 'contactPage', 'dashboardPage', 'authPage', 'servicesMainPage', 'servicesPage'];
      const anyOther = paths.some((id) => {
        const p = document.getElementById(id);
        return p && p.style.display && p.style.display !== 'none';
      });
      if (anyOther) el.style.display = 'none';
    });
    paths_watch();
    function paths_watch() {
      ['homePage', 'blogsPage', 'shopPage', 'marketplacePage', 'guidePage', 'aboutPage', 'contactPage', 'dashboardPage', 'authPage', 'servicesMainPage', 'servicesPage'].forEach((id) => {
        const p = document.getElementById(id);
        if (p) observer.observe(p, { attributes: true, attributeFilter: ['style'] });
      });
    }
    // Auto-open when URL is /tools on load
    if (location.pathname === '/tools') {
      setTimeout(() => window.showPage && window.showPage('tools'), 300);
    }
  });
})();
