/* ═══════════════════════════════════════════════════════════════════
   Vextro Admin — Extra Modules
   Adds: Services, Settings, Coupons, Testimonials, Team,
         Notifications, Backup/Restore, Activity Log, Dark Mode, Multi-lang
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ── Storage helpers ────────────────────────────────────────────
  const load = (k, def) => { try { const r = localStorage.getItem('vextro_'+k); return r ? JSON.parse(r) : def; } catch(e){ return def; } };
  const save = (k, v) => { try { localStorage.setItem('vextro_'+k, JSON.stringify(v)); logActivity('save', k); return true; } catch(e){ alert('Storage full'); return false; } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  // ── Activity Log (used by all modules) ─────────────────────────
  function logActivity(action, detail){
    try {
      const log = load('activity_log', []);
      log.unshift({ id: uid(), action, detail: String(detail||''), user: (window.auth?.currentUser?.email)||'admin', ts: Date.now() });
      if (log.length > 500) log.length = 500;
      localStorage.setItem('vextro_activity_log', JSON.stringify(log));
    } catch(e){}
  }
  window.vextroLogActivity = logActivity;

  // ── i18n dictionary ────────────────────────────────────────────
  const DICT = {
    en: { Services:'Services', Settings:'Settings', Coupons:'Coupons', Testimonials:'Testimonials', Team:'Team', Backup:'Backup', 'Activity Log':'Activity Log', Notifications:'Notifications', Save:'Save', Cancel:'Cancel', Delete:'Delete', Edit:'Edit', Add:'Add', 'Add New':'Add New', Name:'Name', Price:'Price', Description:'Description', Role:'Role', Rating:'Rating', Image:'Image', Code:'Code', 'Discount %':'Discount %', 'Expiry':'Expiry', Active:'Active', Search:'Search', Export:'Export', Import:'Import', 'Dark Mode':'Dark Mode', 'Light Mode':'Light Mode', Language:'Language', 'View Site':'View Site', Menu:'Menu' },
    ur: { Services:'خدمات', Settings:'ترتیبات', Coupons:'کوپن', Testimonials:'رائے', Team:'ٹیم', Backup:'بیک اپ', 'Activity Log':'سرگرمی', Notifications:'اطلاعات', Save:'محفوظ کریں', Cancel:'منسوخ', Delete:'حذف', Edit:'ترمیم', Add:'شامل', 'Add New':'نیا شامل', Name:'نام', Price:'قیمت', Description:'تفصیل', Role:'کردار', Rating:'ریٹنگ', Image:'تصویر', Code:'کوڈ', 'Discount %':'رعایت %', 'Expiry':'ختم', Active:'فعال', Search:'تلاش', Export:'برآمد', Import:'درآمد', 'Dark Mode':'ڈارک موڈ', 'Light Mode':'لائٹ موڈ', Language:'زبان', 'View Site':'ویب سائٹ', Menu:'مینو' }
  };
  const t = (s) => (DICT[window.__vlLang||'en'] && DICT[window.__vlLang||'en'][s]) || s;
  window.__vlLang = localStorage.getItem('vl_lang') || 'en';

  // ── Common styles ──────────────────────────────────────────────
  const inputCss = "width:100%;padding:11px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:8px;color:#0f172a;outline:none;font-size:0.9rem;box-sizing:border-box;";
  const labelCss = 'font-size:0.82rem;color:#475569;margin-bottom:6px;display:block;font-weight:600;';
  const btnPrimary = 'background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;padding:11px 22px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);';
  const btnGhost = 'background:rgba(15,23,42,0.05);border:1px solid rgba(15,23,42,0.12);padding:10px 18px;border-radius:10px;color:#0f172a;font-weight:600;cursor:pointer;';
  const card = 'background:#fff;border-radius:16px;border:1px solid rgba(15,23,42,0.08);box-shadow:0 10px 30px -10px rgba(15,23,42,0.08);padding:24px;';

  const modal = (html) => { if (window.showAdminOverlay) window.showAdminOverlay(html); };
  const closeModal = () => { if (window.closeAdminOverlay) window.closeAdminOverlay(); };
  window.__vlCloseModal = closeModal;

  const esc = (s) => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = (ts) => { if(!ts) return '-'; const d = new Date(ts); return d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); };
  const relTime = (ts) => { const s=Math.floor((Date.now()-ts)/1000); if(s<60)return s+'s ago'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; };

  // ═══════════════════════════════════════════════════════════════
  // Inject sidebar items + header extras
  // ═══════════════════════════════════════════════════════════════
  function itemHtml(view, icon, label){
    return `<a href="#" class="admin-sidebar-item" data-view="${view}" onclick="showAdminView('${view}',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="${icon}" style="width:18px;"></i> <span data-i18n="${label}">${t(label)}</span></a>`;
  }

  function injectSidebar(){
    const nav = document.querySelector('#adminSidebar nav');
    if (!nav || nav.dataset.extraInjected) return false;
    nav.dataset.extraInjected = '1';

    const html = `
      <div style="padding:20px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:800;">CONTENT</div>
      ${itemHtml('adminServices','fa-solid fa-briefcase','Services')}
      ${itemHtml('adminTestimonials','fa-solid fa-star','Testimonials')}
      ${itemHtml('adminTeam','fa-solid fa-user-group','Team')}
      ${itemHtml('adminCoupons','fa-solid fa-ticket','Coupons')}
      <div style="padding:20px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:800;">SYSTEM</div>
      ${itemHtml('adminSettings','fa-solid fa-gear','Settings')}
      ${itemHtml('adminActivity','fa-solid fa-clock-rotate-left','Activity Log')}
      ${itemHtml('adminBackup','fa-solid fa-cloud-arrow-down','Backup')}
    `;
    nav.insertAdjacentHTML('beforeend', html);
    injectHeaderExtras();
    applyTheme();
    applyLang();
    startNotifPoll();
    return true;
  }

  function injectHeaderExtras(){
    const header = document.querySelector('#adminSidebar')?.nextElementSibling?.querySelector('header');
    const rightBox = header?.querySelector('.admin-view-site')?.parentElement;
    if (!rightBox || rightBox.dataset.extraDone) return;
    rightBox.dataset.extraDone = '1';

    const extras = document.createElement('div');
    extras.style.cssText = 'display:flex;align-items:center;gap:8px;';
    extras.innerHTML = `
      <button id="vlNotifBtn" title="Notifications" onclick="showAdminView('adminNotifications',document.querySelector('.admin-sidebar-item[data-view=&quot;adminNotifications&quot;]'));return false;" style="position:relative;width:40px;height:40px;border-radius:10px;background:#fff;border:1px solid rgba(15,23,42,0.12);color:#0f172a;cursor:pointer;">
        <i class="fa-solid fa-bell"></i>
        <span id="vlNotifBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:0.65rem;font-weight:800;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:none;align-items:center;justify-content:center;">0</span>
      </button>
      <button id="vlDarkBtn" title="Toggle theme" onclick="window.__vlToggleTheme()" style="width:40px;height:40px;border-radius:10px;background:#fff;border:1px solid rgba(15,23,42,0.12);color:#0f172a;cursor:pointer;">
        <i class="fa-solid fa-moon"></i>
      </button>
      <button id="vlLangBtn" title="Language" onclick="window.__vlToggleLang()" style="height:40px;padding:0 12px;border-radius:10px;background:#fff;border:1px solid rgba(15,23,42,0.12);color:#0f172a;cursor:pointer;font-weight:700;font-size:0.8rem;">EN</button>
    `;
    rightBox.insertBefore(extras, rightBox.firstChild);
  }

  // Poll for sidebar creation (admin dashboard is created on demand)
  const observer = new MutationObserver(() => { injectSidebar(); });
  observer.observe(document.body, { childList: true, subtree: true });
  injectSidebar();

  // ═══════════════════════════════════════════════════════════════
  // Wrap showAdminView to handle new views + titles
  // ═══════════════════════════════════════════════════════════════
  const NEW_VIEWS = {
    adminServices: ['Services','Manage service offerings', renderServices],
    adminSettings: ['Settings','Site-wide configuration', renderSettings],
    adminCoupons:  ['Coupons','Discount codes', renderCoupons],
    adminTestimonials:['Testimonials','Client reviews', renderTestimonials],
    adminTeam:     ['Team','Team members', renderTeam],
    adminActivity: ['Activity Log','Admin actions audit trail', renderActivity],
    adminBackup:   ['Backup & Restore','Export or import all data', renderBackup],
    adminNotifications:['Notifications','Recent alerts', renderNotifications],
  };

  const origShow = window.showAdminView;
  window.showAdminView = async function(view, el){
    if (NEW_VIEWS[view]) {
      try {
        document.querySelectorAll('.admin-sidebar-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');
        const [title, sub, fn] = NEW_VIEWS[view];
        const tt = document.getElementById('adminPageTitle'); if (tt) tt.textContent = t(title);
        const ss = document.getElementById('adminPageSubtitle'); if (ss) ss.textContent = sub;
        const content = document.getElementById('adminContent');
        if (content) await fn(content);
      } catch(e){ console.error('extra view error', e); }
      return;
    }
    return origShow ? origShow(view, el) : null;
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. SERVICES MANAGER
  // ═══════════════════════════════════════════════════════════════
  function defaultServices(){
    return [
      { id:'web',    name:'Web Development',      icon:'fa-globe',   price:99,  desc:'Modern websites with SEO', packages:'Starter $99 · Pro $179' },
      { id:'saas',   name:'SaaS Development',     icon:'fa-cubes',   price:499, desc:'Custom SaaS platforms',    packages:'MVP $499 · Full $1499' },
      { id:'ai',     name:'AI Automation',        icon:'fa-robot',   price:299, desc:'AI agents & integrations', packages:'Basic $299 · Pro $899' },
      { id:'seo',    name:'SEO Services',         icon:'fa-magnifying-glass', price:199, desc:'Dominant SEO',   packages:'Starter $199 · Pro $499' },
      { id:'gads',   name:'Google Ads',           icon:'fa-google',  price:149, desc:'Conversion-focused Ads',   packages:'Manage $149/mo' },
      { id:'fbads',  name:'FB & Instagram Ads',   icon:'fa-facebook',price:149, desc:'Meta Ads mastery',         packages:'Manage $149/mo' },
      { id:'social', name:'Social Media Mgmt',    icon:'fa-hashtag', price:249, desc:'Premium content & growth', packages:'Growth $249/mo' },
      { id:'design', name:'Graphic Design',       icon:'fa-palette', price:79,  desc:'Elite branding',           packages:'Logo $79 · Full $449' },
    ];
  }

  function getServices(){ const s = load('services', null); return s && s.length ? s : defaultServices(); }

  function renderServices(c){
    const list = getServices();
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div><div style="font-weight:800;color:#0f172a;font-size:1.1rem;">${t('Services')}</div><div style="font-size:0.85rem;color:#94a3b8;">${list.length} services</div></div>
        <button onclick="__vlSvcEdit()" style="${btnPrimary}"><i class="fa-solid fa-plus"></i> ${t('Add New')}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        ${list.map(s => `
          <div style="${card}">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="width:44px;height:44px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;"><i class="fa-solid ${esc(s.icon||'fa-briefcase')}"></i></div><div style="flex:1;min-width:0;"><div style="font-weight:800;color:#0f172a;">${esc(s.name)}</div><div style="font-size:0.75rem;color:#94a3b8;">from $${esc(s.price)}</div></div></div>
            <div style="font-size:0.85rem;color:#475569;margin-bottom:6px;">${esc(s.desc)}</div>
            <div style="font-size:0.78rem;color:#64748b;margin-bottom:14px;"><b>Packages:</b> ${esc(s.packages)}</div>
            <div style="display:flex;gap:8px;"><button onclick="__vlSvcEdit('${s.id}')" style="${btnGhost};flex:1;font-size:0.8rem;padding:8px 12px;"><i class="fa-solid fa-pen"></i> ${t('Edit')}</button><button onclick="__vlSvcDel('${s.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:8px 12px;border-radius:10px;font-weight:600;cursor:pointer;font-size:0.8rem;"><i class="fa-solid fa-trash"></i></button></div>
          </div>`).join('')}
      </div>`;
  }
  window.__vlSvcEdit = function(id){
    const list = getServices();
    const s = id ? list.find(x=>x.id===id) : { id:'', name:'', icon:'fa-briefcase', price:99, desc:'', packages:'' };
    if (!s) return;
    modal(`
      <h2 style="margin:0 0 20px;font-size:1.3rem;font-weight:800;">${id?t('Edit'):t('Add New')} ${t('Services')}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div><label style="${labelCss}">${t('Name')}</label><input id="svcName" style="${inputCss}" value="${esc(s.name)}"></div>
        <div><label style="${labelCss}">Icon (Font Awesome)</label><input id="svcIcon" style="${inputCss}" value="${esc(s.icon)}" placeholder="fa-briefcase"></div>
        <div><label style="${labelCss}">${t('Price')} (USD)</label><input id="svcPrice" type="number" style="${inputCss}" value="${esc(s.price)}"></div>
        <div><label style="${labelCss}">Packages</label><input id="svcPkg" style="${inputCss}" value="${esc(s.packages)}"></div>
        <div style="grid-column:1/-1;"><label style="${labelCss}">${t('Description')}</label><textarea id="svcDesc" rows="3" style="${inputCss}">${esc(s.desc)}</textarea></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px;">
        <button onclick="__vlCloseModal()" style="${btnGhost}">${t('Cancel')}</button>
        <button onclick="__vlSvcSave('${id||''}')" style="${btnPrimary}"><i class="fa-solid fa-check"></i> ${t('Save')}</button>
      </div>
    `);
  };
  window.__vlSvcSave = function(id){
    const list = getServices();
    const rec = { id: id || uid(), name: document.getElementById('svcName').value.trim(), icon: document.getElementById('svcIcon').value.trim()||'fa-briefcase', price: +document.getElementById('svcPrice').value||0, desc: document.getElementById('svcDesc').value.trim(), packages: document.getElementById('svcPkg').value.trim() };
    if (!rec.name) return alert('Name required');
    if (id) { const i = list.findIndex(x=>x.id===id); if (i>=0) list[i] = rec; } else list.push(rec);
    save('services', list); logActivity('service.save', rec.name); closeModal(); showAdminView('adminServices', document.querySelector('.admin-sidebar-item[data-view="adminServices"]'));
  };
  window.__vlSvcDel = function(id){
    if (!confirm('Delete this service?')) return;
    save('services', getServices().filter(x=>x.id!==id)); logActivity('service.delete', id);
    showAdminView('adminServices', document.querySelector('.admin-sidebar-item[data-view="adminServices"]'));
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. SETTINGS
  // ═══════════════════════════════════════════════════════════════
  function getSettings(){ return Object.assign({ siteName:'Vextro Lyntra', logoUrl:'', contactEmail:'hello@vextro.com', contactPhone:'', whatsappNumber:'', addressLine:'', facebook:'', instagram:'', twitter:'', linkedin:'', youtube:'', supportHours:'Mon-Fri 9AM-6PM' }, load('settings', {})); }
  function renderSettings(c){
    const s = getSettings();
    const fld = (id,label,val,type='text') => `<div><label style="${labelCss}">${label}</label><input id="${id}" type="${type}" style="${inputCss}" value="${esc(val)}"></div>`;
    c.innerHTML = `
      <div style="${card}">
        <h3 style="margin:0 0 20px;font-weight:800;color:#0f172a;"><i class="fa-solid fa-gear"></i> Site Configuration</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
          ${fld('stSiteName','Site Name',s.siteName)}
          ${fld('stLogo','Logo URL',s.logoUrl)}
          ${fld('stEmail','Contact Email',s.contactEmail,'email')}
          ${fld('stPhone','Contact Phone',s.contactPhone)}
          ${fld('stWA','WhatsApp Number',s.whatsappNumber)}
          ${fld('stHours','Support Hours',s.supportHours)}
          ${fld('stAddr','Address',s.addressLine)}
        </div>
        <h4 style="margin:22px 0 12px;font-weight:800;color:#0f172a;">Social Links</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
          ${fld('stFB','Facebook URL',s.facebook)}
          ${fld('stIG','Instagram URL',s.instagram)}
          ${fld('stTW','Twitter/X URL',s.twitter)}
          ${fld('stLI','LinkedIn URL',s.linkedin)}
          ${fld('stYT','YouTube URL',s.youtube)}
        </div>
        <div style="margin-top:22px;display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="__vlSettingsSave()" style="${btnPrimary}"><i class="fa-solid fa-check"></i> ${t('Save')}</button>
        </div>
      </div>`;
  }
  window.__vlSettingsSave = function(){
    const v = id => document.getElementById(id).value.trim();
    const s = { siteName:v('stSiteName'), logoUrl:v('stLogo'), contactEmail:v('stEmail'), contactPhone:v('stPhone'), whatsappNumber:v('stWA'), supportHours:v('stHours'), addressLine:v('stAddr'), facebook:v('stFB'), instagram:v('stIG'), twitter:v('stTW'), linkedin:v('stLI'), youtube:v('stYT') };
    save('settings', s); logActivity('settings.save',''); alert('Settings saved ✓');
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. COUPONS
  // ═══════════════════════════════════════════════════════════════
  function renderCoupons(c){
    const list = load('coupons', []);
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div><div style="font-weight:800;color:#0f172a;font-size:1.1rem;">${t('Coupons')}</div><div style="font-size:0.85rem;color:#94a3b8;">${list.length} codes</div></div>
        <button onclick="__vlCpnEdit()" style="${btnPrimary}"><i class="fa-solid fa-plus"></i> ${t('Add New')}</button>
      </div>
      <div style="${card};padding:0;">
        ${list.length===0 ? `<div style="padding:60px;text-align:center;color:#94a3b8;"><i class="fa-solid fa-ticket" style="font-size:2rem;"></i><p style="margin-top:10px;">No coupons yet</p></div>` : `
        <table class="admin-table"><thead><tr><th>${t('Code')}</th><th>${t('Discount %')}</th><th>${t('Expiry')}</th><th>Uses</th><th>${t('Active')}</th><th style="text-align:right;">Actions</th></tr></thead><tbody>
          ${list.map(c => `<tr>
            <td><code style="background:#f1f5f9;padding:4px 10px;border-radius:6px;font-weight:800;color:#ff6b35;">${esc(c.code)}</code></td>
            <td><b>${esc(c.discount)}%</b></td>
            <td>${c.expiry ? new Date(c.expiry).toLocaleDateString() : '-'}</td>
            <td>${esc(c.used||0)} / ${c.limit||'∞'}</td>
            <td><span class="admin-badge admin-badge-${c.active?'green':'red'}">${c.active?t('Active'):'OFF'}</span></td>
            <td style="text-align:right;"><button onclick="__vlCpnEdit('${c.id}')" style="${btnGhost};padding:6px 10px;font-size:0.78rem;"><i class="fa-solid fa-pen"></i></button> <button onclick="__vlCpnDel('${c.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.78rem;"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`).join('')}
        </tbody></table>`}
      </div>`;
  }
  window.__vlCpnEdit = function(id){
    const list = load('coupons', []);
    const c = id ? list.find(x=>x.id===id) : { id:'', code:'', discount:10, expiry:'', limit:'', used:0, active:true };
    if (!c) return;
    modal(`
      <h2 style="margin:0 0 20px;font-size:1.3rem;font-weight:800;">${id?t('Edit'):t('Add New')} ${t('Coupons')}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div><label style="${labelCss}">${t('Code')}</label><input id="cpnCode" style="${inputCss};text-transform:uppercase;" value="${esc(c.code)}" placeholder="SAVE20"></div>
        <div><label style="${labelCss}">${t('Discount %')}</label><input id="cpnDisc" type="number" min="1" max="100" style="${inputCss}" value="${esc(c.discount)}"></div>
        <div><label style="${labelCss}">${t('Expiry')} (optional)</label><input id="cpnExp" type="date" style="${inputCss}" value="${c.expiry?new Date(c.expiry).toISOString().slice(0,10):''}"></div>
        <div><label style="${labelCss}">Usage Limit (optional)</label><input id="cpnLim" type="number" style="${inputCss}" value="${esc(c.limit)}" placeholder="unlimited"></div>
        <div style="grid-column:1/-1;"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input id="cpnActive" type="checkbox" ${c.active?'checked':''}> ${t('Active')}</label></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px;">
        <button onclick="__vlCloseModal()" style="${btnGhost}">${t('Cancel')}</button>
        <button onclick="__vlCpnSave('${id||''}')" style="${btnPrimary}"><i class="fa-solid fa-check"></i> ${t('Save')}</button>
      </div>
    `);
  };
  window.__vlCpnSave = function(id){
    const list = load('coupons', []);
    const code = document.getElementById('cpnCode').value.trim().toUpperCase();
    if (!code) return alert('Code required');
    const exp = document.getElementById('cpnExp').value;
    const rec = { id: id||uid(), code, discount:+document.getElementById('cpnDisc').value||0, expiry: exp?new Date(exp).getTime():null, limit:+document.getElementById('cpnLim').value||null, used: id? (list.find(x=>x.id===id)?.used||0) : 0, active: document.getElementById('cpnActive').checked };
    if (id){ const i=list.findIndex(x=>x.id===id); if(i>=0) list[i]=rec; } else list.push(rec);
    save('coupons', list); logActivity('coupon.save', code); closeModal(); showAdminView('adminCoupons', document.querySelector('.admin-sidebar-item[data-view="adminCoupons"]'));
  };
  window.__vlCpnDel = function(id){ if(!confirm('Delete coupon?'))return; save('coupons', load('coupons',[]).filter(x=>x.id!==id)); logActivity('coupon.delete',id); showAdminView('adminCoupons', document.querySelector('.admin-sidebar-item[data-view="adminCoupons"]')); };

  // Public: validate coupon
  window.vextroValidateCoupon = function(code){
    const list = load('coupons', []);
    const c = list.find(x => x.code === String(code||'').toUpperCase().trim() && x.active);
    if (!c) return { ok:false, error:'Invalid code' };
    if (c.expiry && Date.now() > c.expiry) return { ok:false, error:'Expired' };
    if (c.limit && c.used >= c.limit) return { ok:false, error:'Limit reached' };
    return { ok:true, discount:c.discount, id:c.id };
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. TESTIMONIALS
  // ═══════════════════════════════════════════════════════════════
  function renderTestimonials(c){
    const list = load('testimonials', []);
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div><div style="font-weight:800;color:#0f172a;font-size:1.1rem;">${t('Testimonials')}</div><div style="font-size:0.85rem;color:#94a3b8;">${list.length} reviews</div></div>
        <button onclick="__vlTstEdit()" style="${btnPrimary}"><i class="fa-solid fa-plus"></i> ${t('Add New')}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">
        ${list.length===0 ? `<div style="${card};text-align:center;color:#94a3b8;grid-column:1/-1;padding:60px;"><i class="fa-solid fa-star" style="font-size:2rem;"></i><p style="margin-top:10px;">No testimonials yet</p></div>` : list.map(x=>`
          <div style="${card};position:relative;">
            <div style="color:#f59e0b;margin-bottom:10px;">${'★'.repeat(x.rating||5)}${'☆'.repeat(5-(x.rating||5))}</div>
            <p style="color:#334155;font-size:0.9rem;font-style:italic;">"${esc(x.message)}"</p>
            <div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(15,23,42,0.06);">
              <img src="${esc(x.image||'https://ui-avatars.com/api/?name='+encodeURIComponent(x.name||'?'))}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
              <div style="flex:1;"><div style="font-weight:700;color:#0f172a;">${esc(x.name)}</div><div style="font-size:0.75rem;color:#94a3b8;">${esc(x.role)}</div></div>
              <button onclick="__vlTstEdit('${x.id}')" style="${btnGhost};padding:6px 10px;"><i class="fa-solid fa-pen"></i></button>
              <button onclick="__vlTstDel('${x.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:6px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join('')}
      </div>`;
  }
  window.__vlTstEdit = function(id){
    const list = load('testimonials', []);
    const x = id ? list.find(v=>v.id===id) : { id:'', name:'', role:'', message:'', rating:5, image:'' };
    if (!x) return;
    modal(`
      <h2 style="margin:0 0 20px;font-size:1.3rem;font-weight:800;">${id?t('Edit'):t('Add New')} ${t('Testimonials')}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div><label style="${labelCss}">${t('Name')}</label><input id="tstName" style="${inputCss}" value="${esc(x.name)}"></div>
        <div><label style="${labelCss}">${t('Role')} / Company</label><input id="tstRole" style="${inputCss}" value="${esc(x.role)}"></div>
        <div><label style="${labelCss}">${t('Rating')} (1-5)</label><input id="tstRate" type="number" min="1" max="5" style="${inputCss}" value="${esc(x.rating)}"></div>
        <div><label style="${labelCss}">Avatar URL</label><input id="tstImg" style="${inputCss}" value="${esc(x.image)}"></div>
        <div style="grid-column:1/-1;"><label style="${labelCss}">Testimonial Message</label><textarea id="tstMsg" rows="4" style="${inputCss}">${esc(x.message)}</textarea></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px;">
        <button onclick="__vlCloseModal()" style="${btnGhost}">${t('Cancel')}</button>
        <button onclick="__vlTstSave('${id||''}')" style="${btnPrimary}"><i class="fa-solid fa-check"></i> ${t('Save')}</button>
      </div>
    `);
  };
  window.__vlTstSave = function(id){
    const list = load('testimonials', []);
    const rec = { id:id||uid(), name:document.getElementById('tstName').value.trim(), role:document.getElementById('tstRole').value.trim(), rating:Math.max(1,Math.min(5,+document.getElementById('tstRate').value||5)), image:document.getElementById('tstImg').value.trim(), message:document.getElementById('tstMsg').value.trim() };
    if (!rec.name || !rec.message) return alert('Name & message required');
    if (id){ const i=list.findIndex(x=>x.id===id); if(i>=0) list[i]=rec; } else list.push(rec);
    save('testimonials', list); logActivity('testimonial.save', rec.name); closeModal(); showAdminView('adminTestimonials', document.querySelector('.admin-sidebar-item[data-view="adminTestimonials"]'));
  };
  window.__vlTstDel = function(id){ if(!confirm('Delete testimonial?'))return; save('testimonials', load('testimonials',[]).filter(x=>x.id!==id)); logActivity('testimonial.delete',id); showAdminView('adminTestimonials', document.querySelector('.admin-sidebar-item[data-view="adminTestimonials"]')); };

  // ═══════════════════════════════════════════════════════════════
  // 5. TEAM
  // ═══════════════════════════════════════════════════════════════
  function renderTeam(c){
    const list = load('team', []);
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div><div style="font-weight:800;color:#0f172a;font-size:1.1rem;">${t('Team')}</div><div style="font-size:0.85rem;color:#94a3b8;">${list.length} members</div></div>
        <button onclick="__vlTeamEdit()" style="${btnPrimary}"><i class="fa-solid fa-plus"></i> ${t('Add New')}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
        ${list.length===0 ? `<div style="${card};text-align:center;color:#94a3b8;grid-column:1/-1;padding:60px;"><i class="fa-solid fa-user-group" style="font-size:2rem;"></i><p style="margin-top:10px;">No team members yet</p></div>` : list.map(m=>`
          <div style="${card};text-align:center;">
            <img src="${esc(m.image||'https://ui-avatars.com/api/?name='+encodeURIComponent(m.name))}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block;">
            <div style="font-weight:800;color:#0f172a;">${esc(m.name)}</div>
            <div style="font-size:0.8rem;color:#ff6b35;font-weight:600;margin-bottom:8px;">${esc(m.role)}</div>
            <div style="font-size:0.8rem;color:#64748b;min-height:36px;">${esc(m.bio||'')}</div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button onclick="__vlTeamEdit('${m.id}')" style="${btnGhost};flex:1;font-size:0.78rem;padding:6px;"><i class="fa-solid fa-pen"></i></button>
              <button onclick="__vlTeamDel('${m.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:6px;border-radius:8px;cursor:pointer;flex:1;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join('')}
      </div>`;
  }
  window.__vlTeamEdit = function(id){
    const list = load('team', []);
    const m = id ? list.find(v=>v.id===id) : { id:'', name:'', role:'', bio:'', image:'', linkedin:'', twitter:'' };
    if (!m) return;
    modal(`
      <h2 style="margin:0 0 20px;font-size:1.3rem;font-weight:800;">${id?t('Edit'):t('Add New')} ${t('Team')}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div><label style="${labelCss}">${t('Name')}</label><input id="tmName" style="${inputCss}" value="${esc(m.name)}"></div>
        <div><label style="${labelCss}">${t('Role')}</label><input id="tmRole" style="${inputCss}" value="${esc(m.role)}"></div>
        <div><label style="${labelCss}">Photo URL</label><input id="tmImg" style="${inputCss}" value="${esc(m.image)}"></div>
        <div><label style="${labelCss}">LinkedIn URL</label><input id="tmLI" style="${inputCss}" value="${esc(m.linkedin)}"></div>
        <div style="grid-column:1/-1;"><label style="${labelCss}">Bio</label><textarea id="tmBio" rows="3" style="${inputCss}">${esc(m.bio)}</textarea></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px;">
        <button onclick="__vlCloseModal()" style="${btnGhost}">${t('Cancel')}</button>
        <button onclick="__vlTeamSave('${id||''}')" style="${btnPrimary}"><i class="fa-solid fa-check"></i> ${t('Save')}</button>
      </div>
    `);
  };
  window.__vlTeamSave = function(id){
    const list = load('team', []);
    const rec = { id:id||uid(), name:document.getElementById('tmName').value.trim(), role:document.getElementById('tmRole').value.trim(), image:document.getElementById('tmImg').value.trim(), linkedin:document.getElementById('tmLI').value.trim(), bio:document.getElementById('tmBio').value.trim() };
    if (!rec.name) return alert('Name required');
    if (id){ const i=list.findIndex(x=>x.id===id); if(i>=0) list[i]=rec; } else list.push(rec);
    save('team', list); logActivity('team.save', rec.name); closeModal(); showAdminView('adminTeam', document.querySelector('.admin-sidebar-item[data-view="adminTeam"]'));
  };
  window.__vlTeamDel = function(id){ if(!confirm('Delete team member?'))return; save('team', load('team',[]).filter(x=>x.id!==id)); logActivity('team.delete',id); showAdminView('adminTeam', document.querySelector('.admin-sidebar-item[data-view="adminTeam"]')); };

  // ═══════════════════════════════════════════════════════════════
  // 6. NOTIFICATIONS CENTER
  // ═══════════════════════════════════════════════════════════════
  function computeNotifications(){
    // Combine unread orders, messages, new signups (last 7d)
    const notifs = [];
    try {
      const orders = load('admin_orders_cache', null) || JSON.parse(localStorage.getItem('admin_orders')||'[]');
      (orders||[]).slice(0,10).forEach(o => notifs.push({ type:'order', icon:'fa-receipt', color:'#ff6b35', title:'New order: '+(o.service||'Service'), sub:(o.buyerName||'-')+' · $'+(o.amount||0), ts:o.createdAt||Date.now(), id:'ord_'+o.id }));
    } catch(e){}
    try {
      const contacts = JSON.parse(localStorage.getItem('vl_contacts')||'[]');
      contacts.filter(c=>!c.read).slice(0,10).forEach(c => notifs.push({ type:'message', icon:'fa-envelope', color:'#ec4899', title:'Message from '+(c.name||'-'), sub:(c.subject||c.message||'').slice(0,60), ts:c.createdAt||Date.now(), id:'msg_'+c.id }));
    } catch(e){}
    notifs.sort((a,b)=>b.ts-a.ts);
    return notifs.slice(0,50);
  }
  function updateBadge(){
    const n = computeNotifications();
    const seen = +(localStorage.getItem('vl_notif_seen_ts')||0);
    const unread = n.filter(x=>x.ts>seen).length;
    const b = document.getElementById('vlNotifBadge');
    if (b){ if (unread>0){ b.textContent = unread>99?'99+':unread; b.style.display='flex'; } else b.style.display='none'; }
  }
  function startNotifPoll(){ updateBadge(); if (window.__vlNotifInt) clearInterval(window.__vlNotifInt); window.__vlNotifInt = setInterval(updateBadge, 30000); }
  function renderNotifications(c){
    localStorage.setItem('vl_notif_seen_ts', String(Date.now()));
    updateBadge();
    const list = computeNotifications();
    c.innerHTML = `
      <div style="${card};padding:0;">
        ${list.length===0 ? `<div style="padding:60px;text-align:center;color:#94a3b8;"><i class="fa-solid fa-bell-slash" style="font-size:2rem;"></i><p style="margin-top:10px;">No notifications</p></div>` : list.map(n=>`
          <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(15,23,42,0.05);">
            <div style="width:40px;height:40px;background:${n.color}20;color:${n.color};border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${n.icon}"></i></div>
            <div style="flex:1;min-width:0;"><div style="font-weight:700;color:#0f172a;">${esc(n.title)}</div><div style="font-size:0.8rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;">${esc(n.sub)}</div></div>
            <div style="font-size:0.75rem;color:#94a3b8;white-space:nowrap;">${relTime(n.ts)}</div>
          </div>`).join('')}
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. BACKUP & RESTORE
  // ═══════════════════════════════════════════════════════════════
  function renderBackup(c){
    const keys = Object.keys(localStorage).filter(k=>k.startsWith('vextro_')||k.startsWith('vl_')||k==='admin_orders'||k.startsWith('user_stats_'));
    const totalSize = keys.reduce((s,k)=>s+(localStorage.getItem(k)||'').length, 0);
    c.innerHTML = `
      <div style="${card}">
        <h3 style="margin:0 0 16px;font-weight:800;color:#0f172a;"><i class="fa-solid fa-cloud-arrow-down"></i> ${t('Backup')} & Restore</h3>
        <p style="color:#64748b;margin:0 0 20px;">Export or restore all your admin data (services, users, orders, blogs, settings, etc.) as a JSON file.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px;">
          <div style="background:#f8fafc;padding:16px;border-radius:12px;"><div style="font-size:0.75rem;color:#94a3b8;font-weight:700;">STORED KEYS</div><div style="font-size:1.4rem;font-weight:800;color:#0f172a;">${keys.length}</div></div>
          <div style="background:#f8fafc;padding:16px;border-radius:12px;"><div style="font-size:0.75rem;color:#94a3b8;font-weight:700;">DATA SIZE</div><div style="font-size:1.4rem;font-weight:800;color:#0f172a;">${(totalSize/1024).toFixed(1)} KB</div></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="__vlBackupExport()" style="${btnPrimary}"><i class="fa-solid fa-download"></i> ${t('Export')} JSON</button>
          <label style="${btnGhost};display:inline-flex;align-items:center;gap:8px;cursor:pointer;"><i class="fa-solid fa-upload"></i> ${t('Import')} JSON<input type="file" accept="application/json" onchange="__vlBackupImport(this)" style="display:none;"></label>
          <button onclick="__vlBackupClear()" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:11px 22px;border-radius:10px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-triangle-exclamation"></i> Clear All Data</button>
        </div>
        <div style="background:#fef3c7;color:#92400e;padding:14px;border-radius:10px;margin-top:20px;font-size:0.85rem;"><b>⚠ Warning:</b> Importing overwrites existing data. Export a backup first.</div>
      </div>`;
  }
  window.__vlBackupExport = function(){
    const data = {};
    Object.keys(localStorage).filter(k => k.startsWith('vextro_')||k.startsWith('vl_')||k==='admin_orders'||k.startsWith('user_stats_')).forEach(k => { data[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), data }, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vextro-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url);
    logActivity('backup.export','');
  };
  window.__vlBackupImport = function(input){
    const f = input.files[0]; if (!f) return;
    if (!confirm('Import will OVERWRITE current admin data. Continue?')) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        const data = obj.data || obj;
        Object.keys(data).forEach(k => { if (k.startsWith('vextro_')||k.startsWith('vl_')||k==='admin_orders'||k.startsWith('user_stats_')) localStorage.setItem(k, data[k]); });
        logActivity('backup.import', f.name);
        alert('Import complete ✓ Reloading...'); location.reload();
      } catch(e){ alert('Invalid backup file: '+e.message); }
    };
    r.readAsText(f);
  };
  window.__vlBackupClear = function(){
    if (!confirm('DELETE ALL admin data? This cannot be undone.')) return;
    if (!confirm('Really? Type-safe way: export first!')) return;
    Object.keys(localStorage).filter(k => k.startsWith('vextro_')||k.startsWith('vl_')||k==='admin_orders'||k.startsWith('user_stats_')).forEach(k => localStorage.removeItem(k));
    alert('Cleared. Reloading...'); location.reload();
  };

  // ═══════════════════════════════════════════════════════════════
  // 8. ACTIVITY LOG
  // ═══════════════════════════════════════════════════════════════
  function renderActivity(c){
    const log = load('activity_log', []);
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div><div style="font-weight:800;color:#0f172a;font-size:1.1rem;">${t('Activity Log')}</div><div style="font-size:0.85rem;color:#94a3b8;">${log.length} recorded actions</div></div>
        <button onclick="if(confirm('Clear log?')){localStorage.removeItem('vextro_activity_log');showAdminView('adminActivity',document.querySelector('.admin-sidebar-item[data-view=&quot;adminActivity&quot;]'));}" style="${btnGhost}"><i class="fa-solid fa-broom"></i> Clear Log</button>
      </div>
      <div style="${card};padding:0;max-height:600px;overflow-y:auto;">
        ${log.length===0 ? `<div style="padding:60px;text-align:center;color:#94a3b8;"><i class="fa-solid fa-clock-rotate-left" style="font-size:2rem;"></i><p style="margin-top:10px;">No activity yet</p></div>` : log.map(e=>`
          <div style="display:flex;gap:14px;padding:12px 20px;border-bottom:1px solid rgba(15,23,42,0.05);align-items:center;">
            <div style="width:36px;height:36px;background:rgba(59,130,246,0.1);color:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-${e.action.startsWith('delete')?'trash':e.action.includes('save')?'pen':'circle-info'}"></i></div>
            <div style="flex:1;min-width:0;"><div style="font-weight:600;color:#0f172a;font-size:0.9rem;"><code style="background:#f1f5f9;padding:2px 8px;border-radius:5px;color:#ff6b35;font-size:0.78rem;">${esc(e.action)}</code> ${esc(e.detail)}</div><div style="font-size:0.75rem;color:#94a3b8;">${esc(e.user)}</div></div>
            <div style="font-size:0.75rem;color:#94a3b8;white-space:nowrap;">${fmtDate(e.ts)}</div>
          </div>`).join('')}
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. DARK MODE
  // ═══════════════════════════════════════════════════════════════
  function applyTheme(){
    const dark = localStorage.getItem('vl_theme') === 'dark';
    let s = document.getElementById('vlDarkStyle');
    if (!s){ s = document.createElement('style'); s.id='vlDarkStyle'; document.head.appendChild(s); }
    if (dark) {
      s.textContent = `
        #adminSidebar { background:#0f172a !important; border-color:rgba(255,255,255,0.08) !important; }
        #adminSidebar div, #adminSidebar span, #adminSidebar a { color:#cbd5e1 !important; }
        #adminSidebar .admin-sidebar-item:hover { background:rgba(255,255,255,0.06) !important; color:#fff !important; }
        #adminSidebar .admin-sidebar-item.active { background:linear-gradient(90deg,rgba(255,107,53,0.25),transparent) !important; color:#ff6b35 !important; }
        #adminSidebar nav > div { color:#64748b !important; }
        .admin-header { background:rgba(15,23,42,0.85) !important; border-color:rgba(255,255,255,0.08) !important; }
        .admin-header h2, .admin-header p { color:#f1f5f9 !important; }
        .admin-header p { color:#94a3b8 !important; }
        #adminContent { background:#020617 !important; }
        #adminContent { color:#e2e8f0; }
        #adminContent .admin-panel-card, #adminContent [style*="background:#fff"], #adminContent [style*="background:#ffffff"] { background:#0f172a !important; border-color:rgba(255,255,255,0.08) !important; color:#e2e8f0 !important; }
        #adminContent [style*="color:#0f172a"] { color:#f1f5f9 !important; }
        #adminContent [style*="color:#334155"], #adminContent [style*="color:#475569"], #adminContent [style*="color:#64748b"] { color:#94a3b8 !important; }
        #adminContent [style*="background:#f8fafc"] { background:#1e293b !important; }
        #adminContent table th { background:#1e293b !important; color:#94a3b8 !important; }
        #adminContent table td { color:#cbd5e1 !important; border-color:rgba(255,255,255,0.06) !important; }
        #adminContent input, #adminContent textarea, #adminContent select { background:#1e293b !important; color:#e2e8f0 !important; border-color:rgba(255,255,255,0.1) !important; }
        #vlDarkBtn i.fa-moon:before { content:"\\f185"; }
      `;
      const b = document.getElementById('vlDarkBtn'); if (b) b.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      s.textContent = '';
      const b = document.getElementById('vlDarkBtn'); if (b) b.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  }
  window.__vlToggleTheme = function(){
    const cur = localStorage.getItem('vl_theme');
    localStorage.setItem('vl_theme', cur==='dark' ? 'light' : 'dark');
    applyTheme(); logActivity('theme.toggle', localStorage.getItem('vl_theme'));
  };

  // ═══════════════════════════════════════════════════════════════
  // 10. MULTI-LANGUAGE (admin panel labels)
  // ═══════════════════════════════════════════════════════════════
  function applyLang(){
    const lang = window.__vlLang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    const b = document.getElementById('vlLangBtn'); if (b) b.textContent = lang.toUpperCase();
  }
  window.__vlToggleLang = function(){
    window.__vlLang = window.__vlLang === 'en' ? 'ur' : 'en';
    localStorage.setItem('vl_lang', window.__vlLang);
    applyLang();
    // Re-render current view for updated titles/labels
    const active = document.querySelector('.admin-sidebar-item.active');
    if (active) showAdminView(active.dataset.view, active);
    logActivity('lang.switch', window.__vlLang);
  };

})();
