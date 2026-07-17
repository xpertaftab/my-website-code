// Vextro Lyntra - Admin Panel Module
// Loads when admin email logs in

const ADMIN_EMAIL = 'vextrolyntra@gmail.com';
const ADMIN_PASSWORD = 'aftab2525';

// Compress uploaded images so they fit inside localStorage (~5MB quota).
// Downscales to max 1600px on the longest side and re-encodes as JPEG 0.85.
window.adminCompressImage = function(file, maxSide, quality) {
  maxSide = maxSide || 1600;
  quality = quality || 0.85;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxSide || h > maxSide) {
          if (w >= h) { h = Math.round(h * (maxSide / w)); w = maxSide; }
          else { w = Math.round(w * (maxSide / h)); h = maxSide; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', quality)); }
        catch(e) { reject(e); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

// Safe save: warns if localStorage quota is exceeded so a blog never silently vanishes.
window.adminSafeSave = function(key, data) {
  try {
    localStorage.setItem('vextro_' + key, JSON.stringify(data));
    if (window.fsSaveMap) window.fsSaveMap(key, data);
    return true;
  } catch(e) {
    console.error('adminSafeSave failed for', key, e);
    alert('Save failed: browser storage is full. Please use smaller images or remove old items, then try again.');
    return false;
  }
};


// Admin signup - skip email verification, go straight to phone setup
const origHandleAuthSubmit = window.handleAuthSubmit;
window.handleAuthSubmit = async function (event) {
  // Check if this is an admin login attempt
  const loginEmail = document.getElementById('loginEmail')?.value?.trim();
  const isAdminLogin = loginEmail === ADMIN_EMAIL;

  if (isAdminLogin && activeAuthTab === 'login') {
    // For admin login, bypass original handler to avoid showPage('home') race condition
    event.preventDefault();
    const password = document.getElementById('loginPassword')?.value;
    if (!password) return;
    const submitBtn = document.getElementById('loginSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.7'; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; }
    showAuthAlert('', 'hide');
    try {
      await window.auth.signInWithEmailAndPassword(loginEmail, password);
      showAuthAlert("Successfully signed in!", "success");
      // Admin dashboard will show via updateAuthUI after onAuthStateChanged fires
    } catch (error) {
      let errorMsg = error.message;
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') errorMsg = "Incorrect email or password.";
      else if (error.code === 'auth/invalid-email') errorMsg = "Please enter a valid email.";
      showAuthAlert(errorMsg, "danger");
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; submitBtn.innerHTML = '<span>LOG IN</span>'; }
    }
    return;
  }

  // For non-admin users or signup, use original handler
  if (origHandleAuthSubmit) await origHandleAuthSubmit(event);

  // If admin signed up, skip verification and go to phone setup
  const user = window.auth?.currentUser;
  if (user && user.email === ADMIN_EMAIL) {
    setTimeout(() => {
      const verifyForm = document.getElementById('authVerifyEmailContainer');
      const phoneForm = document.getElementById('authPhoneSetupContainer');
      if (verifyForm && verifyForm.style.display === 'block') {
        if (typeof switchAuthTab === 'function') {
          switchAuthTab('phoneSetup');
        }
      }
    }, 500);
  }
};

const origShowPage = window.showPage;
const origUpdateAuthUI = window.updateAuthUI;

// =============================================
// COMPLETELY SEPARATE ADMIN DASHBOARD LAYOUT
// =============================================

let adminDashboardCreated = false;

function createAdminDashboard() {
  if (adminDashboardCreated) return;

  // Hide footer when admin dashboard is active
  const footer = document.querySelector('.real-footer');
  if (footer) footer.style.display = 'none';

  // Remove old admin dashboard if exists
  const old = document.getElementById('adminFullDashboard');
  if (old) old.remove();

  const mainContainer = document.querySelector('.main-container') || document.body;
  
  const adminHTML = `
  <div id="adminFullDashboard" style="display:flex;min-height:100vh;background:#f8fafc;font-family:'Inter',sans-serif;color:#0f172a;">
    <!-- Admin Sidebar -->
    <aside id="adminSidebar" style="width:260px;background:#ffffff;border-right:1px solid rgba(15,23,42,0.08);display:flex;flex-direction:column;flex-shrink:0;">
      <div style="padding:24px 20px;border-bottom:1px solid rgba(15,23,42,0.08);">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#ff6b35,#f7931e);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.2rem;box-shadow:0 4px 10px rgba(255,107,53,0.3);">V</div>
          <div><div style="color:#0f172a;font-weight:700;font-size:1rem;letter-spacing:0.5px;">Admin Panel</div><div style="color:#94a3b8;font-size:0.75rem;">vextrolyntra@gmail.com</div></div>
        </div>
      </div>
      <nav style="flex:1;padding:16px 10px;display:flex;flex-direction:column;gap:4px;">
        <div style="padding:8px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:800;">DASHBOARD</div>
        <a href="#" class="admin-sidebar-item active" data-view="adminStats" onclick="showAdminView('adminStats',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-chart-simple" style="width:18px;"></i> Analytics</a>
        
        <div style="padding:20px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:800;">MANAGEMENT</div>
        <a href="#" class="admin-sidebar-item" data-view="products" onclick="showAdminView('products',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-box" style="width:18px;"></i> Products</a>
        <a href="#" class="admin-sidebar-item" data-view="adminListings" onclick="showAdminView('adminListings',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-store" style="width:18px;"></i> Listings</a>
        <a href="#" class="admin-sidebar-item" data-view="adminBlogs" onclick="showAdminView('adminBlogs',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-newspaper" style="width:18px;"></i> Blogs</a>
        <a href="#" class="admin-sidebar-item" data-view="adminOrders" onclick="showAdminView('adminOrders',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-receipt" style="width:18px;"></i> Orders</a>
        
        <div style="padding:20px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:800;">PEOPLE</div>
        <a href="#" class="admin-sidebar-item" data-view="adminUsers" onclick="showAdminView('adminUsers',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-users" style="width:18px;"></i> Users</a>
        <a href="#" class="admin-sidebar-item" data-view="adminContacts" onclick="showAdminView('adminContacts',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-envelope" style="width:18px;"></i> Messages</a>
      </nav>
      <div style="padding:20px;border-top:1px solid rgba(15,23,42,0.08);">
        <a href="#" onclick="adminLogout();return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#ef4444;text-decoration:none;font-size:0.88rem;font-weight:600;transition:all 0.2s;background:rgba(239,68,68,0.05);"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
      </div>
    </aside>

    <!-- Admin Main Content -->
    <main style="flex:1;background:radial-gradient(circle at top right, rgba(255,107,53,0.08), transparent 50%), #f8fafc;display:flex;flex-direction:column;overflow:hidden;">
      <header style="background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);padding:20px 40px;border-bottom:1px solid rgba(15,23,42,0.08);display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:10;" class="admin-header">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1;">
          <button id="adminSidebarToggle" onclick="toggleAdminSidebar();return false;" aria-label="Menu" style="display:none;width:40px;height:40px;flex-shrink:0;border-radius:10px;background:#ffffff;border:1px solid rgba(15,23,42,0.12);color:#0f172a;cursor:pointer;font-size:1rem;align-items:center;justify-content:center;"><i class="fa-solid fa-bars"></i></button>
          <div style="min-width:0;">
            <h2 id="adminPageTitle" style="font-size:1.5rem;font-weight:800;color:#0f172a;margin:0;letter-spacing:0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Products</h2>
            <p id="adminPageSubtitle" style="font-size:0.85rem;color:#94a3b8;margin:4px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Manage your products</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
          <a href="/" onclick="adminGoToSite();return false;" class="admin-view-site" style="padding:10px 20px;background:rgba(15,23,42,0.08);border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;text-decoration:none;font-size:0.88rem;font-weight:600;transition:all 0.3s;white-space:nowrap;"><i class="fa-solid fa-globe"></i> <span class="admin-view-site-label">View Site</span></a>
        </div>
      </header>
      <div id="adminSidebarBackdrop" onclick="toggleAdminSidebar(false);return false;" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:998;"></div>

      <div id="adminContent" style="flex:1;overflow-y:auto;padding:40px;display:flex;flex-direction:column;gap:30px;" class="custom-admin-scrollbar"></div>
    </main>
  </div>
  `;

  const temp = document.createElement('div');
  temp.innerHTML = adminHTML;
  const adminEl = temp.firstElementChild;
  // Insert at the very beginning of body, before everything else
  if (mainContainer === document.body) {
    mainContainer.insertBefore(adminEl, mainContainer.firstChild);
  } else {
    mainContainer.appendChild(adminEl);
  }

  // Add hover/active styles for sidebar
  const style = document.createElement('style');
  style.id = 'adminFullStyle';
  style.textContent = `
    .admin-sidebar-item:hover { background: rgba(15,23,42,0.08); color: #0f172a !important; }
    .admin-sidebar-item.active { background: linear-gradient(90deg, rgba(255,107,53,0.15) 0%, transparent 100%); color: #ff6b35 !important; border-left: 3px solid #ff6b35; padding-left: 9px !important; }
    
    .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.9rem; }
    .admin-table th { text-align: left; padding: 16px 20px; background: #f8fafc; color: #94a3b8; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(15,23,42,0.08); }
    .admin-table td { padding: 16px 20px; border-bottom: 1px solid rgba(15,23,42,0.05); color: #334155; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: rgba(15,23,42,0.03); color: #0f172a; }
    
    .admin-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px; }
    .admin-badge-green { background: rgba(255,107,53,0.1); color: #ff6b35; border: 1px solid rgba(255,107,53,0.2); }
    .admin-badge-red { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
    .admin-badge-yellow { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .admin-badge-blue { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
    
    .admin-panel-card { background: #ffffff; border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 10px 30px -10px rgba(15,23,42,0.08); overflow: hidden; }
    
    .admin-empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
    .admin-empty i { font-size: 3rem; margin-bottom: 20px; color: #cbd5e1; opacity: 0.5; }
    
    .admin-stat-card { padding: 24px; border-radius: 16px; color: white; border: 1px solid rgba(15,23,42,0.12); box-shadow: 0 10px 20px -5px rgba(15,23,42,0.08); transition: transform 0.3s ease; }
    .admin-stat-card:hover { transform: translateY(-3px); }
    
    /* Custom Scrollbar */
    .custom-admin-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-admin-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-admin-scrollbar::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.12); border-radius: 4px; }
    .custom-admin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(15,23,42,0.25); }
    
    /* Inputs inside admin */
    .admin-table select { background: rgba(248,250,252,0.8); color: #334155; border: 1px solid rgba(15,23,42,0.12); outline: none; }
    .admin-table select:focus { border-color: #ff6b35; }

    /* Mobile responsive */
    @media (max-width: 900px) {
      #adminSidebarToggle { display: inline-flex !important; }
      #adminSidebar {
        position: fixed !important; top: 0; left: 0; bottom: 0;
        width: 82% !important; max-width: 300px; z-index: 999;
        transform: translateX(-100%);
        transition: transform 0.28s ease;
        box-shadow: 0 20px 40px rgba(15,23,42,0.15);
      }
      #adminSidebar.open { transform: translateX(0); }
      #adminSidebarBackdrop.open { display: block !important; }
      .admin-header { padding: 12px 14px !important; position: sticky; top: 0; }
      #adminPageTitle { font-size: 1.05rem !important; }
      #adminPageSubtitle { font-size: 0.72rem !important; }
      #adminContent { padding: 16px 14px 90px !important; gap: 18px !important; }
      .admin-view-site { padding: 9px 12px !important; }
      .admin-view-site-label { display: none; }
      .admin-panel-card { border-radius: 14px !important; }
      .admin-sidebar-item { padding: 14px !important; font-size: 0.95rem !important; }
      /* Grid stat cards to 1-col */
      #adminContent > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 640px) {
      /* Card-style stacked rows */
      .admin-table, .admin-table thead, .admin-table tbody, .admin-table tr, .admin-table td { display: block; width: 100%; box-sizing: border-box; }
      .admin-table thead { display: none; }
      .admin-table tr {
        background: #ffffff;
        border: 1px solid rgba(15,23,42,0.08);
        border-radius: 14px;
        padding: 14px;
        margin: 12px;
        box-shadow: 0 2px 6px rgba(15,23,42,0.04);
      }
      .admin-table td {
        padding: 8px 0 !important;
        border: none !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: #334155 !important;
        font-size: 0.88rem !important;
      }
      .admin-table td:first-child { padding-bottom: 12px !important; margin-bottom: 4px; border-bottom: 1px dashed rgba(15,23,42,0.08) !important; }
      .admin-table td[style*="text-align:right"] { justify-content: flex-end; padding-top: 12px !important; margin-top: 4px; border-top: 1px dashed rgba(15,23,42,0.08) !important; }
      .admin-table td button { min-height: 40px; padding: 9px 14px !important; font-size: 0.82rem !important; }
      .admin-panel-card { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
      .admin-panel-card > div[style*="padding"] { padding: 0 !important; }
      /* Bottom sheet modal */
      #adminModalOverlay { align-items: flex-end !important; padding: 0 !important; }
      #adminModalOverlay > div {
        border-radius: 20px 20px 0 0 !important;
        padding: 20px 18px 30px !important;
        max-height: 92vh !important;
        animation: adminSheetUp 0.28s ease;
      }
      #adminModalOverlay > div h3 { font-size: 1.15rem !important; }
      #adminModalOverlay input, #adminModalOverlay select, #adminModalOverlay textarea { font-size: 16px !important; padding: 12px 14px !important; }
      #adminModalOverlay button { min-height: 44px; }
    }
    @keyframes adminSheetUp { from { transform: translateY(30px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
  `;
  document.head.appendChild(style);

  // Sidebar toggle for mobile
  window.toggleAdminSidebar = function(force) {
    const sb = document.getElementById('adminSidebar');
    const bd = document.getElementById('adminSidebarBackdrop');
    if (!sb || !bd) return;
    const shouldOpen = (typeof force === 'boolean') ? force : !sb.classList.contains('open');
    sb.classList.toggle('open', shouldOpen);
    bd.classList.toggle('open', shouldOpen);
  };
  // Close sidebar on nav item click (mobile)
  document.querySelectorAll('#adminSidebar .admin-sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth <= 900) window.toggleAdminSidebar(false);
    });
  });

  adminDashboardCreated = true;
}

function removeAdminDashboard() {
  const adm = document.getElementById('adminFullDashboard');
  if (adm) adm.remove();
  adminDashboardCreated = false;
  const userDash = document.getElementById('dashboardPage');
  if (userDash) userDash.style.display = '';
  // Show footer again
  const footer = document.querySelector('.real-footer');
  if (footer) footer.style.display = '';
}

window.adminLogout = function() {
  if (window.auth) {
    window.auth.signOut();
    sessionStorage.setItem('admin_skip_redirect', '1');
    location.reload();
  }
};

window.adminGoToSite = function() {
  removeAdminDashboard();
  sessionStorage.setItem('admin_skip_redirect', '1');
  location.reload();
};

// Override show page to use separate admin dashboard
window.showPage = function (page, subview) {
  if (page === 'dashboard' && window.auth?.currentUser?.email === ADMIN_EMAIL) {
    // Hide ALL pages first (same as original showPage does)
    const pages = ['homePage','blogsPage','shopPage','marketplacePage','guidePage','aboutPage',
      'privacyPage','termsPage','refundPage','contactPage','faqPage','emailSupportPage',
      'authPage','dashboardPage','createBlogPage','productDetailPage','mpDetailPage','blogDetailPage',
      'servicesMainPage','servicesPage'];
    pages.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    // Show admin panel (user dashboard completely hidden)
    createAdminDashboard();
    showAdminView('adminStats', document.querySelector('.admin-sidebar-item.active'));
    return;
  }
  // For all non-dashboard pages, use original showPage
  if (origShowPage) origShowPage(page, subview);
};

// Admin view router for new layout
window.showAdminView = async function(view, el) {
  try {
    document.querySelectorAll('.admin-sidebar-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');

    const titles = {
      products: ['Products', 'Manage your products'],
      adminListings: ['Marketplace Listings', 'Manage listings'],
      adminBlogs: ['All Blogs', 'Manage blog posts'],
      adminOrders: ['Orders', 'View all orders'],
      adminUsers: ['Users', 'Registered users'],
      adminContacts: ['Messages', 'Contact form submissions'],
      adminStats: ['Analytics', 'Site statistics']
    };
    const t = titles[view] || ['Dashboard', ''];
    const titleEl = document.getElementById('adminPageTitle');
    const subEl = document.getElementById('adminPageSubtitle');
    if (titleEl) titleEl.textContent = t[0];
    if (subEl) subEl.textContent = t[1];

    const content = document.getElementById('adminContent');
    if (!content) return;

    if (view === 'products') await renderAdminProductsNew(content);
    else if (view === 'adminListings') await renderAdminListingsNew(content);
    else if (view === 'adminBlogs') await renderAdminAllBlogsNew(content);
    else if (view === 'adminOrders') await renderAdminOrdersNew(content);
    else if (view === 'adminUsers') await renderAdminUsersNew(content);
    else if (view === 'adminContacts') await renderAdminContactsNew(content);
    else if (view === 'adminStats') await renderAdminStatsNew(content);
  } catch(e) { console.error('showAdminView error:', e); }
};

// NEW RENDER FUNCTIONS for the separate layout
// NEW RENDER FUNCTIONS for the separate layout

// ── HELPER: show modal overlay ──────────────────────────────────
function adminModal(html, onMounted) {
  const ov = document.createElement('div');
  ov.id = 'adminModalOverlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.innerHTML = `<div style="background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:16px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:0 24px 60px rgba(15,23,42,0.18);color:#0f172a;font-family:'Inter',sans-serif;">${html}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  if (onMounted) onMounted(ov);
  return ov;
}

function adminInputStyle() {
  return "width:100%;padding:11px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:8px;color:#0f172a;outline:none;font-size:0.9rem;box-sizing:border-box;font-family:'Inter',sans-serif;";
}
function adminLabelStyle() {
  return 'font-size:0.82rem;color:#475569;margin-bottom:6px;display:block;font-weight:600;';
}

// ── PRODUCTS ───────────────────────────────────────────────────
async function renderAdminProductsNew(container) {
  container.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading...</p></div>';
  try {
    try {
      const r = await fetch('/api/products');
      if (r.ok) { const d = await r.json(); if (d && d.length > 0) { window.PRODUCTS_DATA = window.PRODUCTS_DATA || {}; d.forEach(p => { window.PRODUCTS_DATA[p.id] = Object.assign(window.PRODUCTS_DATA[p.id] || {}, p); }); } }
    } catch(e) {}
    const products = Object.values(window.PRODUCTS_DATA || {});
    console.log('Rendering admin products, count:', products.length);
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div><div style="color:#0f172a;font-weight:800;font-size:1.1rem;">All Products</div><div style="color:#94a3b8;font-size:0.85rem;">${products.length} product${products.length!==1?'s':''} total</div></div>
        <button onclick="adminAddProductNew()" style="background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;padding:12px 22px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);"><i class="fa-solid fa-plus"></i> Add Product</button>
      </div>
      <div class="admin-panel-card">
        ${products.length === 0 ? `<div class="admin-empty"><i class="fa-solid fa-box"></i><p style="font-weight:600;">No products yet</p><button onclick="adminAddProductNew()" style="margin-top:16px;padding:10px 22px;background:#ff6b35;border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;">+ Add First Product</button></div>` : `
        <table class="admin-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sold</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>${products.map(p=>`
            <tr>
              <td><div style="display:flex;align-items:center;gap:12px;">
                <img src="${p.image||'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=60&q=80'}" style="width:42px;height:42px;border-radius:8px;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=60&q=80'">
                <div><div style="font-weight:700;color:#0f172a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.title||'Untitled'}</div><div style="font-size:0.72rem;color:#94a3b8;">ID: #${p.id}</div></div>
              </div></td>
              <td><span class="admin-badge admin-badge-blue">${p.category||'N/A'}</span></td>
              <td><span style="font-weight:700;color:#ff6b35;">$${p.price||0}</span></td>
              <td><span style="color:#64748b;">${p.sold||0}</span></td>
              <td style="text-align:right;">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button onclick="adminEditProductNew('${p.id}')" style="background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);padding:7px 13px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                  <button onclick="adminDeleteProductNew('${p.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:7px 13px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>`}
      </div>`;
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error: ${e.message}</p></div>`;
  }
}

window.adminDeleteProductNew = async function(id) {
  if (!confirm('Delete this product permanently from the website?')) return;
  if (window.PRODUCTS_DATA && window.PRODUCTS_DATA[id]) delete window.PRODUCTS_DATA[id];
  if (window.vextroSave) window.vextroSave('products', window.PRODUCTS_DATA);
  window._adminChangesMade = true;
  try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e) { console.error('Delete render error:', e); }
  if (window.filterShopProducts) window.filterShopProducts();
};

window.adminEditProductNew = function(id) {
  const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[id] : null;
  if (!p) return alert('Product not found');
  const IS = adminInputStyle(), LS = adminLabelStyle();
  adminModal(`
    <h3 style="margin:0 0 20px;font-size:1.3rem;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;color:#0f172a;">Edit Product</h3>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label style="${LS}">Title</label><input id="epTitle" value="${(p.title||'').replace(/"/g,'&quot;')}" style="${IS}"></div>
      <div style="display:flex;gap:14px;">
        <div style="flex:1;"><label style="${LS}">Price (USD)</label><input id="epPrice" type="number" value="${p.price||0}" style="${IS}"></div>
        <div style="flex:1;"><label style="${LS}">Old Price</label><input id="epOldPrice" type="number" value="${p.oldPrice||0}" style="${IS}"></div>
      </div>
      <div style="display:flex;gap:14px;">
        <div style="flex:1;"><label style="${LS}">Category</label><select id="epCat" style="${IS}"><option ${p.category==='Code Scripts'?'selected':''}>Code Scripts</option><option ${p.category==='UI Templates'?'selected':''}>UI Templates</option><option ${p.category==='Graphics'?'selected':''}>Graphics</option><option ${p.category==='Tools'?'selected':''}>Tools</option></select></div>
        <div style="flex:1;"><label style="${LS}">Discount Label</label><input id="epDiscount" value="${p.discount||''}" style="${IS}" placeholder="-50%"></div>
      </div>
      <div><label style="${LS}">Image URL</label><input id="epImg" value="${(p.image||'').replace(/"/g,'&quot;')}" style="${IS}" placeholder="https://..."></div>
      <div><label style="${LS}">WhatsApp Number (for buy button)</label><input id="epWa" value="${(p.whatsappMsg||'').replace(/"/g,'&quot;')}" style="${IS}"></div>
      <div><label style="${LS}">Short Description</label><textarea id="epShort" rows="2" style="${IS}">${p.shortDesc||''}</textarea></div>
      <div><label style="${LS}">Features (comma-separated)</label><textarea id="epFeatures" rows="3" style="${IS}">${(Array.isArray(p.features)?p.features:p.features?[p.features]:[]).join(', ')}</textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:6px;">
        <button id="epCancel" style="padding:10px 20px;background:#f1f5f9;border:1px solid rgba(15,23,42,0.08);border-radius:8px;color:#0f172a;cursor:pointer;font-weight:600;">Cancel</button>
        <button id="epSave" style="padding:10px 22px;background:#ff6b35;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:700;">Save Changes</button>
      </div>
    </div>`, (ov) => {
    document.getElementById('epCancel').onclick = () => ov.remove();
    document.getElementById('epSave').onclick = async () => {
      try {
        const btn = document.getElementById('epSave');
        btn.innerText = 'Saving...'; btn.disabled = true;
        const updated = {
          ...p,
          title: document.getElementById('epTitle').value.trim(),
          price: parseFloat(document.getElementById('epPrice').value)||0,
          oldPrice: parseFloat(document.getElementById('epOldPrice').value)||0,
          category: document.getElementById('epCat').value,
          discount: document.getElementById('epDiscount').value.trim(),
          image: document.getElementById('epImg').value.trim(),
          whatsappMsg: document.getElementById('epWa').value.trim(),
          shortDesc: document.getElementById('epShort').value.trim(),
          features: document.getElementById('epFeatures').value.split(',').map(s=>s.trim()).filter(Boolean)
        };
        window.PRODUCTS_DATA[id] = updated;
        if (window.vextroSave) window.vextroSave('products', window.PRODUCTS_DATA);
        window._adminChangesMade = true;
        ov.remove();
        try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e) { console.error('Edit render error:', e); }
        if (window.filterShopProducts) window.filterShopProducts();
      } catch(e) { console.error('Edit product error:', e); alert('Error: '+e.message); }
    };
  });
};

window.adminAddProductNew = function() {
  const IS = adminInputStyle(), LS = adminLabelStyle();
  adminModal(`
    <h3 style="margin:0 0 20px;font-size:1.3rem;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;color:#0f172a;">Add New Product</h3>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label style="${LS}">Product Title *</label><input id="apTitle" style="${IS}" placeholder="Enter product name"></div>
      <div style="display:flex;gap:14px;">
        <div style="flex:1;"><label style="${LS}">Price (USD) *</label><input id="apPrice" type="number" style="${IS}" placeholder="0.00"></div>
        <div style="flex:1;"><label style="${LS}">Category</label><select id="apCat" style="${IS}"><option>Code Scripts</option><option>UI Templates</option><option>Graphics</option><option>Tools</option></select></div>
      </div>
      <div>
        <label style="${LS}">Product Image</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <input id="apImg" style="${IS};flex:1;min-width:0;" placeholder="Paste image URL (https://...)">
          <label style="padding:10px 16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;cursor:pointer;font-size:0.85rem;color:#64748b;white-space:nowrap;"><i class="fa-solid fa-upload"></i> Upload <input type="file" id="apImgFile" accept="image/*" style="display:none;"></label>
        </div>
        <div id="apImgPreview" style="margin-top:8px;"></div>
      </div>
      <div><label style="${LS}">Short Description</label><textarea id="apShort" rows="2" style="${IS}" placeholder="Brief product description..."></textarea></div>
      <div><label style="${LS}">Features (comma-separated)</label><textarea id="apFeatures" rows="3" style="${IS}" placeholder="Responsive Design, Full Source Code, 1 Year Support"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:6px;">
        <button id="apCancel" style="padding:10px 20px;background:#f1f5f9;border:1px solid rgba(15,23,42,0.08);border-radius:8px;color:#0f172a;cursor:pointer;font-weight:600;">Cancel</button>
        <button id="apSave" style="padding:10px 22px;background:#ff6b35;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:700;">Save Product</button>
      </div>
    </div>`, (ov) => {
    // Image file upload preview
    document.getElementById('apImgFile').onchange = function() {
      const file = this.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('apImg').value = e.target.result;
        document.getElementById('apImgPreview').innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:120px;border-radius:8px;border:1px solid rgba(15,23,42,0.12);">`;
      };
      reader.readAsDataURL(file);
    };
    // URL preview
    document.getElementById('apImg').oninput = function() {
      if (this.value.startsWith('http')) document.getElementById('apImgPreview').innerHTML = `<img src="${this.value}" style="max-width:100%;max-height:120px;border-radius:8px;border:1px solid rgba(15,23,42,0.12);" onerror="this.style.display='none'">`;
    };
    document.getElementById('apCancel').onclick = () => ov.remove();
    document.getElementById('apSave').onclick = async () => {
      try {
        const pTitle = document.getElementById('apTitle').value.trim();
        const pPrice = parseFloat(document.getElementById('apPrice').value);
        if (!pTitle || isNaN(pPrice)) return alert('Title and price are required');
        const btn = document.getElementById('apSave'); btn.innerText = 'Saving...'; btn.disabled = true;
        const newProduct = {
          title: pTitle, price: pPrice, oldPrice: Math.round(pPrice*1.5), category: document.getElementById('apCat').value,
          image: document.getElementById('apImg').value || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
          shortDesc: document.getElementById('apShort').value||'Premium digital product',
          features: document.getElementById('apFeatures').value.split(',').map(s=>s.trim()).filter(Boolean),
          discount: '-33%', rating: 5.0, sold: 0, reviews: 0,
          whatsappMsg: `Hi! I want to buy ${pTitle} for USD ${pPrice}. Please guide me.`, demoUrl: '#'
        };
        const newId = 'p' + Date.now();
        newProduct.id = newId;
        window.PRODUCTS_DATA = window.PRODUCTS_DATA || {};
        window.PRODUCTS_DATA[newId] = newProduct;
        console.log('Product added:', newId, 'Total:', Object.keys(window.PRODUCTS_DATA).length);
        if (window.vextroSave) window.vextroSave('products', window.PRODUCTS_DATA);
        window._adminChangesMade = true;
        ov.remove();
        try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e) { console.error('Add render error:', e); }
        console.log('Admin view rendered, total in DOM:', Object.keys(window.PRODUCTS_DATA).length);
        if (window.filterShopProducts) window.filterShopProducts();
      } catch(e) { console.error('Add product error:', e); alert('Error: '+e.message); }
    };
  });
};

// ── LISTINGS ───────────────────────────────────────────────────
async function renderAdminListingsNew(container) {
  container.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading...</p></div>';
  try {
    try {
      const r = await fetch('/api/listings');
      if (r.ok) { const d = await r.json(); if (d && d.length > 0) { window.MARKETPLACE_DATA = window.MARKETPLACE_DATA || {}; d.forEach(l => { window.MARKETPLACE_DATA[l.id] = l; }); } }
    } catch(e) {}
    const listings = Object.values(window.MARKETPLACE_DATA || {});
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div><div style="color:#0f172a;font-weight:800;font-size:1.1rem;">Marketplace Listings</div><div style="color:#94a3b8;font-size:0.85rem;">${listings.length} listing${listings.length!==1?'s':''} total</div></div>
      </div>
      <div class="admin-panel-card">
        ${listings.length===0?`<div class="admin-empty"><i class="fa-solid fa-store"></i><p style="font-weight:600;">No listings yet</p><p style="font-size:0.85rem;">Users' marketplace listings will appear here.</p></div>`:`
        <table class="admin-table">
          <thead><tr><th>Listing</th><th>Category</th><th>Price</th><th>Status</th><th style="text-align:right;">Action</th></tr></thead>
          <tbody>${listings.map(l=>`
            <tr>
              <td><div style="font-weight:700;color:#0f172a;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.title||'Untitled'}</div><div style="font-size:0.72rem;color:#94a3b8;">ID: #${l.id}</div></td>
              <td><span class="admin-badge admin-badge-blue">${l.category||'N/A'}</span></td>
              <td><span style="font-weight:700;color:#ff6b35;">$${l.price||0}</span></td>
              <td><span class="admin-badge ${l.status==='Active'?'admin-badge-green':'admin-badge-yellow'}">${l.status||'Active'}</span></td>
              <td style="text-align:right;"><button onclick="adminDeleteListingNew('${l.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:7px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-trash-can"></i> Delete</button></td>
            </tr>`).join('')}
          </tbody>
        </table>`}
      </div>`;
  } catch(e) { container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error: ${e.message}</p></div>`; }
}

window.adminDeleteListingNew = async function(id) {
  if (!confirm('Delete this listing permanently?')) return;
  if (window.MARKETPLACE_DATA && window.MARKETPLACE_DATA[id]) delete window.MARKETPLACE_DATA[id];
  try { await fetch(`/api/listings/${id}`, { method:'DELETE' }); } catch(e) {}
  if (window.fsDeleteDoc) window.fsDeleteDoc('listings', id);
  if (window.vextroSave) window.vextroSave('marketplace', window.MARKETPLACE_DATA);
  window._adminChangesMade = true;
  showAdminView('adminListings', document.querySelector('.admin-sidebar-item[data-view="adminListings"]'));
};

// ── BLOGS ───────────────────────────────────────────────────────
async function renderAdminAllBlogsNew(container) {
  container.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading...</p></div>';
  try {
    // Load blogs from localStorage first, or trigger fetchBlogs
    const saved = window.vextroLoad ? window.vextroLoad('blogs') : null;
    if (saved && saved.length > 0) {
      window.allBlogs = saved;
    } else if (!window.allBlogs || window.allBlogs.length === 0) {
      if (typeof window.fetchBlogs === 'function') {
        // fetchBlogs will populate window.allBlogs
        await window.fetchBlogs();
      }
      // If still empty after fetchBlogs, try API directly
      if (!window.allBlogs || window.allBlogs.length === 0) {
        try {
          const r = await fetch('/api/blogs');
          if (r.ok) { const d = await r.json(); if (d && d.length > 0) window.allBlogs = d; }
        } catch(e) { try { const r2 = await fetch('/api/blogs/all'); if (r2.ok) { const d2 = await r2.json(); if (d2 && d2.length > 0) window.allBlogs = d2; } } catch(e2) {} }
      }
    }
    // Load stats + comments so the admin table can show counts
    if (typeof window.loadBlogStatsAndComments === 'function') {
      try { await window.loadBlogStatsAndComments(); } catch(e) {}
    }
    const blogs = window.allBlogs || [];
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div><div style="color:#0f172a;font-weight:800;font-size:1.1rem;">All Blog Posts</div><div style="color:#94a3b8;font-size:0.85rem;">${blogs.length} post${blogs.length!==1?'s':''} total</div></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${blogs.length>0?`<button onclick="adminDeleteAllBlogsNew()" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:12px 18px;border-radius:10px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Delete All</button>`:''}
          <button onclick="adminAddBlogNew()" style="background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;padding:12px 22px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);"><i class="fa-solid fa-plus"></i> Add New Blog</button>
        </div>
      </div>
      <div class="admin-panel-card">
        ${blogs.length===0?`<div class="admin-empty"><i class="fa-solid fa-newspaper"></i><p style="font-weight:600;">No blogs yet</p><button onclick="adminAddBlogNew()" style="margin-top:16px;padding:10px 22px;background:#ff6b35;border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;">+ Add First Blog</button></div>`:`
        <table class="admin-table">
          <thead><tr><th>Blog</th><th>Author</th><th>Category</th><th>Status</th><th>Date</th><th>Views</th><th>Comments</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>${blogs.map(b=>{
            const st = (window.blogStats && window.blogStats[String(b.id)]) || {};
            const views = Number(st.views) || 0;
            const cList = (window.blogComments && window.blogComments[String(b.id)]) || [];
            const cCount = cList.length;
            return `
            <tr>
              <td><div style="display:flex;align-items:center;gap:12px;">
                <img src="${b.image||b.cover||'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=80&q=80'}" style="width:42px;height:42px;border-radius:8px;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=80&q=80'">
                <div><div style="font-weight:700;color:#0f172a;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title||'Untitled'}</div>${b.featured?'<div style="font-size:0.68rem;color:#f59e0b;font-weight:700;"><i class="fa-solid fa-star"></i> Featured</div>':''}</div>
              </div></td>
              <td><span style="color:#64748b;">${b.authorName||b.author||'User'}</span></td>
              <td><span class="admin-badge admin-badge-blue">${b.category||'General'}</span></td>
              <td><select onchange="adminChangeBlogStatusNew('${b.id}',this.value)" style="padding:5px 8px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:6px;font-size:0.78rem;color:#0f172a;">
                <option value="Published" ${b.status==='Published'?'selected':''}>✅ Published</option>
                <option value="Draft" ${b.status==='Draft'?'selected':''}>📝 Draft</option>
                <option value="Pending" ${b.status==='Pending'?'selected':''}>⏳ Pending</option>
              </select></td>
              <td style="font-size:0.78rem;color:#94a3b8;">${b.date||b.createdAt||'N/A'}</td>
              <td><span style="display:inline-flex;align-items:center;gap:6px;background:rgba(59,130,246,0.08);color:#3b82f6;padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.8rem;"><i class="fa-regular fa-eye"></i> ${views.toLocaleString()}</span></td>
              <td><button onclick="adminViewBlogComments('${b.id}')" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,0.08);color:#ff6b35;border:1px solid rgba(255,107,53,0.25);padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.8rem;cursor:pointer;"><i class="fa-regular fa-comment"></i> ${cCount}</button></td>
              <td style="text-align:right;">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button onclick="adminEditBlogNew('${b.id}')" style="background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);padding:7px 13px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                  <button onclick="adminDeleteBlogNew('${b.id}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:7px 13px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </td>
            </tr>`;}).join('')}
          </tbody>
        </table>`}
      </div>`;
  } catch(e) { container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error: ${e.message}</p></div>`; }
}

function adminBlogFormHtml(b) {
  const IS = adminInputStyle(), LS = adminLabelStyle();
  const esc = s => (s||'').toString().replace(/"/g,'&quot;');
  const cats = ['General','Technology','Design','Business','Tutorial','News','Marketing','Development'];
  const coverImg = b.image || b.cover || '';
  const content = (b.content || b.body || '').toString();
  const tb = 'background:#ffffff;border:1px solid rgba(15,23,42,0.12);border-radius:6px;padding:7px 10px;cursor:pointer;color:#0f172a;font-size:0.85rem;min-width:36px;font-weight:600;';
  return `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div><label style="${LS}">Blog Title *</label><input id="bfTitle" value="${esc(b.title)}" style="${IS}" placeholder="Enter an eye-catching title"></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;"><label style="${LS}">Author Name</label><input id="bfAuthor" value="${esc(b.authorName||b.author)}" style="${IS}" placeholder="Author"></div>
        <div style="flex:1;min-width:180px;"><label style="${LS}">Category</label><select id="bfCat" style="${IS}">${cats.map(c=>`<option ${((b.category||'General')===c)?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div>
        <label style="${LS}">Cover Image</label>
        <div style="border:2px dashed rgba(15,23,42,0.15);border-radius:10px;padding:14px;background:#f8fafc;text-align:center;">
          <img id="bfCoverPreview" src="${esc(coverImg)}" style="max-width:100%;max-height:180px;border-radius:8px;display:${coverImg?'block':'none'};margin:0 auto 10px;object-fit:cover;">
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <input id="bfCoverFile" type="file" accept="image/*" style="display:none;">
            <button type="button" id="bfCoverPick" style="padding:9px 18px;background:#ff6b35;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;"><i class="fa-solid fa-upload"></i> Upload Image</button>
            <button type="button" id="bfCoverClear" style="padding:9px 14px;background:#f1f5f9;color:#0f172a;border:1px solid rgba(15,23,42,0.08);border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;display:${coverImg?'inline-block':'none'};">Remove</button>
          </div>
          <input id="bfImg" type="hidden" value="${esc(coverImg)}">
          <div style="font-size:0.72rem;color:#94a3b8;margin-top:8px;">PNG, JPG, WebP · up to ~20MB</div>
        </div>
      </div>
      <div><label style="${LS}">Short Excerpt / Summary</label><textarea id="bfExcerpt" rows="2" style="${IS}" placeholder="Brief summary shown on blog cards">${esc(b.excerpt||b.summary)}</textarea></div>
      <div>
        <label style="${LS}">Full Content</label>
        <div style="border:1px solid rgba(15,23,42,0.12);border-radius:10px;overflow:hidden;background:#ffffff;">
          <div id="bfToolbar" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f8fafc;border-bottom:1px solid rgba(15,23,42,0.08);">
            <button type="button" data-cmd="bold" title="Bold" style="${tb}"><b>B</b></button>
            <button type="button" data-cmd="italic" title="Italic" style="${tb}"><i>I</i></button>
            <button type="button" data-cmd="underline" title="Underline" style="${tb}"><u>U</u></button>
            <button type="button" data-cmd="strikeThrough" title="Strikethrough" style="${tb}"><s>S</s></button>
            <button type="button" data-block="H2" title="Heading 2" style="${tb}">H2</button>
            <button type="button" data-block="H3" title="Heading 3" style="${tb}">H3</button>
            <button type="button" data-block="P" title="Paragraph" style="${tb}">P</button>
            <button type="button" data-block="BLOCKQUOTE" title="Quote" style="${tb}"><i class="fa-solid fa-quote-right"></i></button>
            <button type="button" data-cmd="insertUnorderedList" title="Bullet list" style="${tb}"><i class="fa-solid fa-list-ul"></i></button>
            <button type="button" data-cmd="insertOrderedList" title="Numbered list" style="${tb}"><i class="fa-solid fa-list-ol"></i></button>
            <button type="button" id="bfBtnLink" title="Insert link" style="${tb}"><i class="fa-solid fa-link"></i></button>
            <button type="button" id="bfBtnUnlink" title="Remove link" style="${tb}"><i class="fa-solid fa-link-slash"></i></button>
            <button type="button" id="bfBtnImage" title="Insert image" style="${tb};background:#fff7ed;color:#ff6b35;border-color:rgba(255,107,53,0.3);"><i class="fa-solid fa-image"></i></button>
            <button type="button" data-cmd="justifyLeft" title="Align left" style="${tb}"><i class="fa-solid fa-align-left"></i></button>
            <button type="button" data-cmd="justifyCenter" title="Align center" style="${tb}"><i class="fa-solid fa-align-center"></i></button>
            <button type="button" data-cmd="removeFormat" title="Clear formatting" style="${tb}"><i class="fa-solid fa-eraser"></i></button>
          </div>
          <div id="bfEditor" contenteditable="true" style="min-height:240px;max-height:400px;overflow-y:auto;padding:14px 16px;color:#0f172a;font-size:0.95rem;line-height:1.65;outline:none;font-family:'Inter',sans-serif;">${content}</div>
          <input id="bfEditorImgFile" type="file" accept="image/*" style="display:none;">
        </div>
        <div style="font-size:0.72rem;color:#94a3b8;margin-top:6px;"><i class="fa-solid fa-circle-info"></i> Select text and click <b>link</b> to add a URL · Click the <b>image</b> icon to upload images inside the blog</div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;"><label style="${LS}">Tags (comma-separated)</label><input id="bfTags" value="${esc(Array.isArray(b.tags)?b.tags.join(', '):(b.tags||''))}" style="${IS}" placeholder="web, design, tips"></div>
        <div style="flex:1;min-width:120px;"><label style="${LS}">Read Time (min)</label><input id="bfRead" type="number" value="${b.readTime||5}" style="${IS}"></div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;"><label style="${LS}">Status</label><select id="bfStatus" style="${IS}">
          <option value="Published" ${b.status==='Published'?'selected':''}>✅ Published</option>
          <option value="Draft" ${(!b.status||b.status==='Draft')?'selected':''}>📝 Draft</option>
          <option value="Pending" ${b.status==='Pending'?'selected':''}>⏳ Pending Review</option>
        </select></div>
        <div style="flex:1;min-width:180px;display:flex;align-items:flex-end;">
          <label style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:8px;cursor:pointer;width:100%;font-weight:600;color:#0f172a;font-size:0.9rem;">
            <input id="bfFeatured" type="checkbox" ${b.featured?'checked':''} style="width:18px;height:18px;accent-color:#ff6b35;"> Feature on homepage
          </label>
        </div>
      </div>
      <div><label style="${LS}">SEO Meta Description</label><textarea id="bfSeo" rows="2" style="${IS}" placeholder="Description for search engines (optional)">${esc(b.seoDescription||b.metaDescription)}</textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:6px;">
        <button id="bfCancel" style="padding:10px 20px;background:#f1f5f9;border:1px solid rgba(15,23,42,0.08);border-radius:8px;color:#0f172a;cursor:pointer;font-weight:600;">Cancel</button>
        <button id="bfSave" style="padding:10px 22px;background:#ff6b35;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:700;">Save Blog</button>
      </div>
    </div>`;
}

function adminReadBlogForm() {
  const editor = document.getElementById('bfEditor');
  return {
    title: document.getElementById('bfTitle').value.trim(),
    authorName: document.getElementById('bfAuthor').value.trim() || 'Admin',
    category: document.getElementById('bfCat').value,
    image: document.getElementById('bfImg').value.trim(),
    excerpt: document.getElementById('bfExcerpt').value.trim(),
    content: editor ? editor.innerHTML : '',
    tags: document.getElementById('bfTags').value.split(',').map(s=>s.trim()).filter(Boolean),
    readTime: parseInt(document.getElementById('bfRead').value)||5,
    status: document.getElementById('bfStatus').value,
    featured: document.getElementById('bfFeatured').checked,
    seoDescription: document.getElementById('bfSeo').value.trim()
  };
}

function adminBindBlogForm() {
  const $ = id => document.getElementById(id);
  const coverFile = $('bfCoverFile'), coverPrev = $('bfCoverPreview'), coverHidden = $('bfImg'), coverClear = $('bfCoverClear');
  $('bfCoverPick').onclick = () => coverFile.click();
  coverFile.onchange = async () => {
    const f = coverFile.files && coverFile.files[0]; if (!f) return;
    if (f.size > 20*1024*1024) return alert('Image too large (max 20MB)');
    try {
      const dataUrl = await window.adminCompressImage(f, 1600, 0.85);
      coverHidden.value = dataUrl; coverPrev.src = dataUrl;
      coverPrev.style.display='block'; coverClear.style.display='inline-block';
    } catch(e) { alert('Could not process image. Try a different file.'); }
  };
  coverClear.onclick = () => { coverHidden.value=''; coverPrev.src=''; coverPrev.style.display='none'; coverClear.style.display='none'; coverFile.value=''; };

  const editor = $('bfEditor'), toolbar = $('bfToolbar');
  let savedRange = null;
  const saveSel = () => { const s = window.getSelection(); if (s && s.rangeCount && editor.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); };
  const restoreSel = () => { editor.focus(); if (savedRange) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); } };
  editor.addEventListener('mouseup', saveSel);
  editor.addEventListener('keyup', saveSel);
  editor.addEventListener('touchend', saveSel);
  toolbar.addEventListener('mousedown', e => e.preventDefault());
  toolbar.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    restoreSel();
    if (btn.dataset.cmd) document.execCommand(btn.dataset.cmd, false, null);
    else if (btn.dataset.block) document.execCommand('formatBlock', false, btn.dataset.block);
    saveSel();
  });
  $('bfBtnLink').onclick = () => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return alert('Select the text first, then click link');
    const url = prompt('Enter link URL', 'https://');
    if (!url) return;
    document.execCommand('createLink', false, url);
    editor.querySelectorAll('a').forEach(a => { if (a.getAttribute('href')===url) { a.target='_blank'; a.rel='noopener noreferrer'; } });
    saveSel();
  };
  $('bfBtnUnlink').onclick = () => { restoreSel(); document.execCommand('unlink'); saveSel(); };
  const imgFile = $('bfEditorImgFile');
  $('bfBtnImage').onclick = () => { saveSel(); imgFile.click(); };
  imgFile.onchange = async () => {
    const f = imgFile.files && imgFile.files[0]; if (!f) return;
    if (f.size > 20*1024*1024) { alert('Image too large (max 20MB)'); imgFile.value=''; return; }
    try {
      const dataUrl = await window.adminCompressImage(f, 1400, 0.82);
      restoreSel();
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" style="max-width:100%;border-radius:10px;margin:10px 0;display:block;" alt=""><p><br></p>`);
      saveSel();
    } catch(e) { alert('Could not process image.'); }
    imgFile.value='';
  };
  editor.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (items) for (const it of items) if (it.type && it.type.startsWith('image/')) {
      e.preventDefault();
      const file = it.getAsFile(); if (!file) return;
      window.adminCompressImage(file, 1400, 0.82).then(dataUrl => {
        document.execCommand('insertHTML', false, `<img src="${dataUrl}" style="max-width:100%;border-radius:10px;margin:10px 0;display:block;" alt="">`);
      }).catch(()=>{});
      return;
    }
  });
}


window.adminAddBlogNew = function() {
  adminModal(`<h3 style="margin:0 0 20px;font-size:1.3rem;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;color:#0f172a;"><i class="fa-solid fa-newspaper" style="color:#ff6b35;"></i> Add New Blog Post</h3>${adminBlogFormHtml({})}`, (ov)=>{
    adminBindBlogForm();
    document.getElementById('bfCancel').onclick = () => ov.remove();
    document.getElementById('bfSave').onclick = async () => {
      const data = adminReadBlogForm();
      if (!data.title) return alert('Please enter a blog title');
      const btn = document.getElementById('bfSave');
      btn.innerText = 'Saving...'; btn.disabled = true;
      const newBlog = { id: 'blog_'+Date.now(), ...data, date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() };
      try { const r = await fetch('/api/blogs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newBlog) }); if(r.ok){ const saved = await r.json(); Object.assign(newBlog, saved); } } catch(e) {}
      window.allBlogs = Array.isArray(window.allBlogs) ? window.allBlogs : [];
      // Guard against a duplicate entry from a previous partial run
      window.allBlogs = window.allBlogs.filter(x => String(x.id) !== String(newBlog.id));
      window.allBlogs.unshift(newBlog);
      // Keep the top-level `allBlogs` used by the public site pointing at the same array (single source of truth — no second unshift)
      try { if (typeof allBlogs !== 'undefined') { allBlogs = window.allBlogs; } } catch(e) {}
      const okSave = window.adminSafeSave ? window.adminSafeSave('blogs', window.allBlogs) : (window.vextroSave && window.vextroSave('blogs', window.allBlogs), true);
      if (!okSave) {
        // Roll back so the visible state matches what actually persisted
        window.allBlogs = window.allBlogs.filter(x => x.id !== newBlog.id);
        try { if (typeof allBlogs !== 'undefined') allBlogs = window.allBlogs; } catch(e) {}
        btn.innerText = 'Save Blog'; btn.disabled = false;
        return;
      }
      if (window.fsSetDoc) window.fsSetDoc('blogs', newBlog.id, newBlog);
      if (typeof window.renderBlogs === 'function') window.renderBlogs(window.allBlogs);
      window._adminChangesMade = true;
      ov.remove();
      showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view="adminBlogs"]'));
    };
  });
};

window.adminEditBlogNew = function(id) {
  const b = (window.allBlogs||[]).find(x=>String(x.id)===String(id));
  if (!b) return alert('Blog not found');
  adminModal(`<h3 style="margin:0 0 20px;font-size:1.3rem;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;color:#0f172a;"><i class="fa-solid fa-pen-to-square" style="color:#3b82f6;"></i> Edit Blog Post</h3>${adminBlogFormHtml(b)}`, (ov)=>{
    adminBindBlogForm();
    document.getElementById('bfCancel').onclick = () => ov.remove();
    document.getElementById('bfSave').onclick = async () => {
      const data = adminReadBlogForm();
      if (!data.title) return alert('Please enter a blog title');
      const btn = document.getElementById('bfSave');
      btn.innerText = 'Saving...'; btn.disabled = true;
      Object.assign(b, data, { updatedAt: new Date().toISOString() });
      try { await fetch(`/api/blogs/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) }); } catch(e) {}
      const okSave = window.adminSafeSave ? window.adminSafeSave('blogs', window.allBlogs) : (window.vextroSave && window.vextroSave('blogs', window.allBlogs), true);
      if (!okSave) { btn.innerText = 'Save Blog'; btn.disabled = false; return; }
      if (window.fsSetDoc) window.fsSetDoc('blogs', b.id, b);
      window._adminChangesMade = true;
      ov.remove();
      showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view="adminBlogs"]'));
    };
  });
};

window.adminChangeBlogStatusNew = async function(id, status) {
  try { await fetch(`/api/blogs/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) }); } catch(e) {}
  if (window.allBlogs) { const b = window.allBlogs.find(x=>x.id==id); if(b) b.status=status; }
  if (window.vextroSave) window.vextroSave('blogs', window.allBlogs);
  window._adminChangesMade = true;
};

window.adminDeleteBlogNew = async function(id) {
  if (!confirm('Delete this blog permanently?')) return;
  window._adminChangesMade = true;
  // Sync the two blog lists (admin uses window.allBlogs, public site uses top-level allBlogs)
  if (window.allBlogs) window.allBlogs = window.allBlogs.filter(b => String(b.id) !== String(id));
  try { if (typeof allBlogs !== 'undefined' && Array.isArray(allBlogs)) { allBlogs = allBlogs.filter(b => String(b.id) !== String(id)); window.allBlogs = allBlogs; } } catch(e) {}
  // Track deletion so seed data / stale Firestore reads can't restore it
  if (window.vextroLoad && window.vextroSave) {
    const deleted = window.vextroLoad('blogs_deleted') || [];
    if (!deleted.map(String).includes(String(id))) deleted.push(id);
    window.vextroSave('blogs_deleted', deleted);
  }
  if (window.vextroSave) window.vextroSave('blogs', window.allBlogs || []);
  try { await fetch(`/api/blogs/${id}`, { method:'DELETE' }); } catch(e) {}
  if (window.fsDeleteDoc) { try { await window.fsDeleteDoc('blogs', id); } catch(e) {} }
  if (typeof window.renderBlogs === 'function') window.renderBlogs(window.allBlogs || []);
  showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view="adminBlogs"]'));
};

window.adminDeleteAllBlogsNew = async function() {
  const list = Array.isArray(window.allBlogs) ? window.allBlogs.slice() : [];
  if (list.length === 0) return;
  if (!confirm(`Delete ALL ${list.length} blog${list.length!==1?'s':''} permanently? This cannot be undone.`)) return;
  window._adminChangesMade = true;
  const ids = list.map(b => b.id).filter(Boolean);
  // Clear local state first for instant UI feedback
  window.allBlogs = [];
  try { if (typeof allBlogs !== 'undefined') allBlogs = []; } catch(e) {}
  if (window.vextroLoad && window.vextroSave) {
    const deleted = window.vextroLoad('blogs_deleted') || [];
    ids.forEach(id => { if (!deleted.map(String).includes(String(id))) deleted.push(id); });
    window.vextroSave('blogs_deleted', deleted);
  }
  if (window.vextroSave) window.vextroSave('blogs', []);
  // Re-render immediately so user sees empty state without waiting on network
  showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view="adminBlogs"]'));
  // Fire off deletes in parallel (do not block UI)
  const tasks = ids.map(id => {
    const p1 = fetch(`/api/blogs/${id}`, { method:'DELETE' }).catch(()=>{});
    const p2 = window.fsDeleteDoc ? window.fsDeleteDoc('blogs', id).catch(()=>{}) : Promise.resolve();
    return Promise.all([p1, p2]);
  });
  try { await Promise.all(tasks); } catch(e) {}
  if (typeof window.renderBlogs === 'function') window.renderBlogs([]);
};

// View & manage comments for a specific blog
window.adminViewBlogComments = async function(blogId) {
  const key = String(blogId);
  if ((!window.blogComments || !window.blogComments[key]) && typeof window.loadBlogStatsAndComments === 'function') {
    try { await window.loadBlogStatsAndComments(); } catch(e) {}
  }
  const blog = (window.allBlogs || []).find(b => String(b.id) === key) || {};
  const items = (window.blogComments && window.blogComments[key]) || [];
  const esc = s => (s||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const overlay = document.createElement('div');
  overlay.id = 'adminCommentsOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;max-width:640px;width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.3);">
      <div style="padding:18px 22px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-weight:800;color:#0f172a;font-size:1.05rem;">Comments · ${items.length}</div>
          <div style="color:#94a3b8;font-size:0.82rem;margin-top:2px;">${esc(blog.title||'Blog')}</div>
        </div>
        <button onclick="document.getElementById('adminCommentsOverlay').remove()" style="background:#f1f5f9;border:none;width:36px;height:36px;border-radius:10px;cursor:pointer;color:#0f172a;font-size:1rem;">✕</button>
      </div>
      <div style="padding:18px 22px;overflow:auto;flex:1;background:#f8fafc;">
        ${items.length===0 ? `<div style="text-align:center;color:#94a3b8;padding:40px 10px;">No comments yet on this blog.</div>` :
          items.slice().reverse().map((c,i)=>{
            const idx = items.length - 1 - i;
            const dt = c.date ? new Date(c.date).toLocaleString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
            return `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;">
                <div style="font-weight:700;color:#0f172a;">${esc(c.name||'Anonymous')}${c.email?` <span style="color:#94a3b8;font-weight:500;font-size:0.82rem;">· ${esc(c.email)}</span>`:''}</div>
                <button onclick="adminDeleteBlogComment('${key}',${idx})" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:5px 10px;border-radius:8px;font-weight:600;font-size:0.75rem;cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
              </div>
              <div style="color:#94a3b8;font-size:0.78rem;margin-bottom:8px;">${dt}</div>
              <div style="color:#334155;line-height:1.6;">${esc(c.text||'').replace(/\n/g,'<br>')}</div>
            </div>`;
          }).join('')
        }
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

window.adminDeleteBlogComment = async function(blogId, idx) {
  if (!confirm('Delete this comment?')) return;
  const key = String(blogId);
  const arr = (window.blogComments && window.blogComments[key]) || [];
  arr.splice(idx, 1);
  window.blogComments[key] = arr;
  if (window.fsSetDoc) { try { await window.fsSetDoc('blog_comments', key, { items: arr }); } catch(e) {} }
  // Refresh modal + admin table
  document.getElementById('adminCommentsOverlay')?.remove();
  window.adminViewBlogComments(blogId);
  showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view="adminBlogs"]'));
};




async function renderAdminOrdersNew(container) {
  try {
    const orders = []; // Load orders from window if implemented
    container.innerHTML = `
      <div class="admin-panel-card">
        ${orders.length === 0 ? '<div class="admin-empty"><i class="fa-solid fa-receipt"></i><p>No orders yet</p></div>' : `
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Buyer</th><th>Email</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${orders.map(o => `
            <tr>
              <td style="font-weight:700;">#${o.id}</td>
              <td>${o.buyerName || '-'}</td>
              <td style="font-size:0.85rem;">${o.buyerEmail || '-'}</td>
              <td style="font-weight:600;">$${o.amount}</td>
              <td><span class="admin-badge ${o.status === 'completed' ? 'admin-badge-green' : o.status === 'pending' ? 'admin-badge-yellow' : 'admin-badge-red'}">${o.status}</span></td>
              <td style="font-size:0.8rem;color:#94a3b8;">${o.createdAt}</td>
            </tr>`).join('')}</tbody>
        </table>`}
      </div>
    `;
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error</p></div>`;
  }
}

async function renderAdminUsersNew(container) {
  container.innerHTML = `<div class="admin-panel-card"><div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading users…</p></div></div>`;
  try {
    // Load users + comments (for activity count)
    let usersMap = {};
    let commentsMap = {};
    if (window.fsLoadMap) {
      try { usersMap = (await window.fsLoadMap('users')) || {}; } catch(e) {}
      try { commentsMap = (await window.fsLoadMap('blog_comments')) || {}; } catch(e) {}
    }
    // Count comments per email
    const commentsByEmail = {};
    Object.values(commentsMap || {}).forEach(entry => {
      const items = Array.isArray(entry.items) ? entry.items : [];
      items.forEach(c => {
        const em = (c.email || '').toLowerCase().trim();
        if (em) commentsByEmail[em] = (commentsByEmail[em] || 0) + 1;
      });
    });

    window.__adminUsersCache = usersMap;
    window.__adminUsersCommentsByEmail = commentsByEmail;
    renderAdminUsersTable(container, '');
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error loading users</p></div>`;
  }
}

function renderAdminUsersTable(container, filter) {
  const usersMap = window.__adminUsersCache || {};
  const commentsByEmail = window.__adminUsersCommentsByEmail || {};
  const f = (filter || '').toLowerCase().trim();
  let users = Object.values(usersMap);
  if (f) users = users.filter(u =>
    (u.email || '').toLowerCase().includes(f) ||
    (u.displayName || '').toLowerCase().includes(f)
  );
  // newest first
  users.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const stats = {
    total: Object.keys(usersMap).length,
    admins: Object.values(usersMap).filter(u => u.role === 'admin').length,
    banned: Object.values(usersMap).filter(u => u.status === 'banned').length,
    active: Object.values(usersMap).filter(u => (u.status || 'active') === 'active').length
  };

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px;">
      ${[
        {label:'Total Users', val:stats.total, c:'#3b82f6', i:'fa-users'},
        {label:'Active', val:stats.active, c:'#10b981', i:'fa-user-check'},
        {label:'Admins', val:stats.admins, c:'#f59e0b', i:'fa-user-shield'},
        {label:'Banned', val:stats.banned, c:'#ef4444', i:'fa-user-slash'}
      ].map(s => `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div style="width:38px;height:38px;border-radius:10px;background:${s.c}18;color:${s.c};display:flex;align-items:center;justify-content:center;"><i class="fa-solid ${s.i}"></i></div>
          <div><div style="font-size:0.78rem;color:#94a3b8;font-weight:600;">${s.label}</div><div style="font-size:1.35rem;font-weight:800;color:#0f172a;">${s.val}</div></div>
        </div>`).join('')}
    </div>
    <div class="admin-panel-card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:14px 16px;border-bottom:1px solid #e2e8f0;">
        <div style="flex:1;min-width:200px;position:relative;">
          <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;"></i>
          <input id="adminUserSearch" type="text" placeholder="Search by name or email…" value="${f.replace(/"/g,'&quot;')}"
            style="width:100%;padding:10px 12px 10px 36px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.9rem;background:#f8fafc;color:#0f172a;">
        </div>
        <div style="font-size:0.82rem;color:#64748b;">${users.length} shown</div>
      </div>
      ${users.length === 0 ? `
        <div class="admin-empty" style="padding:40px 20px;">
          <i class="fa-solid fa-users"></i>
          <p style="font-weight:600;">${f ? 'No matching users' : 'No users yet'}</p>
          ${!f ? '<p style="font-size:0.82rem;color:#94a3b8;">Users appear here after they sign in for the first time.</p>' : ''}
        </div>` : `
      <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead><tr><th>User</th><th>Provider</th><th>Role</th><th>Status</th><th>Comments</th><th>Joined</th><th>Last Login</th><th style="text-align:right;">Actions</th></tr></thead>
        <tbody>${users.map(u => {
          const email = (u.email || '').toLowerCase();
          const commentsN = commentsByEmail[email] || 0;
          const initial = (u.displayName || u.email || '?').trim().charAt(0).toUpperCase();
          const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
          const last = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
          const status = u.status || 'active';
          const role = u.role || 'user';
          const provIcon = u.provider && u.provider.includes('google') ? 'fa-brands fa-google' : 'fa-solid fa-envelope';
          const provLabel = u.provider && u.provider.includes('google') ? 'Google' : 'Email';
          return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                ${u.photoURL ? `<img src="${u.photoURL}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` :
                  `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;">${initial}</div>`}
                <div style="min-width:0;">
                  <div style="font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${(u.displayName||'User').replace(/</g,'&lt;')}</div>
                  <div style="font-size:0.78rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${(u.email||'').replace(/</g,'&lt;')}</div>
                </div>
              </div>
            </td>
            <td><span style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;color:#334155;"><i class="${provIcon}"></i> ${provLabel}</span></td>
            <td>
              <select onchange="adminChangeUserRole('${u.uid}',this.value)" style="padding:5px 8px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:6px;font-size:0.78rem;color:#0f172a;">
                <option value="user" ${role==='user'?'selected':''}>👤 User</option>
                <option value="admin" ${role==='admin'?'selected':''}>🛡️ Admin</option>
              </select>
            </td>
            <td>
              ${status === 'banned'
                ? '<span class="admin-badge" style="background:rgba(239,68,68,0.1);color:#ef4444;">Banned</span>'
                : '<span class="admin-badge admin-badge-green">Active</span>'}
            </td>
            <td><span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,0.08);color:#ff6b35;padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.8rem;"><i class="fa-regular fa-comment"></i> ${commentsN}</span></td>
            <td style="font-size:0.78rem;color:#94a3b8;">${joined}</td>
            <td style="font-size:0.78rem;color:#94a3b8;">${last}</td>
            <td style="text-align:right;">
              <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">
                ${status === 'banned'
                  ? `<button onclick="adminSetUserStatus('${u.uid}','active')" style="background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.25);padding:6px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.76rem;"><i class="fa-solid fa-user-check"></i> Unban</button>`
                  : `<button onclick="adminSetUserStatus('${u.uid}','banned')" style="background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);padding:6px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.76rem;"><i class="fa-solid fa-ban"></i> Ban</button>`}
                <button onclick="adminDeleteUser('${u.uid}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:6px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.76rem;"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      </div>`}
    </div>
  `;

  const search = document.getElementById('adminUserSearch');
  if (search) {
    search.addEventListener('input', (e) => {
      renderAdminUsersTable(container, e.target.value);
      // restore focus + cursor
      const s = document.getElementById('adminUserSearch');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    });
  }
}

window.adminChangeUserRole = async function(uid, role) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  u.role = role;
  window.__adminUsersCache[uid] = u;
  if (window.fsSetDoc) { try { await window.fsSetDoc('users', uid, u); } catch(e) {} }
};

window.adminSetUserStatus = async function(uid, status) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  if (status === 'banned' && !confirm(`Ban ${u.email || 'this user'}? They will be signed out on next visit.`)) return;
  u.status = status;
  window.__adminUsersCache[uid] = u;
  if (window.fsSetDoc) { try { await window.fsSetDoc('users', uid, u); } catch(e) {} }
  showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view="adminUsers"]'));
};

window.adminDeleteUser = async function(uid) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  if (!confirm(`Delete user record for ${u.email || uid}?\n\nNote: This only removes them from the admin list. The Firebase Auth account itself must be deleted from the Firebase Console.`)) return;
  delete window.__adminUsersCache[uid];
  if (window.fsDeleteDoc) { try { await window.fsDeleteDoc('users', uid); } catch(e) {} }
  showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view="adminUsers"]'));
};


async function renderAdminContactsNew(container) {
  try {
    const contacts = []; // Load contacts from window if implemented
    container.innerHTML = `
      <div class="admin-panel-card">
        ${contacts.length === 0 ? '<div class="admin-empty"><i class="fa-solid fa-envelope"></i><p>No messages</p></div>' : `
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Priority</th><th>Date</th></tr></thead>
          <tbody>${contacts.map(c => `
            <tr>
              <td style="font-weight:600;">${c.name}</td>
              <td style="font-size:0.85rem;">${c.email}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.subject || '-'}</td>
              <td><span class="admin-badge ${c.priority === 'CRITICAL' ? 'admin-badge-red' : c.priority === 'HIGH' ? 'admin-badge-yellow' : 'admin-badge-blue'}">${c.priority}</span></td>
              <td style="font-size:0.8rem;color:#94a3b8;">${c.createdAt}</td>
            </tr>`).join('')}</tbody>
        </table>`}
      </div>
    `;
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error</p></div>`;
  }
}

async function renderAdminStatsNew(container) {
  try {
    const productCount = Object.keys(window.PRODUCTS_DATA || {}).length;
    const listingCount = Object.keys(window.MARKETPLACE_DATA || {}).length;
    const blogCount = (window.allBlogs || []).length;
    const recentProducts = Object.values(window.PRODUCTS_DATA || {}).slice(0, 5);
    const recentListings = Object.values(window.MARKETPLACE_DATA || {}).slice(0, 5);

    container.innerHTML = `
      <!-- Welcome Banner -->
      <div style="background:linear-gradient(135deg,rgba(255,107,53,0.15),rgba(59,130,246,0.1));border:1px solid rgba(255,107,53,0.2);border-radius:20px;padding:30px 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;">
        <div>
          <div style="font-size:0.85rem;color:#ff6b35;font-weight:700;letter-spacing:1px;margin-bottom:6px;">WELCOME BACK</div>
          <h2 style="margin:0;font-size:2rem;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">Vextro Lyntra Admin</h2>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:0.95rem;">Here's an overview of your platform activity.</p>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button onclick="showAdminView('products', document.querySelector('.admin-sidebar-item[data-view=\\'products\\']'))" style="padding:12px 22px;background:#ff6b35;border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='#f7931e'" onmouseout="this.style.background='#ff6b35'"><i class="fa-solid fa-box"></i> Manage Products</button>
          <button onclick="adminAddProductNew()" style="padding:12px 22px;background:rgba(255,255,255,0.08);border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;font-weight:700;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'"><i class="fa-solid fa-plus"></i> Add Product</button>
        </div>
      </div>

      <!-- Stat Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
        <div class="admin-stat-card" style="background:linear-gradient(135deg,#065f46,#ff6b35);cursor:pointer;" onclick="showAdminView('products', document.querySelector('.admin-sidebar-item[data-view=\\'products\\']'))">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:0.8rem;opacity:0.8;margin-bottom:12px;font-weight:600;letter-spacing:0.5px;">PRODUCTS</div>
              <div style="font-size:2.8rem;font-weight:900;line-height:1;">${productCount}</div>
            </div>
            <div style="width:50px;height:50px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;"><i class="fa-solid fa-box"></i></div>
          </div>
          <div style="margin-top:16px;font-size:0.8rem;opacity:0.7;">Total active products</div>
        </div>

        <div class="admin-stat-card" style="background:linear-gradient(135deg,#9a3412,#f97316);cursor:pointer;" onclick="showAdminView('adminListings', document.querySelector('.admin-sidebar-item[data-view=\\'adminListings\\']'))">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:0.8rem;opacity:0.8;margin-bottom:12px;font-weight:600;letter-spacing:0.5px;">LISTINGS</div>
              <div style="font-size:2.8rem;font-weight:900;line-height:1;">${listingCount}</div>
            </div>
            <div style="width:50px;height:50px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;"><i class="fa-solid fa-store"></i></div>
          </div>
          <div style="margin-top:16px;font-size:0.8rem;opacity:0.7;">Marketplace listings</div>
        </div>

        <div class="admin-stat-card" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);cursor:pointer;" onclick="showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view=\\'adminBlogs\\']'))">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:0.8rem;opacity:0.8;margin-bottom:12px;font-weight:600;letter-spacing:0.5px;">BLOG POSTS</div>
              <div style="font-size:2.8rem;font-weight:900;line-height:1;">${blogCount}</div>
            </div>
            <div style="width:50px;height:50px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;"><i class="fa-solid fa-newspaper"></i></div>
          </div>
          <div style="margin-top:16px;font-size:0.8rem;opacity:0.7;">Published blog posts</div>
        </div>

        <div class="admin-stat-card" style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:0.8rem;opacity:0.8;margin-bottom:12px;font-weight:600;letter-spacing:0.5px;">TOTAL REVENUE</div>
              <div style="font-size:2.8rem;font-weight:900;line-height:1;">$0</div>
            </div>
            <div style="width:50px;height:50px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;"><i class="fa-solid fa-dollar-sign"></i></div>
          </div>
          <div style="margin-top:16px;font-size:0.8rem;opacity:0.7;">From completed orders</div>
        </div>
      </div>

      <!-- Two Column Tables -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;flex-wrap:wrap;">
        <!-- Recent Products -->
        <div class="admin-panel-card" style="min-width:280px;">
          <div style="padding:20px 24px;border-bottom:1px solid rgba(15,23,42,0.08);display:flex;align-items:center;justify-content:space-between;">
            <div style="font-weight:700;color:#0f172a;font-size:1rem;">Recent Products</div>
            <a href="#" onclick="showAdminView('products', document.querySelector('.admin-sidebar-item[data-view=\\'products\\']'));return false;" style="font-size:0.8rem;color:#ff6b35;text-decoration:none;font-weight:600;">View all →</a>
          </div>
          ${recentProducts.length === 0 ? '<div class="admin-empty" style="padding:40px;"><i class="fa-solid fa-box"></i><p>No products yet</p></div>' : `
          <table class="admin-table">
            <thead><tr><th>Product</th><th>Price</th></tr></thead>
            <tbody>${recentProducts.map(p => `
              <tr>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">${p.title || 'Untitled'}</td>
                <td><span class="admin-badge admin-badge-green">$${p.price || 0}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Recent Listings -->
        <div class="admin-panel-card" style="min-width:280px;">
          <div style="padding:20px 24px;border-bottom:1px solid rgba(15,23,42,0.08);display:flex;align-items:center;justify-content:space-between;">
            <div style="font-weight:700;color:#0f172a;font-size:1rem;">Recent Listings</div>
            <a href="#" onclick="showAdminView('adminListings', document.querySelector('.admin-sidebar-item[data-view=\\'adminListings\\']'));return false;" style="font-size:0.8rem;color:#ff6b35;text-decoration:none;font-weight:600;">View all →</a>
          </div>
          ${recentListings.length === 0 ? '<div class="admin-empty" style="padding:40px;"><i class="fa-solid fa-store"></i><p>No listings yet</p></div>' : `
          <table class="admin-table">
            <thead><tr><th>Listing</th><th>Status</th></tr></thead>
            <tbody>${recentListings.map(l => `
              <tr>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">${l.title || 'Untitled'}</td>
                <td><span class="admin-badge ${l.status === 'Active' ? 'admin-badge-green' : 'admin-badge-yellow'}">${l.status || 'Active'}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="admin-panel-card" style="padding:24px;">
        <div style="font-weight:700;color:#0f172a;font-size:1rem;margin-bottom:20px;">⚡ Quick Actions</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <button onclick="adminAddProductNew()" style="padding:10px 20px;background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:10px;color:#ff6b35;font-weight:600;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,107,53,0.2)'" onmouseout="this.style.background='rgba(255,107,53,0.1)'"><i class="fa-solid fa-plus"></i> Add Product</button>
          <button onclick="showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view=\\'adminBlogs\\']'))" style="padding:10px 20px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;color:#3b82f6;font-weight:600;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.2)'" onmouseout="this.style.background='rgba(59,130,246,0.1)'"><i class="fa-solid fa-newspaper"></i> Manage Blogs</button>
          <button onclick="showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view=\\'adminUsers\\']'))" style="padding:10px 20px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;color:#f59e0b;font-weight:600;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(245,158,11,0.2)'" onmouseout="this.style.background='rgba(245,158,11,0.1)'"><i class="fa-solid fa-users"></i> View Users</button>
          <button onclick="adminGoToSite()" style="padding:10px 20px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;color:#8b5cf6;font-weight:600;cursor:pointer;font-size:0.88rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(139,92,246,0.2)'" onmouseout="this.style.background='rgba(139,92,246,0.1)'"><i class="fa-solid fa-globe"></i> View Live Site</button>
        </div>
      </div>
    `;
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error loading analytics</p></div>`;
    console.error('Admin stats error:', e);
  }
}

// Override updateAuthUI: auto-show admin dashboard on login
window.updateAuthUI = function(user) {
  if (origUpdateAuthUI) origUpdateAuthUI(user);

  if (user && user.email === ADMIN_EMAIL) {
    // Check if we should skip redirect (user clicked "View Site" or "Logout")
    if (sessionStorage.getItem('admin_skip_redirect') === '1') {
      sessionStorage.removeItem('admin_skip_redirect');
      isAdmin = false;
      document.body.classList.remove('is-admin');
      return;
    }
    isAdmin = true;
    document.body.classList.add('is-admin');
    // Auto-redirect to admin dashboard after login
    setTimeout(() => {
      showPage('dashboard');
    }, 800);
  } else {
    isAdmin = false;
    document.body.classList.remove('is-admin');
    removeAdminDashboard();
  }
};

// Re-check after all scripts load
setTimeout(() => {
  const user = window.auth?.currentUser;
  if (user && user.email === ADMIN_EMAIL) {
    isAdmin = true;
    document.body.classList.add('is-admin');
  }
}, 1500);
