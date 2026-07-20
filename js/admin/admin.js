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
        <a href="#" class="admin-sidebar-item" data-view="adminContacts" onclick="showAdminView('adminContacts',this);return false;" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;"><i class="fa-solid fa-envelope" style="width:18px;"></i> Messages <span id="adminMsgUnreadBadge" style="margin-left:auto;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:10px;display:none;">0</span></a>
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
  document.body.classList.remove('is-admin');
  const userDash = document.getElementById('dashboardPage');
  if (userDash) userDash.style.display = '';
  // Show footer again
  const footer = document.querySelector('.real-footer');
  if (footer) {
    footer.style.removeProperty('display');
    footer.style.display = 'block';
  }
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
  if (origShowPage) {
    origShowPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    location.reload();
  }
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
  removeAdminDashboard();
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

// Aliases used by Orders + other modules
window.showAdminOverlay = function(html) {
  closeAdminOverlay();
  const ov = document.createElement('div');
  ov.id = 'adminModalOverlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto;';
  ov.innerHTML = `<div style="background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:16px;width:100%;max-width:780px;padding:28px;box-shadow:0 24px 60px rgba(15,23,42,0.18);color:#0f172a;font-family:'Inter',sans-serif;">${html}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  return ov;
};
window.closeAdminOverlay = function() { const ex = document.getElementById('adminModalOverlay'); if (ex) ex.remove(); };

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
    const pendingProducts = window.__pendingProductSaves || {};
    try {
      if (window.fsLoadProductsHydrated || window.fsLoadMap) {
        const fsData = window.fsLoadProductsHydrated
          ? await window.fsLoadProductsHydrated()
          : await window.fsLoadMap('products');
        const meta = await window.fsLoadMap('site_meta');
        if (fsData && Object.keys(fsData).length > 0) {
          // Remote data is the source of truth, but immediately after adding a
          // product Firestore collection reads can lag for a moment. Keep the
          // just-saved product visible in the admin list/shop during that gap.
          window.PRODUCTS_DATA = { ...fsData, ...pendingProducts };
          try { localStorage.setItem('vextro_products', JSON.stringify(window.PRODUCTS_DATA)); } catch(e) {}
        } else if (meta && meta.products && Object.keys(pendingProducts).length === 0) {
          window.PRODUCTS_DATA = {};
          try { localStorage.removeItem('vextro_products'); } catch(e) {}
        }
      }
    } catch(e) {}
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
  await deleteProductEverywhere(id);
  window._adminChangesMade = true;
  try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e) { console.error('Delete render error:', e); }
  if (window.filterShopProducts) window.filterShopProducts();
};

// ── PRODUCT FORM (shared for Add + Edit) ───────────────────────
const PRODUCT_CATEGORIES = ['Code Scripts','PHP Scripts','WordPress Plugins','SaaS Software','Tools & Software','eCommerce','Marketing','Automation','SEO','AdSense','UI Templates','Graphics','Other'];

async function saveProductCatalogMeta() {
  if (!window.fsSetDoc) return;
  try {
    await window.fsSetDoc('site_meta', 'products', {
      updatedAt: Date.now(),
      count: Object.keys(window.PRODUCTS_DATA || {}).length
    });
  } catch(e) {}
}

async function saveProductEverywhere(id, data) {
  // Firestore first — the media-splitter stores heavy base64 images
  // as separate `product_media` docs so the main product doc stays
  // under 1 MB and each product can carry up to ~5 MB total media.
  if (window.fsSaveProductWithMedia) {
    await window.fsSaveProductWithMedia(id, data);
  } else if (window.fsSetDoc) {
    await window.fsSetDoc('products', id, data);
  } else if (window.vextroSave) {
    await window.vextroSave('products', { ...(window.PRODUCTS_DATA||{}), [id]: data });
  }
  window.PRODUCTS_DATA = window.PRODUCTS_DATA || {};
  window.PRODUCTS_DATA[id] = data;
  window.__pendingProductSaves = window.__pendingProductSaves || {};
  window.__pendingProductSaves[id] = data;
  try { localStorage.setItem('vextro_products', JSON.stringify(window.PRODUCTS_DATA)); } catch(e) {}
  await saveProductCatalogMeta();
}

async function deleteProductEverywhere(id) {
  if (window.PRODUCTS_DATA && window.PRODUCTS_DATA[id]) delete window.PRODUCTS_DATA[id];
  if (window.__pendingProductSaves && window.__pendingProductSaves[id]) delete window.__pendingProductSaves[id];
  try { localStorage.setItem('vextro_products', JSON.stringify(window.PRODUCTS_DATA || {})); } catch(e) {}
  if (window.fsDeleteProductWithMedia) await window.fsDeleteProductWithMedia(id);
  else if (window.fsDeleteDoc) await window.fsDeleteDoc('products', id);
  else if (window.vextroSave) await window.vextroSave('products', window.PRODUCTS_DATA || {});
  await saveProductCatalogMeta();
}

function buildProductForm(p) {
  const IS = adminInputStyle(), LS = adminLabelStyle();
  p = p || {};
  const catOpts = PRODUCT_CATEGORIES.map(c => `<option ${p.category===c?'selected':''}>${c}</option>`).join('');
  const gallery = Array.isArray(p.gallery) ? p.gallery.slice() : (p.image ? [p.image] : []);
  const fakeReviews = Array.isArray(p.fakeReviews) ? p.fakeReviews.slice() : [];
  const features = Array.isArray(p.features) ? p.features : (p.features?[p.features]:[]);
  return {
    html: `
    <h3 style="margin:0 0 20px;font-size:1.3rem;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;color:#0f172a;">${p.id?'Edit Product':'Add New Product'}</h3>
    <div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;padding-right:8px;">

      <div><label style="${LS}">Product Title *</label><input id="pfTitle" value="${(p.title||'').replace(/"/g,'&quot;')}" style="${IS}" placeholder="Enter product name"></div>

      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:140px;"><label style="${LS}">Price (USD) *</label><input id="pfPrice" type="number" step="0.01" value="${p.price||''}" style="${IS}" placeholder="0.00"></div>
        <div style="flex:1;min-width:140px;"><label style="${LS}">Old Price</label><input id="pfOldPrice" type="number" step="0.01" value="${p.oldPrice||''}" style="${IS}" placeholder="0.00"></div>
        <div style="flex:1;min-width:140px;"><label style="${LS}">Discount Label</label><input id="pfDiscount" value="${(p.discount||'').replace(/"/g,'&quot;')}" style="${IS}" placeholder="-50%"></div>
      </div>

      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;"><label style="${LS}">Category *</label><select id="pfCat" style="${IS}">${catOpts}</select></div>
        <div style="flex:1;min-width:180px;"><label style="${LS}">Live Demo URL</label><input id="pfDemo" value="${(p.demoUrl&&p.demoUrl!=='#'?p.demoUrl:'').replace(/"/g,'&quot;')}" style="${IS}" placeholder="https://demo.example.com"></div>
      </div>

      <div><label style="${LS}">WhatsApp Buy Message</label><input id="pfWa" value="${(p.whatsappMsg||'').replace(/"/g,'&quot;')}" style="${IS}" placeholder="Hi! I want to buy ..."></div>

      <div><label style="${LS}">Short Description</label><textarea id="pfShort" rows="2" style="${IS}" placeholder="Brief description for product card...">${p.shortDesc||''}</textarea></div>

      <div>
        <label style="${LS}">Full Description (supports inline images)</label>
        <textarea id="pfLong" rows="5" style="${IS}" placeholder="Detailed description. Click 'Add Image' to insert product images inline.">${p.longDesc||''}</textarea>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;align-items:center;">
          <label style="padding:8px 14px;background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:8px;cursor:pointer;font-size:0.8rem;color:#ff6b35;font-weight:600;"><i class="fa-solid fa-image"></i> Add Image to Description<input type="file" id="pfLongImg" accept="image/*" multiple style="display:none;"></label>
          <span id="pfLongImgStatus" style="color:#94a3b8;font-size:0.75rem;">Images auto-compressed for cloud save</span>
        </div>
      </div>

      <div><label style="${LS}">Features (comma-separated)</label><textarea id="pfFeatures" rows="3" style="${IS}" placeholder="Responsive Design, Full Source Code, 1 Year Support">${features.join(', ')}</textarea></div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
        <label style="${LS}">Product Images (unlimited — first = main image)</label>
        <div id="pfGallery" style="display:flex;flex-wrap:wrap;gap:10px;margin:10px 0;"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="pfImgUrl" style="${IS};flex:1;min-width:180px;" placeholder="Paste image URL and press Add">
          <button type="button" id="pfImgUrlAdd" style="padding:10px 16px;background:#0f172a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Add URL</button>
          <label style="padding:10px 16px;background:#ff6b35;color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-solid fa-upload"></i> Upload Files<input type="file" id="pfImgFiles" accept="image/*" multiple style="display:none;"></label>
        </div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;">
        <div style="font-weight:700;color:#9a3412;margin-bottom:10px;font-size:0.9rem;"><i class="fa-solid fa-wand-magic-sparkles"></i> Fake Stats (Display Only)</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;"><label style="${LS}">Fake Views Bonus</label><input id="pfFakeViews" type="number" value="${p.fakeViewsBonus||0}" style="${IS}" placeholder="0"></div>
          <div style="flex:1;min-width:120px;"><label style="${LS}">Sold Count</label><input id="pfSold" type="number" value="${p.sold||0}" style="${IS}" placeholder="0"></div>
          <div style="flex:1;min-width:120px;"><label style="${LS}">Rating (1-5)</label><input id="pfRating" type="number" step="0.1" min="0" max="5" value="${p.rating||5}" style="${IS}"></div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #fed7aa;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <input type="checkbox" id="pfBestSeller" ${p.badge?'checked':''} style="width:18px;height:18px;accent-color:#10b981;cursor:pointer;">
            <span style="font-weight:700;color:#065f46;font-size:0.9rem;"><i class="fa-solid fa-award" style="color:#10b981;"></i> Show "Best Seller" badge on product</span>
          </label>
          <input id="pfBadgeText" value="${(p.badge||'Best Seller').replace(/"/g,'&quot;')}" style="${IS};flex:1;min-width:160px;max-width:220px;padding:8px 12px;font-size:0.85rem;" placeholder="Badge text (e.g. Best Seller)">
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #fed7aa;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <input type="checkbox" id="pfIsPopular" ${p.isPopular?'checked':''} style="width:18px;height:18px;accent-color:#f59e0b;cursor:pointer;">
            <span style="font-weight:700;color:#9a3412;font-size:0.9rem;"><i class="fa-solid fa-fire" style="color:#f59e0b;"></i> Show in "Popular Products" section</span>
          </label>
        </div>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div style="font-weight:700;color:#1e40af;font-size:0.9rem;"><i class="fa-solid fa-star"></i> Fake Reviews</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <input id="pfAiQty" type="number" min="1" max="20" value="5" title="How many reviews to generate" style="${IS};width:60px;padding:6px 8px;font-size:0.8rem;">
            <button type="button" id="pfAiGen" style="padding:6px 12px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Generate</button>
            <button type="button" id="pfAiKey" title="Set Google AI API Key" style="padding:6px 10px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:0.78rem;"><i class="fa-solid fa-key"></i></button>
            <button type="button" id="pfAddReview" style="padding:6px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">+ Add</button>
          </div>
        </div>
        <div id="pfAiStatus" style="font-size:0.75rem;color:#64748b;margin-bottom:8px;display:none;"></div>
        <div id="pfReviews" style="display:flex;flex-direction:column;gap:8px;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:6px;position:sticky;bottom:0;background:#fff;padding-top:12px;flex-wrap:wrap;">
        <div id="pfSizeInfo" style="font-size:0.75rem;color:#64748b;"><i class="fa-solid fa-database"></i> <span id="pfSizeVal">0 KB</span> / 5 MB total media (each image ≤ 950 KB)</div>
        <div style="display:flex;gap:12px;">
          <button id="pfCancel" style="padding:10px 20px;background:#f1f5f9;border:1px solid rgba(15,23,42,0.08);border-radius:8px;color:#0f172a;cursor:pointer;font-weight:600;">Cancel</button>
          <button id="pfSave" style="padding:10px 22px;background:#ff6b35;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:700;">${p.id?'Save Changes':'Save Product'}</button>
        </div>
      </div>
    </div>`,
    state: { gallery, fakeReviews }
  };
}

function wireProductForm(ov, state, existing, onSave) {
  const IS = adminInputStyle();
  function renderGallery() {
    const el = document.getElementById('pfGallery');
    if (!el) return;
    if (state.gallery.length === 0) { el.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;padding:8px;">No images yet — add at least one.</div>'; return; }
    el.innerHTML = state.gallery.map((src, i) => `
      <div style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid ${i===0?'#ff6b35':'#e2e8f0'};">
        <img src="${src}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://via.placeholder.com/100?text=X'">
        ${i===0?'<div style="position:absolute;top:2px;left:2px;background:#ff6b35;color:#fff;font-size:0.6rem;padding:2px 5px;border-radius:4px;font-weight:700;">MAIN</div>':''}
        <button type="button" data-i="${i}" class="pfImgDel" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,0.9);color:#fff;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:0.75rem;">×</button>
        ${i>0?`<button type="button" data-i="${i}" class="pfImgMain" style="position:absolute;bottom:2px;left:2px;background:rgba(15,23,42,0.75);color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:0.6rem;">Set Main</button>`:''}
      </div>`).join('');
    el.querySelectorAll('.pfImgDel').forEach(b => b.onclick = () => { state.gallery.splice(+b.dataset.i,1); renderGallery(); if (typeof updateSizeInfo==='function') updateSizeInfo(); });
    el.querySelectorAll('.pfImgMain').forEach(b => b.onclick = () => { const i=+b.dataset.i; const [x]=state.gallery.splice(i,1); state.gallery.unshift(x); renderGallery(); });
  }
  renderGallery();

  document.getElementById('pfImgUrlAdd').onclick = () => {
    const v = document.getElementById('pfImgUrl').value.trim();
    if (!v) return;
    state.gallery.push(v);
    document.getElementById('pfImgUrl').value = '';
    renderGallery();
  };
  document.getElementById('pfImgFiles').onchange = async function() {
    const files = Array.from(this.files||[]);
    this.value = '';
    for (const f of files) {
      try {
        const dataUrl = await window.adminCompressImage(f, 1100, 0.72);
        state.gallery.push(dataUrl);
        renderGallery();
        updateSizeInfo();
      } catch(e) { console.warn('compress failed', e); }
    }
  };
  document.getElementById('pfLongImg').onchange = async function() {
    const files = Array.from(this.files||[]);
    this.value = '';
    const status = document.getElementById('pfLongImgStatus');
    const ta = document.getElementById('pfLong');
    for (const f of files) {
      if (status) status.textContent = 'Compressing ' + f.name + '...';
      try {
        // Aggressive compression for description-embedded images so multiple images fit in the 1MB Firestore doc.
        const dataUrl = await window.adminCompressImage(f, 800, 0.65);
        ta.value = (ta.value ? ta.value + '\n\n' : '') + `<img src="${dataUrl}" style="max-width:100%;border-radius:10px;margin:10px 0;" alt="">`;
        updateSizeInfo();
      } catch(e) { console.warn('desc image failed', e); }
    }
    if (status) status.textContent = 'Images auto-compressed for cloud save';
  };

  // Live size indicator — total media (gallery + inline desc images)
  // is now split across separate Firestore docs; overall budget = 5 MB.
  function updateSizeInfo() {
    const el = document.getElementById('pfSizeVal'); if (!el) return;
    const longV = (document.getElementById('pfLong')||{}).value || '';
    const bytes = new Blob([JSON.stringify(state.gallery) + longV]).size;
    const kb = Math.round(bytes/1024);
    el.textContent = kb < 1024 ? (kb + ' KB') : ((kb/1024).toFixed(2) + ' MB');
    const parent = document.getElementById('pfSizeInfo');
    const MB5 = 5 * 1024;
    if (parent) parent.style.color = kb > MB5 ? '#dc2626' : (kb > MB5 * 0.8 ? '#ea580c' : '#64748b');
  }
  const longTa = document.getElementById('pfLong'); if (longTa) longTa.addEventListener('input', updateSizeInfo);
  updateSizeInfo();

  function renderReviews() {
    const el = document.getElementById('pfReviews');
    if (!el) return;
    if (state.fakeReviews.length === 0) { el.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;">No fake reviews. Click + Add Review.</div>'; return; }
    el.innerHTML = state.fakeReviews.map((r, i) => `
      <div style="background:#fff;border:1px solid #dbeafe;border-radius:8px;padding:10px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;">
          <input data-i="${i}" data-k="name" class="pfRv" value="${(r.name||'').replace(/"/g,'&quot;')}" placeholder="Reviewer name" style="${IS};flex:1;min-width:120px;padding:6px 10px;font-size:0.85rem;">
          <select data-i="${i}" data-k="rating" class="pfRv" style="${IS};padding:6px 10px;width:auto;font-size:0.85rem;">
            ${[5,4,3,2,1].map(n=>`<option value="${n}" ${(r.rating||5)===n?'selected':''}>${'★'.repeat(n)}${'☆'.repeat(5-n)}</option>`).join('')}
          </select>
          <button type="button" data-i="${i}" class="pfRvDel" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:5px 9px;border-radius:6px;cursor:pointer;font-size:0.75rem;">×</button>
        </div>
        <textarea data-i="${i}" data-k="text" class="pfRv" rows="2" placeholder="Review text" style="${IS};font-size:0.85rem;padding:6px 10px;">${r.text||''}</textarea>
      </div>`).join('');
    el.querySelectorAll('.pfRv').forEach(inp => {
      inp.oninput = () => { const i=+inp.dataset.i, k=inp.dataset.k; state.fakeReviews[i][k] = k==='rating'?+inp.value:inp.value; };
    });
    el.querySelectorAll('.pfRvDel').forEach(b => b.onclick = () => { state.fakeReviews.splice(+b.dataset.i,1); renderReviews(); });
  }
  renderReviews();
  document.getElementById('pfAddReview').onclick = () => {
    state.fakeReviews.push({ name:'', rating:5, text:'', date:new Date().toISOString() });
    renderReviews();
  };

  // === AI Review Generator (Google Gemini) ===
  const AI_KEY_STORE = 'vextro_gemini_key';
  const getAiKey = () => { try { return localStorage.getItem(AI_KEY_STORE) || ''; } catch(e) { return ''; } };
  const setAiStatus = (msg, color) => {
    const s = document.getElementById('pfAiStatus');
    if (!s) return;
    if (!msg) { s.style.display = 'none'; return; }
    s.style.display = 'block'; s.textContent = msg; s.style.color = color || '#64748b';
  };
  document.getElementById('pfAiKey').onclick = () => {
    const cur = getAiKey();
    const k = prompt('Enter Google AI Studio API Key (stored locally in your browser only):', cur);
    if (k === null) return;
    try { localStorage.setItem(AI_KEY_STORE, k.trim()); } catch(e) {}
    setAiStatus(k.trim() ? 'API key saved ✓' : 'API key cleared', '#059669');
    setTimeout(() => setAiStatus(''), 2500);
  };
  document.getElementById('pfAiGen').onclick = async () => {
    let key = getAiKey();
    if (!key) {
      key = (prompt('Enter your Google AI Studio API Key (get free key from https://aistudio.google.com/apikey):') || '').trim();
      if (!key) return;
      try { localStorage.setItem(AI_KEY_STORE, key); } catch(e) {}
    }
    const qty = Math.max(1, Math.min(20, parseInt(document.getElementById('pfAiQty').value) || 5));
    const title = (document.getElementById('pfTitle')||{}).value || '';
    const category = (document.getElementById('pfCategory')||{}).value || '';
    const shortDesc = (document.getElementById('pfShort')||{}).value || '';
    const longDesc = ((document.getElementById('pfLong')||{}).value || '').replace(/<[^>]+>/g,' ').slice(0,600);
    if (!title.trim()) { alert('Please fill product title first — AI needs context to write relevant reviews.'); return; }

    const btn = document.getElementById('pfAiGen');
    btn.disabled = true; const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    setAiStatus('Contacting Google AI...', '#2563eb');

    const prompt_text = `You are generating realistic customer reviews for an online product.
Product Title: ${title}
Category: ${category}
Short Description: ${shortDesc}
Details: ${longDesc}

Generate exactly ${qty} authentic-sounding customer reviews in JSON. Rules:
- Mix of ratings: mostly 5 and 4 stars, occasional 3-star
- Diverse international first-name+last-initial reviewer names (e.g. "Ahmed K.", "Sarah M.", "Ravi P.")
- Reviews must mention specifics from the product (features, use-case, quality)
- Vary length: some short (1 sentence), some medium (2-3 sentences)
- Natural tone, no marketing jargon, occasional minor typos ok
- Return ONLY a JSON array, no markdown, no code fence, no commentary.
Format: [{"name":"...","rating":5,"text":"..."}]`;

    try {
    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest'];
    const callModel = async (model) => {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key);
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt_text }] }],
          generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
        })
      });
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    try {
      let res, lastErr = '', usedModel = '';
      outer: for (const model of models) {
        for (let attempt = 0; attempt < 3; attempt++) {
          setAiStatus('Contacting AI (' + model + ')' + (attempt ? ' — retry ' + attempt : '') + '...', '#2563eb');
          res = await callModel(model);
          if (res.ok) { usedModel = model; break outer; }
          const errText = await res.text();
          lastErr = 'API ' + res.status + ': ' + errText.slice(0, 300);
          if (res.status === 429) {
            // parse retryDelay if present
            let waitMs = 4000 * (attempt + 1);
            const m = errText.match(/"retryDelay"\s*:\s*"(\d+)s"/);
            if (m) waitMs = Math.min(30000, (parseInt(m[1]) + 1) * 1000);
            if (attempt < 2) { await sleep(waitMs); continue; }
            break; // try next model
          }
          if (res.status === 401 || res.status === 403) break outer; // bad key, no point
          break; // other error, try next model
        }
      }
      if (!res || !res.ok) {
        if (String(lastErr).includes('429')) {
          throw new Error('Rate limit / quota exceeded on all models. Free Gemini tier allows ~15 requests per minute and ~1500 per day. Please wait a minute and try again, generate fewer reviews at a time, or use a different API key.');
        }
        throw new Error(lastErr || 'AI request failed');
      }
      const data = await res.json();
      let txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      txt = txt.trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
      let arr;
      try { arr = JSON.parse(txt); } catch(e) {
        const m = txt.match(/\[[\s\S]*\]/); if (m) arr = JSON.parse(m[0]);
      }
      if (!Array.isArray(arr) || arr.length === 0) throw new Error('AI returned no reviews');

      const now = Date.now();
      arr.forEach((r, i) => {
        state.fakeReviews.push({
          name: String(r.name||'Customer').slice(0,60),
          rating: Math.max(1, Math.min(5, parseInt(r.rating)||5)),
          text: String(r.text||'').slice(0,600),
          date: new Date(now - i*86400000*Math.floor(Math.random()*30+1)).toISOString()
        });
      });
      renderReviews();
      setAiStatus('✓ Generated ' + arr.length + ' reviews via ' + usedModel, '#059669');
      setTimeout(() => setAiStatus(''), 3500);
    } catch(e) {
      console.error('AI gen failed', e);
      setAiStatus('Error: ' + e.message, '#dc2626');
      if (String(e.message).includes('API_KEY') || String(e.message).includes('401') || String(e.message).includes('403')) {
        try { localStorage.removeItem(AI_KEY_STORE); } catch(_) {}
        alert('API key invalid or expired. Click the key icon to enter a new one.');
      }
    } finally {
      btn.disabled = false; btn.innerHTML = orig;
    }
  };


  document.getElementById('pfCancel').onclick = () => ov.remove();
  document.getElementById('pfSave').onclick = async () => {
    try {
      const title = document.getElementById('pfTitle').value.trim();
      const price = parseFloat(document.getElementById('pfPrice').value);
      if (!title || isNaN(price)) return alert('Title and price are required');
      if (state.gallery.length === 0) return alert('Add at least one product image');
      let longDescVal = document.getElementById('pfLong').value;
      // Per-product total media budget = 5 MB (heavy images are stored
      // in the separate `product_media` collection, so the main doc
      // stays small; splitter also rejects any single image > 950 KB).
      const estBytes = new Blob([JSON.stringify(state.gallery) + longDescVal + JSON.stringify(state.fakeReviews)]).size;
      if (estBytes > 5 * 1024 * 1024) {
        const mb = (estBytes/1024/1024).toFixed(2);
        return alert(`Product media is too large (${mb} MB). Total budget per product is 5 MB.\n\nFix:\n• Remove a few gallery images, or\n• Remove some images from the description.`);
      }
      const btn = document.getElementById('pfSave'); btn.innerText='Saving...'; btn.disabled=true;
      const cleanReviews = state.fakeReviews.filter(r => r.name && r.text).map(r => ({ ...r, date: r.date || new Date().toISOString() }));
      const data = {
        ...(existing||{}),
        title, price,
        oldPrice: parseFloat(document.getElementById('pfOldPrice').value)||0,
        discount: document.getElementById('pfDiscount').value.trim(),
        category: document.getElementById('pfCat').value,
        demoUrl: document.getElementById('pfDemo').value.trim() || '#',
        whatsappMsg: document.getElementById('pfWa').value.trim() || `Hi! I want to buy ${title} for USD ${price}. Please guide me.`,
        shortDesc: document.getElementById('pfShort').value.trim(),
        longDesc: longDescVal,
        features: document.getElementById('pfFeatures').value.split(',').map(s=>s.trim()).filter(Boolean),
        image: state.gallery[0],
        gallery: state.gallery.slice(),
        fakeViewsBonus: parseInt(document.getElementById('pfFakeViews').value)||0,
        sold: parseInt(document.getElementById('pfSold').value)||0,
        rating: parseFloat(document.getElementById('pfRating').value)||5,
        reviews: cleanReviews.length,
        fakeReviews: cleanReviews,
        badge: (document.getElementById('pfBestSeller')||{}).checked ? ((document.getElementById('pfBadgeText').value||'Best Seller').trim() || 'Best Seller') : '',
        isPopular: !!(document.getElementById('pfIsPopular')||{}).checked
      };
      try {
        await onSave(data);
      } catch(err) {
        console.error(err);
        alert('Save failed: ' + err.message);
        btn.innerText='Save Product'; btn.disabled=false;
      }
    } catch(e) { console.error(e); alert('Error: '+e.message); }
  };
}

window.adminEditProductNew = function(id) {
  const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[id] : null;
  if (!p) return alert('Product not found');
  const { html, state } = buildProductForm(p);
  adminModal(html, (ov) => {
    wireProductForm(ov, state, p, async (data) => {
      data.id = id;
      data.updatedAt = Date.now();
      await saveProductEverywhere(id, data);
      window._adminChangesMade = true;
      ov.remove();
      try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e){}
      if (window.filterShopProducts) window.filterShopProducts();
    });
  });
};

window.adminAddProductNew = function() {
  const { html, state } = buildProductForm({});
  adminModal(html, (ov) => {
    wireProductForm(ov, state, null, async (data) => {
      const newId = 'p' + Date.now();
      data.id = newId;
      data.createdAt = Date.now();
      data.updatedAt = data.createdAt;
      await saveProductEverywhere(newId, data);
      window._adminChangesMade = true;
      ov.remove();
      try { await showAdminView('products', document.querySelector('.admin-sidebar-item[data-view="products"]')); } catch(e){}
      if (window.filterShopProducts) window.filterShopProducts();
    });
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




// ============ ORDERS SYSTEM ============
// Payment gateway abhi disabled hai (koi bank account nahi). Yeh system manual/WhatsApp orders,
// invoice generation, aur status tracking ke liye ready hai. Jab bhi bank account milega,
// bas payment gateway wire karna hoga — baaki sab wired hai.
window.__adminOrdersCache = window.__adminOrdersCache || {};
window.__adminOrdersFilter = window.__adminOrdersFilter || { status: 'all', search: '', sort: 'date-desc' };

async function loadOrdersMap() {
  let map = {};
  if (window.fsLoadMap) { try { map = (await window.fsLoadMap('orders')) || {}; } catch(e) {} }
  if (!map || Object.keys(map).length === 0) {
    try { map = JSON.parse(localStorage.getItem('admin_orders') || '{}'); } catch(e) { map = {}; }
  }
  return map;
}
async function saveOrder(o) {
  window.__adminOrdersCache[o.id] = o;
  try { localStorage.setItem('admin_orders', JSON.stringify(window.__adminOrdersCache)); } catch(e) {}
  if (window.fsSetDoc) { try { await window.fsSetDoc('orders', o.id, o); } catch(e) {} }
}
async function deleteOrder(id) {
  delete window.__adminOrdersCache[id];
  try { localStorage.setItem('admin_orders', JSON.stringify(window.__adminOrdersCache)); } catch(e) {}
  if (window.fsDeleteDoc) { try { await window.fsDeleteDoc('orders', id); } catch(e) {} }
}
function orderStatusBadge(s) {
  const map = {
    pending:    ['admin-badge-yellow', 'Pending'],
    processing: ['admin-badge-blue',   'Processing'],
    completed:  ['admin-badge-green',  'Completed'],
    delivered:  ['admin-badge-green',  'Delivered'],
    cancelled:  ['admin-badge-red',    'Cancelled'],
    refunded:   ['admin-badge-red',    'Refunded'],
  };
  const [cls, label] = map[s] || ['admin-badge-yellow', s || 'Pending'];
  return `<span class="admin-badge ${cls}">${label}</span>`;
}
function paymentStatusBadge(s) {
  const map = {
    unpaid:   ['admin-badge-red',    'Unpaid'],
    partial:  ['admin-badge-yellow', 'Partial (50%)'],
    paid:     ['admin-badge-green',  'Paid'],
    refunded: ['admin-badge-red',    'Refunded'],
  };
  const [cls, label] = map[s] || ['admin-badge-red', s || 'Unpaid'];
  return `<span class="admin-badge ${cls}">${label}</span>`;
}
function fmtMoney(n) { const v = Number(n||0); return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
function fmtDate(ts) { if (!ts) return '-'; try { return new Date(ts).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch(e) { return '-'; } }

async function renderAdminOrdersNew(container) {
  container.innerHTML = `<div class="admin-panel-card"><div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading orders…</p></div></div>`;
  try {
    const map = await loadOrdersMap();
    window.__adminOrdersCache = map;
    renderOrdersUI(container);
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error loading orders</p></div>`;
  }
}

function renderOrdersUI(container) {
  const map = window.__adminOrdersCache || {};
  const f = window.__adminOrdersFilter;
  let list = Object.values(map);

  // Stats
  const totalRevenue = list.filter(o => o.paymentStatus === 'paid').reduce((s,o) => s + Number(o.amount||0), 0);
  const pendingRevenue = list.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled' && o.status !== 'refunded').reduce((s,o) => s + Number(o.amount||0), 0);
  const countPending = list.filter(o => o.status === 'pending').length;
  const countProcessing = list.filter(o => o.status === 'processing').length;
  const countCompleted = list.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const countCancelled = list.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;

  // Filter
  if (f.status !== 'all') list = list.filter(o => o.status === f.status);
  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter(o =>
      (o.id||'').toLowerCase().includes(q) ||
      (o.buyerName||'').toLowerCase().includes(q) ||
      (o.buyerEmail||'').toLowerCase().includes(q) ||
      (o.service||'').toLowerCase().includes(q)
    );
  }
  // Sort
  list.sort((a,b) => {
    if (f.sort === 'date-asc')   return (a.createdAt||0) - (b.createdAt||0);
    if (f.sort === 'amount-desc') return Number(b.amount||0) - Number(a.amount||0);
    if (f.sort === 'amount-asc')  return Number(a.amount||0) - Number(b.amount||0);
    return (b.createdAt||0) - (a.createdAt||0); // date-desc default
  });

  const statCard = (label, val, icon, grad) => `
    <div class="admin-stat-card" style="background:${grad};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div style="opacity:0.85;font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${label}</div>
        <i class="${icon}" style="font-size:1.2rem;opacity:0.6;"></i>
      </div>
      <div style="font-size:1.6rem;font-weight:800;">${val}</div>
    </div>`;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
      ${statCard('Total Revenue', fmtMoney(totalRevenue), 'fa-solid fa-sack-dollar', 'linear-gradient(135deg,#10b981,#059669)')}
      ${statCard('Pending Revenue', fmtMoney(pendingRevenue), 'fa-solid fa-hourglass-half', 'linear-gradient(135deg,#f59e0b,#d97706)')}
      ${statCard('Pending Orders', countPending, 'fa-solid fa-clock', 'linear-gradient(135deg,#3b82f6,#2563eb)')}
      ${statCard('Processing', countProcessing, 'fa-solid fa-gears', 'linear-gradient(135deg,#8b5cf6,#7c3aed)')}
      ${statCard('Completed', countCompleted, 'fa-solid fa-circle-check', 'linear-gradient(135deg,#ff6b35,#f7931e)')}
      ${statCard('Cancelled', countCancelled, 'fa-solid fa-ban', 'linear-gradient(135deg,#ef4444,#dc2626)')}
    </div>

    <div class="admin-panel-card">
      <div style="padding:18px 20px;border-bottom:1px solid rgba(15,23,42,0.08);display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
        <input id="ordSearch" type="text" placeholder="Search order ID, buyer, email…" value="${f.search||''}"
          style="flex:1;min-width:200px;padding:10px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;outline:none;font-size:0.88rem;">
        <select id="ordStatusFilter" style="padding:10px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;font-weight:600;font-size:0.85rem;">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select id="ordSort" style="padding:10px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;font-weight:600;font-size:0.85rem;">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount: High → Low</option>
          <option value="amount-asc">Amount: Low → High</option>
        </select>
        <button onclick="adminExportOrders()" style="padding:10px 14px;background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);border-radius:10px;font-weight:700;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-download"></i> Export CSV</button>
        <button onclick="adminNewOrder()" style="padding:10px 18px;background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);font-size:0.85rem;"><i class="fa-solid fa-plus"></i> New Order</button>
      </div>

      ${list.length === 0 ? `
        <div class="admin-empty" style="padding:60px 20px;">
          <i class="fa-solid fa-receipt" style="font-size:3rem;color:#cbd5e1;"></i>
          <p style="font-weight:600;margin-top:12px;">${Object.keys(map).length === 0 ? 'No orders yet' : 'No orders match your filters'}</p>
          <p style="color:#94a3b8;font-size:0.85rem;margin-top:6px;">${Object.keys(map).length === 0 ? 'Manually add an order from WhatsApp/offline sales.' : 'Try clearing search or status filter.'}</p>
          ${Object.keys(map).length === 0 ? `<button onclick="adminNewOrder()" style="margin-top:16px;padding:10px 22px;background:#ff6b35;border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;">+ Add First Order</button>` : ''}
        </div>` : `
        <table class="admin-table">
          <thead><tr><th>Order</th><th>Buyer</th><th>Service</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>${list.map(o => `
            <tr>
              <td data-label="Order" style="font-weight:800;color:#ff6b35;">#${(o.id||'').slice(0,8).toUpperCase()}</td>
              <td data-label="Buyer">
                <div style="font-weight:600;color:#0f172a;">${escapeHtml(o.buyerName||'-')}</div>
                <div style="font-size:0.78rem;color:#94a3b8;">${escapeHtml(o.buyerEmail||o.buyerPhone||'')}</div>
              </td>
              <td data-label="Service" style="font-size:0.85rem;">${escapeHtml(o.service||'-')}</td>
              <td data-label="Amount" style="font-weight:700;color:#0f172a;">${fmtMoney(o.amount)}</td>
              <td data-label="Status">${orderStatusBadge(o.status)}</td>
              <td data-label="Payment">${paymentStatusBadge(o.paymentStatus)}</td>
              <td data-label="Date" style="font-size:0.8rem;color:#94a3b8;">${fmtDate(o.createdAt)}</td>
              <td data-label="Actions" style="text-align:right;">
                <div style="display:inline-flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                  <button onclick="adminViewOrder('${o.id}')" title="View" style="background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);padding:7px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-eye"></i></button>
                  <button onclick="adminInvoiceOrder('${o.id}')" title="Invoice" style="background:rgba(139,92,246,0.1);color:#8b5cf6;border:1px solid rgba(139,92,246,0.25);padding:7px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-file-invoice"></i></button>
                  <button onclick="adminDeleteOrder('${o.id}')" title="Delete" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:7px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.78rem;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </td>
            </tr>`).join('')}</tbody>
        </table>`}
    </div>

    <div style="margin-top:16px;padding:14px 18px;background:rgba(59,130,246,0.06);border:1px dashed rgba(59,130,246,0.3);border-radius:12px;color:#1e40af;font-size:0.82rem;">
      <i class="fa-solid fa-circle-info"></i> <b>Payment Gateway Disabled:</b> Abhi automatic online payment nahi jud raha. Jab bank account setup ho jaye, Stripe/JazzCash/Easypaisa gateway wire karva lena — abhi ke liye WhatsApp/offline orders manually add karo.
    </div>
  `;

  // Bind events
  const search = document.getElementById('ordSearch');
  if (search) {
    let tId; search.oninput = (e) => { clearTimeout(tId); tId = setTimeout(() => { window.__adminOrdersFilter.search = e.target.value.trim(); renderOrdersUI(container); }, 250); };
  }
  const st = document.getElementById('ordStatusFilter'); if (st) { st.value = f.status; st.onchange = (e) => { window.__adminOrdersFilter.status = e.target.value; renderOrdersUI(container); }; }
  const sr = document.getElementById('ordSort'); if (sr) { sr.value = f.sort; sr.onchange = (e) => { window.__adminOrdersFilter.sort = e.target.value; renderOrdersUI(container); }; }
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// ---- New / Edit Order Modal ----
window.adminNewOrder = function() { openOrderForm(null); };
window.adminViewOrder = function(id) { openOrderForm(window.__adminOrdersCache[id]); };

function openOrderForm(existing) {
  const o = existing || {
    id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    createdAt: Date.now(),
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: '',
    currency: 'USD',
    notes: '',
    deliverables: '',
    amountPaid: 0,
  };
  const isNew = !existing;
  const inp = 'width:100%;padding:11px 14px;background:#f8fafc;border:1px solid rgba(15,23,42,0.12);border-radius:8px;color:#0f172a;outline:none;font-size:0.9rem;box-sizing:border-box;font-family:inherit;';
  const lbl = 'display:block;font-size:0.78rem;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;';

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:14px;">
      <div>
        <h3 style="margin:0;font-size:1.3rem;color:#0f172a;">${isNew ? 'New Order' : 'Order #' + (o.id||'').slice(0,8).toUpperCase()}</h3>
        <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">${fmtDate(o.createdAt)}</div>
      </div>
      <button onclick="closeAdminOverlay()" style="background:transparent;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;">&times;</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${lbl}">Buyer Name *</label><input id="of_buyerName" style="${inp}" value="${escapeHtml(o.buyerName||'')}"></div>
      <div><label style="${lbl}">Buyer Email</label><input id="of_buyerEmail" type="email" style="${inp}" value="${escapeHtml(o.buyerEmail||'')}"></div>
      <div><label style="${lbl}">Buyer Phone / WhatsApp</label><input id="of_buyerPhone" style="${inp}" value="${escapeHtml(o.buyerPhone||'')}"></div>
      <div><label style="${lbl}">Service *</label>
        <select id="of_service" style="${inp}">
          ${['Web Development','Custom Software / SaaS','AI Automation','SEO','Google Ads','Facebook & Instagram Ads','Social Media Management','Graphic Design & Branding','Other'].map(s => `<option value="${s}" ${o.service===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div><label style="${lbl}">Package / Plan</label><input id="of_package" placeholder="Starter / Professional / Custom" style="${inp}" value="${escapeHtml(o.package||'')}"></div>
      <div><label style="${lbl}">Amount *</label>
        <div style="display:flex;gap:8px;">
          <select id="of_currency" style="${inp};width:90px;flex:0 0 90px;">
            ${['USD','PKR','EUR','GBP'].map(c => `<option value="${c}" ${o.currency===c?'selected':''}>${c}</option>`).join('')}
          </select>
          <input id="of_amount" type="number" min="0" step="0.01" style="${inp}" value="${o.amount||''}">
        </div>
      </div>
      <div><label style="${lbl}">Order Status</label>
        <select id="of_status" style="${inp}">
          ${['pending','processing','completed','delivered','cancelled','refunded'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div><label style="${lbl}">Payment Status</label>
        <select id="of_paymentStatus" style="${inp}">
          ${['unpaid','partial','paid','refunded'].map(s => `<option value="${s}" ${o.paymentStatus===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div><label style="${lbl}">Payment Method</label>
        <select id="of_paymentMethod" style="${inp}">
          ${['','Bank Transfer','Easypaisa','JazzCash','PayPal','Stripe','Wise','Cash','Other'].map(s => `<option value="${s}" ${o.paymentMethod===s?'selected':''}>${s||'— select —'}</option>`).join('')}
        </select>
      </div>
      <div><label style="${lbl}">Amount Received</label><input id="of_amountPaid" type="number" min="0" step="0.01" style="${inp}" value="${o.amountPaid||0}"></div>
      <div><label style="${lbl}">Delivery Deadline</label><input id="of_deadline" type="date" style="${inp}" value="${o.deadline ? new Date(o.deadline).toISOString().slice(0,10) : ''}"></div>
      <div><label style="${lbl}">Transaction / Reference #</label><input id="of_txn" style="${inp}" value="${escapeHtml(o.txn||'')}"></div>
    </div>

    <div style="margin-bottom:14px;">
      <label style="${lbl}">Deliverables / Scope</label>
      <textarea id="of_deliverables" rows="3" style="${inp};resize:vertical;">${escapeHtml(o.deliverables||'')}</textarea>
    </div>
    <div style="margin-bottom:20px;">
      <label style="${lbl}">Internal Notes</label>
      <textarea id="of_notes" rows="2" style="${inp};resize:vertical;">${escapeHtml(o.notes||'')}</textarea>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid rgba(15,23,42,0.08);padding-top:16px;">
      ${!isNew ? `<button onclick="adminInvoiceOrder('${o.id}')" style="padding:11px 18px;background:rgba(139,92,246,0.1);color:#8b5cf6;border:1px solid rgba(139,92,246,0.25);border-radius:10px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-file-invoice"></i> Invoice</button>` : ''}
      ${!isNew && o.buyerPhone ? `<a href="https://wa.me/${(o.buyerPhone||'').replace(/[^0-9]/g,'')}" target="_blank" style="padding:11px 18px;background:rgba(37,211,102,0.1);color:#25D366;border:1px solid rgba(37,211,102,0.3);border-radius:10px;font-weight:700;text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
      <button onclick="closeAdminOverlay()" style="padding:11px 18px;background:#f1f5f9;color:#475569;border:1px solid rgba(15,23,42,0.12);border-radius:10px;font-weight:700;cursor:pointer;">Cancel</button>
      <button onclick="adminSaveOrder('${o.id}',${isNew})" style="padding:11px 22px;background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);"><i class="fa-solid fa-check"></i> ${isNew ? 'Create Order' : 'Save Changes'}</button>
    </div>
  `;
  window.__editingOrder = o;
  showAdminOverlay(html);
}

window.adminSaveOrder = async function(id, isNew) {
  const g = (x) => document.getElementById(x);
  const base = window.__editingOrder || { id, createdAt: Date.now() };
  const buyerName = g('of_buyerName').value.trim();
  const amount = parseFloat(g('of_amount').value || '0');
  if (!buyerName) { alert('Buyer name required'); return; }
  if (!amount || amount < 0) { alert('Valid amount required'); return; }
  const deadlineStr = g('of_deadline').value;
  const o = {
    ...base,
    id,
    buyerName,
    buyerEmail: g('of_buyerEmail').value.trim(),
    buyerPhone: g('of_buyerPhone').value.trim(),
    service:    g('of_service').value,
    package:    g('of_package').value.trim(),
    currency:   g('of_currency').value,
    amount,
    status:         g('of_status').value,
    paymentStatus:  g('of_paymentStatus').value,
    paymentMethod:  g('of_paymentMethod').value,
    amountPaid:     parseFloat(g('of_amountPaid').value || '0'),
    deadline:       deadlineStr ? new Date(deadlineStr).getTime() : null,
    txn:            g('of_txn').value.trim(),
    deliverables:   g('of_deliverables').value.trim(),
    notes:          g('of_notes').value.trim(),
    updatedAt:      Date.now(),
  };
  if (isNew) o.createdAt = Date.now();
  await saveOrder(o);
  closeAdminOverlay();
  const content = document.getElementById('adminContent');
  if (content) renderAdminOrdersNew(content);
};

window.adminDeleteOrder = async function(id) {
  if (!confirm('Delete this order permanently?')) return;
  await deleteOrder(id);
  const content = document.getElementById('adminContent');
  if (content) renderAdminOrdersNew(content);
};

window.adminInvoiceOrder = function(id) {
  const o = window.__adminOrdersCache[id]; if (!o) return;
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) { alert('Popup blocked — allow popups to print invoice'); return; }
  const paid = Number(o.amountPaid||0), due = Math.max(0, Number(o.amount||0) - paid);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${o.id}</title>
    <style>
      *{box-sizing:border-box;font-family:'Inter','Segoe UI',sans-serif;}
      body{margin:0;padding:40px;color:#0f172a;background:#f8fafc;}
      .inv{max-width:760px;margin:0 auto;background:#fff;border-radius:14px;padding:44px;box-shadow:0 20px 50px rgba(15,23,42,0.08);}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ff6b35;padding-bottom:22px;margin-bottom:28px;}
      .brand{font-size:1.8rem;font-weight:800;color:#0f172a;}
      .brand span{color:#ff6b35;}
      .tag{color:#64748b;font-size:0.85rem;margin-top:4px;}
      .inv-title{text-align:right;}
      .inv-title h1{margin:0;color:#ff6b35;font-size:2rem;letter-spacing:2px;}
      .inv-title div{color:#64748b;font-size:0.85rem;margin-top:4px;}
      .row{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;}
      .lbl{font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:6px;}
      .val{font-size:0.95rem;color:#0f172a;font-weight:600;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{text-align:left;padding:12px 14px;background:#f1f5f9;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#64748b;}
      td{padding:14px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;}
      .totals{margin-left:auto;width:280px;}
      .totals div{display:flex;justify-content:space-between;padding:8px 0;font-size:0.9rem;}
      .totals .total{border-top:2px solid #0f172a;margin-top:8px;padding-top:14px;font-size:1.1rem;font-weight:800;color:#ff6b35;}
      .foot{margin-top:36px;padding-top:20px;border-top:1px dashed #e2e8f0;color:#94a3b8;font-size:0.8rem;text-align:center;}
      .stat{display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;}
      .paid{background:#dcfce7;color:#166534;}
      .unpaid{background:#fee2e2;color:#991b1b;}
      .partial{background:#fef3c7;color:#92400e;}
      @media print { body{background:#fff;padding:0;} .inv{box-shadow:none;} .noprint{display:none;} }
      .noprint{position:fixed;top:20px;right:20px;}
      .noprint button{padding:10px 22px;background:#ff6b35;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);}
    </style></head><body>
    <div class="noprint"><button onclick="window.print()">🖨 Print / Save PDF</button></div>
    <div class="inv">
      <div class="hdr">
        <div>
          <div class="brand">Vextro <span>Lyntra</span></div>
          <div class="tag">Digital Growth Studio</div>
          <div class="tag" style="margin-top:8px;">contact@vextrolyntra.com</div>
        </div>
        <div class="inv-title">
          <h1>INVOICE</h1>
          <div><b>#${(o.id||'').slice(0,10).toUpperCase()}</b></div>
          <div>${fmtDate(o.createdAt)}</div>
          <div style="margin-top:8px;"><span class="stat ${o.paymentStatus||'unpaid'}">${(o.paymentStatus||'unpaid').toUpperCase()}</span></div>
        </div>
      </div>
      <div class="row">
        <div>
          <div class="lbl">Billed To</div>
          <div class="val">${escapeHtml(o.buyerName||'-')}</div>
          <div style="color:#64748b;font-size:0.85rem;margin-top:4px;">${escapeHtml(o.buyerEmail||'')}</div>
          <div style="color:#64748b;font-size:0.85rem;">${escapeHtml(o.buyerPhone||'')}</div>
        </div>
        <div style="text-align:right;">
          <div class="lbl">Payment Method</div>
          <div class="val">${escapeHtml(o.paymentMethod||'Not specified')}</div>
          ${o.txn ? `<div style="color:#64748b;font-size:0.85rem;margin-top:4px;">Ref: ${escapeHtml(o.txn)}</div>` : ''}
          ${o.deadline ? `<div style="color:#64748b;font-size:0.85rem;">Deadline: ${fmtDate(o.deadline)}</div>` : ''}
        </div>
      </div>
      <table>
        <thead><tr><th>Service</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody><tr>
          <td><b>${escapeHtml(o.service||'-')}</b>${o.package ? '<br><span style="color:#64748b;font-size:0.8rem;">'+escapeHtml(o.package)+'</span>' : ''}</td>
          <td style="color:#64748b;font-size:0.85rem;">${escapeHtml(o.deliverables||'—')}</td>
          <td style="text-align:right;font-weight:700;">${o.currency||'USD'} ${Number(o.amount||0).toLocaleString()}</td>
        </tr></tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${o.currency||'USD'} ${Number(o.amount||0).toLocaleString()}</span></div>
        <div><span>Paid</span><span style="color:#059669;">${o.currency||'USD'} ${paid.toLocaleString()}</span></div>
        <div class="total"><span>Balance Due</span><span>${o.currency||'USD'} ${due.toLocaleString()}</span></div>
      </div>
      <div class="foot">Thank you for choosing Vextro Lyntra. This is a computer-generated invoice.</div>
    </div></body></html>`);
  w.document.close();
};

window.adminExportOrders = function() {
  const list = Object.values(window.__adminOrdersCache || {});
  if (!list.length) { alert('No orders to export'); return; }
  const headers = ['ID','Buyer','Email','Phone','Service','Package','Currency','Amount','Amount Paid','Status','Payment Status','Payment Method','Txn Ref','Deadline','Created','Notes'];
  const esc = (v) => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const rows = list.map(o => [
    o.id, o.buyerName, o.buyerEmail, o.buyerPhone, o.service, o.package,
    o.currency, o.amount, o.amountPaid, o.status, o.paymentStatus,
    o.paymentMethod, o.txn, o.deadline ? new Date(o.deadline).toISOString() : '',
    o.createdAt ? new Date(o.createdAt).toISOString() : '', o.notes
  ].map(esc).join(','));
  const csv = [headers.map(esc).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'orders_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

async function renderAdminUsersNew(container) {
  container.innerHTML = `<div class="admin-panel-card"><div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading users…</p></div></div>`;
  try {
    // Load users + comments + purchases + listings + contacts (for activity)
    let usersMap = {}, commentsMap = {}, purchasesMap = {}, listingsMap = {}, contactsMap = {}, statsMap = {};
    if (window.fsLoadMap) {
      try { usersMap = (await window.fsLoadMap('users')) || {}; } catch(e) {}
      try { commentsMap = (await window.fsLoadMap('blog_comments')) || {}; } catch(e) {}
      try { purchasesMap = (await window.fsLoadMap('purchases')) || {}; } catch(e) {}
      try { listingsMap = (await window.fsLoadMap('listings')) || {}; } catch(e) {}
      try { contactsMap = (await window.fsLoadMap('contacts')) || {}; } catch(e) {}
      try { statsMap = (await window.fsLoadMap('user_stats')) || {}; } catch(e) {}
    }
    // Comments by email
    const commentsByEmail = {}, commentsListByEmail = {};
    Object.values(commentsMap || {}).forEach(entry => {
      if (!entry || typeof entry !== 'object') return;
      const items = Array.isArray(entry.items) ? entry.items : [];
      items.forEach(c => {
        if (!c || typeof c !== 'object') return;
        const em = (c.email || '').toLowerCase().trim();
        if (em) {
          commentsByEmail[em] = (commentsByEmail[em] || 0) + 1;
          if (!commentsListByEmail[em]) commentsListByEmail[em] = [];
          commentsListByEmail[em].push({ ...c, blogId: entry.id || entry.blogId });
        }
      });
    });
    // Purchases by email
    const purchasesByEmail = {}, purchasesListByEmail = {};
    Object.values(purchasesMap || {}).forEach(p => {
      if (!p || typeof p !== 'object') return;
      const em = (p.userEmail || '').toLowerCase().trim();
      if (!em) return;
      purchasesByEmail[em] = (purchasesByEmail[em] || 0) + 1;
      if (!purchasesListByEmail[em]) purchasesListByEmail[em] = [];
      purchasesListByEmail[em].push(p);
    });
    // Listings by userEmail (if tracked)
    const listingsByEmail = {};
    Object.values(listingsMap || {}).forEach(l => {
      if (!l || typeof l !== 'object') return;
      const em = (l.userEmail || l.ownerEmail || '').toLowerCase().trim();
      if (!em) return;
      if (!listingsByEmail[em]) listingsByEmail[em] = [];
      listingsByEmail[em].push(l);
    });
    // Contacts by email
    const contactsByEmail = {};
    Object.values(contactsMap || {}).forEach(c => {
      if (!c || typeof c !== 'object') return;
      const em = (c.email || '').toLowerCase().trim();
      if (!em) return;
      if (!contactsByEmail[em]) contactsByEmail[em] = [];
      contactsByEmail[em].push(c);
    });

    Object.entries(usersMap || {}).forEach(([uid, u]) => {
      if (u && typeof u === 'object' && !u.uid) u.uid = uid;
    });
    window.__adminUsersCache = usersMap;
    window.__adminUsersCommentsByEmail = commentsByEmail;
    window.__adminUsersData = {
      commentsListByEmail, purchasesByEmail, purchasesListByEmail,
      listingsByEmail, contactsByEmail, statsMap
    };
    renderAdminUsersTable(container, '');
  } catch(e) {
    console.error(e);
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error loading users</p></div>`;
  }
}


function adminUserTime(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value < 1000000000000 ? value * 1000 : value;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try { return value.toDate().getTime() || 0; } catch(e) {}
    }
    if (value.seconds || value._seconds) return Number(value.seconds || value._seconds) * 1000;
    if (value.timestampValue) return adminUserTime(value.timestampValue);
    if (value.stringValue) return adminUserTime(value.stringValue);
  }
  return 0;
}

function adminUserDate(value) {
  const ms = adminUserTime(value);
  return ms ? new Date(ms).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
}

function renderAdminUsersTable(container, filter) {
  container = container || document.getElementById('adminContent');
  if (!container) return;
  const usersMap = window.__adminUsersCache || {};
  const commentsByEmail = window.__adminUsersCommentsByEmail || {};
  const f = (filter || '').toLowerCase().trim();
  let users = Object.values(usersMap);
  if (f) users = users.filter(u =>
    (u.email || '').toLowerCase().includes(f) ||
    (u.displayName || '').toLowerCase().includes(f)
  );
  // newest first
  users.sort((a,b) => adminUserTime(b.createdAt || b.lastLoginAt) - adminUserTime(a.createdAt || a.lastLoginAt));

  const stats = {
    total: Object.keys(usersMap).length,
    admins: Object.values(usersMap).filter(u => u.role === 'admin').length,
    banned: Object.values(usersMap).filter(u => u.status === 'banned').length,
    active: Object.values(usersMap).filter(u => (u.status || 'active') === 'active').length
  };

  // Advanced analytics
  const now = Date.now();
  const DAY = 86400000;
  const allUsersArr = Object.values(usersMap);
  const new7d = allUsersArr.filter(u => u && adminUserTime(u.createdAt) && (now - adminUserTime(u.createdAt)) < 7*DAY).length;
  const active7d = allUsersArr.filter(u => u && adminUserTime(u.lastLoginAt) && (now - adminUserTime(u.lastLoginAt)) < 7*DAY).length;
  const purchasesByEmail = (window.__adminUsersData && window.__adminUsersData.purchasesByEmail) || {};
  const withPurchases = Object.keys(purchasesByEmail).length;
  const totalPurchases = Object.values(purchasesByEmail).reduce((a,b)=>a + (Number(b) || 0),0);

  // Current filter state
  const fRole = window.__adminUserFilterRole || '';
  const fStatus = window.__adminUserFilterStatus || '';
  const fProvider = window.__adminUserFilterProvider || '';

  // Apply advanced filters on top of search
  const filteredUsers = users.filter(u => {
    if (fRole && (u.role || 'user') !== fRole) return false;
    if (fStatus && (u.status || 'active') !== fStatus) return false;
    if (fProvider) {
      const p = (u.provider || 'password').toLowerCase();
      if (fProvider === 'google' && !p.includes('google')) return false;
      if (fProvider === 'password' && p.includes('google')) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
      ${[
        {label:'Total Users', val:stats.total, c:'#3b82f6', i:'fa-users'},
        {label:'Active', val:stats.active, c:'#10b981', i:'fa-user-check'},
        {label:'New (7d)', val:new7d, c:'#06b6d4', i:'fa-user-plus'},
        {label:'Active (7d)', val:active7d, c:'#8b5cf6', i:'fa-bolt'},
        {label:'Buyers', val:withPurchases, c:'#f59e0b', i:'fa-cart-shopping'},
        {label:'Buy Clicks', val:totalPurchases, c:'#ec4899', i:'fa-hand-pointer'},
        {label:'Admins', val:stats.admins, c:'#f97316', i:'fa-user-shield'},
        {label:'Banned', val:stats.banned, c:'#ef4444', i:'fa-user-slash'}
      ].map(s => `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:9px;background:${s.c}18;color:${s.c};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${s.i}"></i></div>
          <div style="min-width:0;"><div style="font-size:0.72rem;color:#94a3b8;font-weight:600;">${s.label}</div><div style="font-size:1.25rem;font-weight:800;color:#0f172a;">${s.val}</div></div>
        </div>`).join('')}
    </div>
    <div class="admin-panel-card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:14px 16px;border-bottom:1px solid #e2e8f0;">
        <div style="flex:1;min-width:200px;position:relative;">
          <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;"></i>
          <input id="adminUserSearch" type="text" placeholder="Search by name or email…" value="${f.replace(/"/g,'&quot;')}"
            style="width:100%;padding:10px 12px 10px 36px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.9rem;background:#f8fafc;color:#0f172a;">
        </div>
        <select id="adminUserFilterRole" onchange="window.__adminUserFilterRole=this.value;renderAdminUsersTable(document.getElementById('adminContent'), document.getElementById('adminUserSearch')?.value||'')" style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:0.82rem;color:#0f172a;">
          <option value="">All Roles</option>
          <option value="user" ${fRole==='user'?'selected':''}>👤 User</option>
          <option value="admin" ${fRole==='admin'?'selected':''}>🛡️ Admin</option>
        </select>
        <select id="adminUserFilterStatus" onchange="window.__adminUserFilterStatus=this.value;renderAdminUsersTable(document.getElementById('adminContent'), document.getElementById('adminUserSearch')?.value||'')" style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:0.82rem;color:#0f172a;">
          <option value="">All Status</option>
          <option value="active" ${fStatus==='active'?'selected':''}>Active</option>
          <option value="banned" ${fStatus==='banned'?'selected':''}>Banned</option>
        </select>
        <select id="adminUserFilterProvider" onchange="window.__adminUserFilterProvider=this.value;renderAdminUsersTable(document.getElementById('adminContent'), document.getElementById('adminUserSearch')?.value||'')" style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:0.82rem;color:#0f172a;">
          <option value="">All Providers</option>
          <option value="google" ${fProvider==='google'?'selected':''}>Google</option>
          <option value="password" ${fProvider==='password'?'selected':''}>Email</option>
        </select>
        <div style="font-size:0.82rem;color:#64748b;">${filteredUsers.length} shown</div>
        <button onclick="adminExportUsers('csv')" style="padding:9px 12px;background:#10b981;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-file-csv"></i> CSV</button>
        <button onclick="adminExportUsers('json')" style="padding:9px 12px;background:#3b82f6;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-file-code"></i> JSON</button>
        <button onclick="document.getElementById('adminUserImportFile').click()" style="padding:9px 14px;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-file-import"></i> Import</button>
        <input id="adminUserImportFile" type="file" accept=".json,application/json" style="display:none;" onchange="adminImportUsersJson(this)">
      </div>

      <!-- Bulk action bar (shown when selection > 0) -->
      <div id="adminBulkBar" style="display:none;padding:10px 16px;background:linear-gradient(90deg,#fff7ed,#ffedd5);border-bottom:1px solid #fed7aa;gap:10px;flex-wrap:wrap;align-items:center;">
        <span style="font-weight:700;color:#9a3412;font-size:0.85rem;"><i class="fa-solid fa-check-double"></i> <span id="adminBulkCount">0</span> selected</span>
        <button onclick="adminBulkAction('ban')" style="padding:7px 12px;background:#f59e0b;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-ban"></i> Ban</button>
        <button onclick="adminBulkAction('unban')" style="padding:7px 12px;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-user-check"></i> Unban</button>
        <button onclick="adminBulkAction('role-admin')" style="padding:7px 12px;background:#8b5cf6;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-user-shield"></i> Make Admin</button>
        <button onclick="adminBulkAction('role-user')" style="padding:7px 12px;background:#64748b;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-user"></i> Make User</button>
        <button onclick="adminBulkNotify()" style="padding:7px 12px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-bell"></i> Notify</button>
        <button onclick="adminBulkAction('delete')" style="padding:7px 12px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Delete</button>
        <button onclick="adminBulkClear()" style="padding:7px 12px;background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:8px;font-weight:700;font-size:0.78rem;cursor:pointer;margin-left:auto;">Clear</button>
      </div>

      ${filteredUsers.length === 0 ? `
        <div class="admin-empty" style="padding:40px 20px;">
          <i class="fa-solid fa-users"></i>
          <p style="font-weight:600;">${f || fRole || fStatus || fProvider ? 'No matching users' : 'No users yet'}</p>
          ${!f ? '<p style="font-size:0.82rem;color:#94a3b8;">Users appear here after they sign in for the first time.</p>' : ''}
        </div>` : `
      <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead><tr><th style="width:32px;"><input type="checkbox" id="adminBulkSelectAll" onchange="adminBulkToggleAll(this.checked)"></th><th>User</th><th>Provider</th><th>Role</th><th>Status</th><th>Purchases</th><th>Comments</th><th>Joined</th><th>Last Login</th><th style="text-align:right;">Actions</th></tr></thead>
        <tbody>${filteredUsers.map(u => {
          const email = (u.email || '').toLowerCase();
          const commentsN = commentsByEmail[email] || 0;
          const purchasesN = (window.__adminUsersData?.purchasesByEmail || {})[email] || 0;
          const initial = (u.displayName || u.email || '?').trim().charAt(0).toUpperCase();
          const joined = adminUserDate(u.createdAt);
          const last = adminUserDate(u.lastLoginAt);
          const status = u.status || 'active';
          const role = u.role || 'user';
          const provider = String(u.provider || 'password').toLowerCase();
          const provIcon = provider.includes('google') ? 'fa-brands fa-google' : 'fa-solid fa-envelope';
          const provLabel = provider.includes('google') ? 'Google' : 'Email';
          const noteBadge = u.notes ? '<span title="Has admin note" style="color:#f59e0b;margin-left:4px;"><i class="fa-solid fa-note-sticky"></i></span>' : '';
          return `
          <tr>
            <td><input type="checkbox" class="adminBulkChk" data-uid="${u.uid}" onchange="adminBulkUpdateBar()"></td>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                ${u.photoURL ? `<img src="${u.photoURL}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` :
                  `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;">${initial}</div>`}
                <div style="min-width:0;">
                  <div style="font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${(u.displayName||'User').replace(/</g,'&lt;')}${noteBadge}</div>
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
            <td><span style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.08);color:#10b981;padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.8rem;"><i class="fa-solid fa-cart-shopping"></i> ${purchasesN}</span></td>
            <td><span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,0.08);color:#ff6b35;padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.8rem;"><i class="fa-regular fa-comment"></i> ${commentsN}</span></td>
            <td style="font-size:0.78rem;color:#94a3b8;">${joined}</td>
            <td style="font-size:0.78rem;color:#94a3b8;">${last}</td>
            <td style="text-align:right;">
              <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">
                <button onclick="adminViewUserDetails('${u.uid}')" style="background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25);padding:6px 11px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.76rem;"><i class="fa-solid fa-eye"></i> Details</button>
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

window.adminViewUserDetails = function(uid) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  const email = (u.email || '').toLowerCase();
  const data = window.__adminUsersData || {};
  const purchases = (data.purchasesListByEmail || {})[email] || [];
  const comments = (data.commentsListByEmail || {})[email] || [];
  const listings = (data.listingsByEmail || {})[email] || [];
  const contacts = (data.contactsByEmail || {})[email] || [];
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = t => t ? new Date(t).toLocaleString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
  const status = u.status || 'active';
  const role = u.role || 'user';
  const initial = (u.displayName || u.email || '?').trim().charAt(0).toUpperCase();
  const totalSpent = purchases.reduce((sum,p) => sum + (parseFloat(p.price) || 0), 0);

  const kv = (k,v) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;"><span style="color:#64748b;font-weight:600;">${k}</span><span style="color:#0f172a;font-weight:600;text-align:right;word-break:break-all;max-width:60%;">${v}</span></div>`;

  const html = `
    <div id="adminUserDetailModal" style="position:fixed;inset:0;background:rgba(15,23,42,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;" onclick="if(event.target===this)this.remove()">
      <div style="background:#fff;border-radius:16px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="padding:24px;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border-radius:16px 16px 0 0;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:2;">
          ${u.photoURL ? `<img src="${esc(u.photoURL)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.3);">` : `<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.25);color:#fff;font-weight:800;font-size:1.6rem;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.3);">${initial}</div>`}
          <div style="flex:1;min-width:0;">
            <div style="font-size:1.35rem;font-weight:800;">${esc(u.displayName || 'User')}</div>
            <div style="font-size:0.88rem;opacity:0.9;word-break:break-all;">${esc(u.email || '')}</div>
            <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
              <span style="background:rgba(255,255,255,0.25);padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">${role.toUpperCase()}</span>
              <span style="background:${status==='banned'?'rgba(239,68,68,0.9)':'rgba(16,185,129,0.9)'};padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">${status.toUpperCase()}</span>
              ${u.emailVerified ? '<span style="background:rgba(59,130,246,0.9);padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;"><i class="fa-solid fa-check"></i> VERIFIED</span>' : ''}
            </div>
          </div>
          <button onclick="document.getElementById('adminUserDetailModal').remove()" style="background:rgba(255,255,255,0.25);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div style="padding:24px;">
          <!-- Stats -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;">
            ${[
              {l:'Purchases',v:purchases.length,c:'#10b981',i:'fa-cart-shopping'},
              {l:'Total Intent',v:'$'+totalSpent.toFixed(0),c:'#f59e0b',i:'fa-dollar-sign'},
              {l:'Comments',v:comments.length,c:'#ff6b35',i:'fa-comment'},
              {l:'Listings',v:listings.length,c:'#8b5cf6',i:'fa-store'},
              {l:'Messages',v:contacts.length,c:'#3b82f6',i:'fa-envelope'}
            ].map(s=>`<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;"><div style="color:${s.c};font-size:1.2rem;margin-bottom:4px;"><i class="fa-solid ${s.i}"></i></div><div style="font-size:1.3rem;font-weight:800;color:#0f172a;">${s.v}</div><div style="font-size:0.72rem;color:#64748b;font-weight:600;">${s.l}</div></div>`).join('')}
          </div>

          <!-- Profile -->
          <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-id-card" style="color:#ff6b35;"></i> Profile Information</h4>
            ${kv('UID', esc(u.uid))}
            ${kv('Full Name', esc(u.displayName || '—'))}
            ${kv('Email', esc(u.email || '—'))}
            ${kv('Provider', esc(u.provider || 'password'))}
            ${kv('Email Verified', u.emailVerified ? '✅ Yes' : '❌ No')}
            ${kv('Role', role)}
            ${kv('Status', status)}
            ${kv('Joined', fmt(u.createdAt))}
            ${kv('Last Login', fmt(u.lastLoginAt))}
            ${u.imported ? kv('Source', '📥 Imported from Firebase') : ''}
          </div>

          <!-- Dashboard Stats Override (admin-controlled fake numbers) -->
          ${(function(){
            const s = window.adminGetUserStatsFromCache ? window.adminGetUserStatsFromCache(u.uid, u) : ((window.__adminUsersData && window.__adminUsersData.statsMap && window.__adminUsersData.statsMap[u.uid]) || u.dashboardStats || {});
            const val = v => (v === undefined || v === null) ? '' : String(v);
            const field = (id, label, ph, step) => `
              <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:0.72rem;color:#64748b;font-weight:700;">${label}</label>
                <input id="ust_${id}" type="number" step="${step||'1'}" placeholder="${ph}" value="${val(s[id])}"
                  style="padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.85rem;background:#fff;color:#0f172a;">
              </div>`;
            return `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                <h4 style="margin:0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-sliders" style="color:#f59e0b;"></i> Dashboard Stats Override</h4>
                <span style="font-size:0.72rem;color:#92400e;background:#fef3c7;padding:3px 8px;border-radius:20px;font-weight:700;">Shown on user's dashboard</span>
              </div>
              <p style="margin:4px 0 12px;font-size:0.78rem;color:#78716c;">Leave a field blank to hide it (dashboard falls back to 0). Values sync live to this user's dashboard.</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
                ${field('listings','Total Listings','0')}
                ${field('listingsActive','Active (sub)','0')}
                ${field('views','Total Views','0')}
                ${field('bids','Total Bids','0')}
                ${field('portfolio','Portfolio Value ($)','0')}
                ${field('active','Active','0')}
                ${field('pending','Pending','0')}
                ${field('sold','Sold','0')}
                ${field('blogs','Blogs','0')}
                ${field('rating','Rating (0–5)','0.0','0.1')}
              </div>
              <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
                <button onclick="adminSaveUserStats('${u.uid}')" style="padding:9px 16px;background:#f59e0b;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.85rem;cursor:pointer;"><i class="fa-solid fa-floppy-disk"></i> Save Stats</button>
                <button onclick="adminClearUserStats('${u.uid}')" style="padding:9px 16px;background:#fff;color:#b45309;border:1px solid #fcd34d;border-radius:9px;font-weight:700;font-size:0.85rem;cursor:pointer;"><i class="fa-solid fa-eraser"></i> Clear All</button>
                <span id="ust_saveMsg_${u.uid}" style="align-self:center;font-size:0.8rem;color:#059669;font-weight:700;"></span>
              </div>
            </div>`;
          })()}

          <!-- Admin Notes (private) -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
              <h4 style="margin:0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-note-sticky" style="color:#3b82f6;"></i> Admin Notes (Private)</h4>
              <span style="font-size:0.72rem;color:#1e40af;background:#dbeafe;padding:3px 8px;border-radius:20px;font-weight:700;">Only visible to admins</span>
            </div>
            <textarea id="adminUserNote_${u.uid}" rows="3" placeholder="e.g. VIP client, spam risk, follow-up needed…" style="width:100%;padding:10px 12px;border:1px solid #bfdbfe;border-radius:9px;font-size:0.85rem;background:#fff;color:#0f172a;resize:vertical;font-family:inherit;">${esc(u.notes || '')}</textarea>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
              <button onclick="adminSaveUserNote('${u.uid}')" style="padding:8px 14px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-floppy-disk"></i> Save Note</button>
              <span id="adminUserNoteMsg_${u.uid}" style="align-self:center;font-size:0.8rem;color:#059669;font-weight:700;"></span>
            </div>
          </div>

          <!-- Send Notification -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-bell" style="color:#10b981;"></i> Send Notification to User</h4>
            <p style="margin:0 0 10px;font-size:0.78rem;color:#166534;">Delivered to user's dashboard bell on next visit.</p>
            <input id="adminNotifTitle_${u.uid}" type="text" placeholder="Notification title" style="width:100%;padding:8px 12px;border:1px solid #bbf7d0;border-radius:8px;font-size:0.85rem;background:#fff;color:#0f172a;margin-bottom:8px;">
            <textarea id="adminNotifBody_${u.uid}" rows="2" placeholder="Message body…" style="width:100%;padding:8px 12px;border:1px solid #bbf7d0;border-radius:8px;font-size:0.85rem;background:#fff;color:#0f172a;resize:vertical;font-family:inherit;"></textarea>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center;">
              <select id="adminNotifType_${u.uid}" style="padding:8px 10px;border:1px solid #bbf7d0;border-radius:8px;font-size:0.82rem;background:#fff;color:#0f172a;">
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="promo">🎁 Promo</option>
              </select>
              <button onclick="adminSendNotification('${u.uid}')" style="padding:8px 14px;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-paper-plane"></i> Send</button>
              <span id="adminNotifMsg_${u.uid}" style="font-size:0.8rem;color:#059669;font-weight:700;"></span>
            </div>
            ${(u.notifications && u.notifications.length) ? `
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid #bbf7d0;">
                <div style="font-size:0.78rem;color:#166534;font-weight:700;margin-bottom:6px;">Sent history (${u.notifications.length})</div>
                <div style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
                  ${u.notifications.slice(0,10).map(n=>`
                    <div style="padding:8px 10px;background:#fff;border-radius:6px;border-left:3px solid #10b981;font-size:0.78rem;">
                      <div style="font-weight:700;color:#0f172a;">${esc(n.title||'')}</div>
                      <div style="color:#334155;">${esc(n.body||'')}</div>
                      <div style="color:#94a3b8;font-size:0.7rem;margin-top:2px;">${fmt(n.ts)} ${n.read?'· read':'· unread'}</div>
                    </div>`).join('')}
                </div>
              </div>` : ''}
          </div>

          <!-- Login History / Audit Log -->
          ${(u.loginHistory && u.loginHistory.length) ? `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-clock-rotate-left" style="color:#6366f1;"></i> Login History (${u.loginHistory.length})</h4>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;">
              ${u.loginHistory.slice(0,20).map(h=>{
                const ua = String(h.userAgent||'');
                let device = 'Desktop', dIcon='fa-desktop';
                if (/Mobile|Android|iPhone/i.test(ua)) { device='Mobile'; dIcon='fa-mobile-screen'; }
                else if (/iPad|Tablet/i.test(ua)) { device='Tablet'; dIcon='fa-tablet-screen-button'; }
                let browser='Browser';
                if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser='Chrome';
                else if (/Firefox/i.test(ua)) browser='Firefox';
                else if (/Safari/i.test(ua)) browser='Safari';
                else if (/Edg/i.test(ua)) browser='Edge';
                return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#f8fafc;border-radius:8px;border-left:3px solid #6366f1;font-size:0.8rem;">
                  <i class="fa-solid ${dIcon}" style="color:#6366f1;"></i>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#0f172a;">${device} · ${browser} · ${esc(h.provider||'password')}</div>
                    <div style="font-size:0.72rem;color:#94a3b8;">${fmt(h.ts)}</div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>` : ''}



          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-cart-shopping" style="color:#10b981;"></i> Purchase History (${purchases.length})</h4>
            ${purchases.length === 0 ? '<p style="color:#94a3b8;font-size:0.85rem;margin:0;">No purchases tracked yet. Purchases are logged when this user clicks "Buy Now".</p>' :
              '<div style="display:flex;flex-direction:column;gap:8px;">' + purchases.sort((a,b)=>(b.ts||'').localeCompare(a.ts||'')).map(p=>`
                <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid #10b981;">
                  ${p.image ? `<img src="${esc(p.image)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;">` : `<div style="width:44px;height:44px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fa-solid fa-box"></i></div>`}
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#0f172a;font-size:0.88rem;">${esc(p.title || 'Unknown')}</div>
                    <div style="font-size:0.75rem;color:#64748b;">${esc(p.kind || 'product')} • ${fmt(p.ts)}</div>
                  </div>
                  <div style="font-weight:800;color:#10b981;font-size:0.95rem;">$${esc(p.price || '0')}</div>
                </div>`).join('') + '</div>'}
          </div>

          <!-- Comments -->
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-comment" style="color:#ff6b35;"></i> Blog Comments (${comments.length})</h4>
            ${comments.length === 0 ? '<p style="color:#94a3b8;font-size:0.85rem;margin:0;">No comments yet.</p>' :
              '<div style="display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;">' + comments.slice(0,20).map(c=>`
                <div style="padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid #ff6b35;">
                  <div style="font-size:0.85rem;color:#0f172a;">${esc(c.text || c.comment || '')}</div>
                  <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;">${fmt(c.ts || c.createdAt)}${c.blogId?' • Blog #'+esc(c.blogId):''}</div>
                </div>`).join('') + '</div>'}
          </div>

          <!-- Listings -->
          ${listings.length > 0 ? `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-store" style="color:#8b5cf6;"></i> Listings Created (${listings.length})</h4>
            <div style="display:flex;flex-direction:column;gap:8px;">${listings.map(l=>`
              <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid #8b5cf6;">
                <div style="flex:1;"><div style="font-weight:700;color:#0f172a;font-size:0.88rem;">${esc(l.title||'')}</div><div style="font-size:0.75rem;color:#64748b;">${esc(l.category||'')} • ${esc(l.status||'')}</div></div>
                <div style="font-weight:800;color:#8b5cf6;">$${esc(l.price||'0')}</div>
              </div>`).join('')}</div>
          </div>` : ''}

          <!-- Contact messages -->
          ${contacts.length > 0 ? `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px 0;font-size:0.9rem;color:#0f172a;font-weight:800;"><i class="fa-solid fa-envelope" style="color:#3b82f6;"></i> Contact Messages (${contacts.length})</h4>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;">${contacts.map(c=>`
              <div style="padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid #3b82f6;">
                <div style="font-weight:700;color:#0f172a;font-size:0.85rem;">${esc(c.subject||'No subject')}</div>
                <div style="font-size:0.8rem;color:#334155;margin-top:3px;">${esc((c.message||'').slice(0,150))}${(c.message||'').length>150?'…':''}</div>
                <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;">${fmt(c.ts || c.createdAt)}</div>
              </div>`).join('')}</div>
          </div>` : ''}

          <!-- Actions -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <button onclick="navigator.clipboard.writeText('${esc(u.email||'')}');this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Copied'" style="padding:9px 14px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;border-radius:9px;font-weight:600;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-copy"></i> Copy Email</button>
            <a href="mailto:${esc(u.email||'')}" style="padding:9px 14px;background:#3b82f6;color:#fff;border-radius:9px;font-weight:600;font-size:0.82rem;text-decoration:none;"><i class="fa-solid fa-paper-plane"></i> Email User</a>
            ${status==='banned'
              ? `<button onclick="document.getElementById('adminUserDetailModal').remove();adminSetUserStatus('${u.uid}','active')" style="padding:9px 14px;background:#10b981;color:#fff;border:none;border-radius:9px;font-weight:600;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-user-check"></i> Unban</button>`
              : `<button onclick="document.getElementById('adminUserDetailModal').remove();adminSetUserStatus('${u.uid}','banned')" style="padding:9px 14px;background:#f59e0b;color:#fff;border:none;border-radius:9px;font-weight:600;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-ban"></i> Ban User</button>`}
            <button onclick="document.getElementById('adminUserDetailModal').remove();adminDeleteUser('${u.uid}')" style="padding:9px 14px;background:#ef4444;color:#fff;border:none;border-radius:9px;font-weight:600;font-size:0.82rem;cursor:pointer;margin-left:auto;"><i class="fa-solid fa-trash-can"></i> Delete</button>
          </div>
        </div>
      </div>
    </div>`;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);
};

window.adminGetUserStatsFromCache = function(uid, user) {
  const statsMap = (window.__adminUsersData && window.__adminUsersData.statsMap) || {};
  let stats = (statsMap && statsMap[uid]) || (user && user.dashboardStats) || null;
  if (!stats) {
    try { stats = JSON.parse(localStorage.getItem('user_stats_' + uid) || 'null'); } catch(e) {}
  }
  return stats || {};
};

window.adminBuildUserStatsPayload = function(uid) {
  const keys = ['listings','listingsActive','views','bids','portfolio','active','pending','sold','blogs','rating'];
  const payload = { uid };
  keys.forEach(k => {
    const el = document.getElementById('ust_' + k);
    if (!el) return;
    const v = String(el.value || '').trim();
    payload[k] = v === '' ? '' : v;
  });
  payload.updatedAt = new Date().toISOString();
  return payload;
};

// Save admin-configured dashboard stat overrides for a specific user
window.adminSaveUserStats = async function(uid) {
  const payload = window.adminBuildUserStatsPayload ? window.adminBuildUserStatsPayload(uid) : { uid, updatedAt: new Date().toISOString() };
  const u = (window.__adminUsersCache || {})[uid];
  if (u && u.email) payload.userEmail = u.email;
  try {
    if (window.fsSetDoc) {
      try { await window.fsSetDoc('user_stats', uid, payload); }
      catch(e) { console.warn('user_stats save failed, saving inside user record instead', e.message); }
    }
    try { localStorage.setItem('user_stats_' + uid, JSON.stringify(payload)); } catch(e) {}
    if (!window.__adminUsersData) window.__adminUsersData = {};
    if (!window.__adminUsersData.statsMap) window.__adminUsersData.statsMap = {};
    window.__adminUsersData.statsMap[uid] = payload;
    if (u) {
      u.dashboardStats = payload;
      window.__adminUsersCache[uid] = u;
      if (window.fsSetDoc) {
        try { await window.fsSetDoc('users', uid, u); } catch(e) { console.warn('embedded dashboard stats save failed', e.message); }
      }
    }
    const msg = document.getElementById('ust_saveMsg_' + uid);
    if (msg) { msg.textContent = '✓ Saved'; setTimeout(()=>{ if (msg) msg.textContent=''; }, 2500); }
    // If the admin is editing their own account, refresh their dashboard live
    if (window.auth && window.auth.currentUser && window.auth.currentUser.uid === uid && window.applyUserFakeStats) {
      window.applyUserFakeStats(uid);
    }
  } catch(e) {
    alert('Save failed: ' + e.message);
  }
};

// Clear all overrides for a user
window.adminClearUserStats = async function(uid) {
  if (!confirm('Clear all dashboard stat overrides for this user?')) return;
  const keys = ['listings','listingsActive','views','bids','portfolio','active','pending','sold','blogs','rating'];
  keys.forEach(k => { const el = document.getElementById('ust_' + k); if (el) el.value = ''; });
  try {
    if (window.fsDeleteDoc) {
      try { await window.fsDeleteDoc('user_stats', uid); }
      catch(e) { console.warn('user_stats delete failed, clearing inside user record instead', e.message); }
    }
    try { localStorage.removeItem('user_stats_' + uid); } catch(e) {}
    if (window.__adminUsersData && window.__adminUsersData.statsMap) delete window.__adminUsersData.statsMap[uid];
    const u = (window.__adminUsersCache || {})[uid];
    if (u) {
      u.dashboardStats = {};
      window.__adminUsersCache[uid] = u;
      if (window.fsSetDoc) {
        try { await window.fsSetDoc('users', uid, u); } catch(e) { console.warn('embedded dashboard stats clear failed', e.message); }
      }
    }
    const msg = document.getElementById('ust_saveMsg_' + uid);
    if (msg) { msg.textContent = '✓ Cleared'; setTimeout(()=>{ if (msg) msg.textContent=''; }, 2500); }
  } catch(e) { alert('Clear failed: ' + e.message); }
};

// ============================================================
// Admin Notes — private notes attached to a user record
// ============================================================
window.adminSaveUserNote = async function(uid) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  const el = document.getElementById('adminUserNote_' + uid);
  if (!el) return;
  u.notes = el.value.trim();
  window.__adminUsersCache[uid] = u;
  try {
    if (window.fsSetDoc) await window.fsSetDoc('users', uid, u);
    const msg = document.getElementById('adminUserNoteMsg_' + uid);
    if (msg) { msg.textContent = '✓ Saved'; setTimeout(()=>{ if (msg) msg.textContent=''; }, 2500); }
  } catch(e) { alert('Save failed: ' + e.message); }
};

// ============================================================
// Send in-app notification (stored on user record → user dashboard bell)
// ============================================================
window.adminSendNotification = async function(uid) {
  const u = (window.__adminUsersCache || {})[uid];
  if (!u) return;
  const title = (document.getElementById('adminNotifTitle_' + uid)?.value || '').trim();
  const body = (document.getElementById('adminNotifBody_' + uid)?.value || '').trim();
  const type = document.getElementById('adminNotifType_' + uid)?.value || 'info';
  if (!title && !body) { alert('Please enter a title or message.'); return; }
  const entry = { id: 'n_' + Date.now(), title, body, type, ts: new Date().toISOString(), read: false };
  u.notifications = Array.isArray(u.notifications) ? u.notifications : [];
  u.notifications.unshift(entry);
  if (u.notifications.length > 50) u.notifications = u.notifications.slice(0, 50);
  window.__adminUsersCache[uid] = u;
  try {
    if (window.fsSetDoc) await window.fsSetDoc('users', uid, u);
    const msg = document.getElementById('adminNotifMsg_' + uid);
    if (msg) { msg.textContent = '✓ Sent'; setTimeout(()=>{ if (msg) msg.textContent=''; }, 2500); }
    const tEl = document.getElementById('adminNotifTitle_' + uid); if (tEl) tEl.value = '';
    const bEl = document.getElementById('adminNotifBody_' + uid); if (bEl) bEl.value = '';
  } catch(e) { alert('Send failed: ' + e.message); }
};

// ============================================================
// Bulk selection + actions
// ============================================================
window.adminBulkToggleAll = function(checked) {
  document.querySelectorAll('.adminBulkChk').forEach(chk => { chk.checked = checked; });
  window.adminBulkUpdateBar();
};

window.adminBulkUpdateBar = function() {
  const selected = document.querySelectorAll('.adminBulkChk:checked');
  const bar = document.getElementById('adminBulkBar');
  const count = document.getElementById('adminBulkCount');
  if (!bar) return;
  if (selected.length > 0) {
    bar.style.display = 'flex';
    if (count) count.textContent = selected.length;
  } else {
    bar.style.display = 'none';
  }
};

window.adminBulkClear = function() {
  document.querySelectorAll('.adminBulkChk').forEach(chk => { chk.checked = false; });
  const all = document.getElementById('adminBulkSelectAll'); if (all) all.checked = false;
  window.adminBulkUpdateBar();
};

window.adminBulkSelected = function() {
  return Array.from(document.querySelectorAll('.adminBulkChk:checked')).map(c => c.dataset.uid);
};

window.adminBulkAction = async function(action) {
  const uids = window.adminBulkSelected();
  if (uids.length === 0) return;
  const labels = { ban:'ban', unban:'unban', delete:'DELETE', 'role-admin':'make admin', 'role-user':'make user' };
  if (!confirm(`Are you sure you want to ${labels[action]} ${uids.length} user(s)?`)) return;
  for (const uid of uids) {
    const u = (window.__adminUsersCache || {})[uid];
    if (!u) continue;
    try {
      if (action === 'ban') u.status = 'banned';
      else if (action === 'unban') u.status = 'active';
      else if (action === 'role-admin') u.role = 'admin';
      else if (action === 'role-user') u.role = 'user';
      else if (action === 'delete') {
        delete window.__adminUsersCache[uid];
        if (window.fsDeleteDoc) await window.fsDeleteDoc('users', uid);
        continue;
      }
      window.__adminUsersCache[uid] = u;
      if (window.fsSetDoc) await window.fsSetDoc('users', uid, u);
    } catch(e) { console.warn('bulk action failed for', uid, e.message); }
  }
  showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view="adminUsers"]'));
};

window.adminBulkNotify = async function() {
  const uids = window.adminBulkSelected();
  if (uids.length === 0) return;
  const title = prompt('Notification title:');
  if (title === null) return;
  const body = prompt('Message body:');
  if (body === null) return;
  const entry = base => ({ id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), title: title||'', body: body||'', type: 'info', ts: new Date().toISOString(), read: false, ...base });
  let sent = 0;
  for (const uid of uids) {
    const u = (window.__adminUsersCache || {})[uid];
    if (!u) continue;
    u.notifications = Array.isArray(u.notifications) ? u.notifications : [];
    u.notifications.unshift(entry({}));
    if (u.notifications.length > 50) u.notifications = u.notifications.slice(0, 50);
    window.__adminUsersCache[uid] = u;
    try { if (window.fsSetDoc) await window.fsSetDoc('users', uid, u); sent++; } catch(e) {}
  }
  alert(`Notification sent to ${sent} user(s).`);
};

// ============================================================
// Export users to CSV or JSON
// ============================================================
window.adminExportUsers = function(format) {
  const users = Object.values(window.__adminUsersCache || {});
  if (users.length === 0) { alert('No users to export.'); return; }
  const data = window.__adminUsersData || {};
  const commentsByEmail = data.commentsByEmail || {};
  const purchasesByEmail = data.purchasesByEmail || {};
  const stamp = new Date().toISOString().slice(0,10);

  if (format === 'json') {
    const enriched = users.map(u => ({
      ...u,
      _purchases: purchasesByEmail[(u.email||'').toLowerCase()] || 0,
      _comments: commentsByEmail[(u.email||'').toLowerCase()] || 0
    }));
    const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `users-${stamp}.json`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    return;
  }

  // CSV
  const headers = ['UID','Name','Email','Provider','Role','Status','Email Verified','Joined','Last Login','Purchases','Comments','Notes'];
  const csvEscape = v => {
    const s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const rows = users.map(u => [
    u.uid || '',
    u.displayName || '',
    u.email || '',
    u.provider || 'password',
    u.role || 'user',
    u.status || 'active',
    u.emailVerified ? 'yes' : 'no',
    u.createdAt || '',
    u.lastLoginAt || '',
    purchasesByEmail[(u.email||'').toLowerCase()] || 0,
    commentsByEmail[(u.email||'').toLowerCase()] || 0,
    (u.notes || '').replace(/\s+/g,' ')
  ].map(csvEscape).join(','));
  const csv = headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `users-${stamp}.csv`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
};





window.adminImportUsersJson = async function(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    let data = JSON.parse(text);
    // Firebase auth:export format => { users: [...] }
    let arr = Array.isArray(data) ? data : (data.users || data.data || []);
    if (!Array.isArray(arr) || arr.length === 0) { alert('No users found in JSON.'); input.value=''; return; }
    if (!confirm(`Import ${arr.length} users into admin panel?`)) { input.value=''; return; }
    const cache = window.__adminUsersCache || {};
    let added = 0, skipped = 0;
    for (const raw of arr) {
      const uid = raw.localId || raw.uid || raw.id || raw.user_id || (raw.email ? 'imp_' + btoa(raw.email).replace(/=/g,'').slice(0,20) : null);
      if (!uid) { skipped++; continue; }
      const provider = (raw.providerUserInfo && raw.providerUserInfo[0] && raw.providerUserInfo[0].providerId) || raw.provider || 'password';
      const createdAt = raw.createdAt ? (isNaN(+raw.createdAt) ? raw.createdAt : new Date(+raw.createdAt).toISOString()) : (raw.metadata && raw.metadata.creationTime) || new Date().toISOString();
      const lastLoginAt = raw.lastLoginAt ? (isNaN(+raw.lastLoginAt) ? raw.lastLoginAt : new Date(+raw.lastLoginAt).toISOString()) : (raw.metadata && raw.metadata.lastSignInTime) || createdAt;
      const existing = cache[uid] || {};
      const rec = {
        uid,
        email: raw.email || existing.email || '',
        name: raw.displayName || raw.name || existing.name || (raw.email ? raw.email.split('@')[0] : 'User'),
        photoURL: raw.photoUrl || raw.photoURL || existing.photoURL || '',
        provider,
        emailVerified: !!(raw.emailVerified || existing.emailVerified),
        createdAt: existing.createdAt || createdAt,
        lastLoginAt: existing.lastLoginAt || lastLoginAt,
        role: existing.role || 'user',
        status: existing.status || 'active',
        imported: true
      };
      cache[uid] = rec;
      if (window.fsSetDoc) { try { await window.fsSetDoc('users', uid, rec); added++; } catch(e) { skipped++; } }
      else added++;
    }
    window.__adminUsersCache = cache;
    alert(`Imported: ${added}\nSkipped: ${skipped}`);
    input.value = '';
    showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view="adminUsers"]'));
  } catch(e) {
    console.error(e);
    alert('Import failed: ' + e.message);
    input.value = '';
  }
};




// ==================== MESSAGES / CONTACTS INBOX ====================
function adminLoadContacts() {
  try { return JSON.parse(localStorage.getItem('vl_contacts') || '[]'); }
  catch(e) { return []; }
}
function adminSaveContacts(list) {
  localStorage.setItem('vl_contacts', JSON.stringify(list));
  adminUpdateMsgBadge();
}
function adminUpdateMsgBadge() {
  const badge = document.getElementById('adminMsgUnreadBadge');
  if (!badge) return;
  const unread = adminLoadContacts().filter(c => c.status === 'new').length;
  if (unread > 0) { badge.style.display = 'inline-block'; badge.textContent = unread > 99 ? '99+' : unread; }
  else { badge.style.display = 'none'; }
}
window.adminMsgFilter = { q: '', priority: 'ALL', status: 'ALL' };

function adminMsgEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function adminMsgFmtDate(iso) {
  try { const d = new Date(iso); return d.toLocaleString('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
  catch(e) { return iso || '-'; }
}

async function renderAdminContactsNew(container) {
  try {
    const all = adminLoadContacts();
    const f = window.adminMsgFilter;
    let list = all.filter(c => {
      if (f.priority !== 'ALL' && c.priority !== f.priority) return false;
      if (f.status !== 'ALL' && c.status !== f.status) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        const hay = ((c.name||'')+' '+(c.email||'')+' '+(c.subject||'')+' '+(c.message||'')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a,b) => (b.starred?1:0)-(a.starred?1:0) || new Date(b.createdAt||0) - new Date(a.createdAt||0));

    const stats = {
      total: all.length,
      unread: all.filter(c => c.status === 'new').length,
      replied: all.filter(c => c.status === 'replied').length,
      critical: all.filter(c => c.priority === 'CRITICAL').length
    };

    container.innerHTML = `
      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">
        ${[
          {l:'Total',v:stats.total,c:'#3b82f6',i:'fa-inbox'},
          {l:'Unread',v:stats.unread,c:'#ef4444',i:'fa-envelope'},
          {l:'Replied',v:stats.replied,c:'#22c55e',i:'fa-reply'},
          {l:'Critical',v:stats.critical,c:'#f59e0b',i:'fa-triangle-exclamation'}
        ].map(s => `
          <div style="background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
            <div style="width:42px;height:42px;border-radius:10px;background:${s.c}20;color:${s.c};display:flex;align-items:center;justify-content:center;font-size:1.05rem;"><i class="fa-solid ${s.i}"></i></div>
            <div><div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.5px;">${s.l.toUpperCase()}</div><div style="font-size:1.5rem;font-weight:900;color:#0f172a;line-height:1;">${s.v}</div></div>
          </div>`).join('')}
      </div>

      <!-- Toolbar -->
      <div class="admin-panel-card" style="padding:14px;margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <div style="position:relative;flex:1;min-width:200px;">
          <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.85rem;"></i>
          <input id="adminMsgSearch" type="text" placeholder="Search name, email, subject, message…" value="${adminMsgEsc(f.q)}" oninput="window.adminMsgFilter.q=this.value;renderAdminContactsNew(document.getElementById('adminContent'))" style="width:100%;padding:10px 12px 10px 36px;border:1px solid rgba(15,23,42,0.12);border-radius:10px;font-size:0.88rem;background:#f8fafc;">
        </div>
        <select onchange="window.adminMsgFilter.priority=this.value;renderAdminContactsNew(document.getElementById('adminContent'))" style="padding:10px 12px;border:1px solid rgba(15,23,42,0.12);border-radius:10px;font-size:0.85rem;background:#fff;font-weight:600;color:#0f172a;">
          <option value="ALL" ${f.priority==='ALL'?'selected':''}>All Priority</option>
          <option value="CRITICAL" ${f.priority==='CRITICAL'?'selected':''}>Critical</option>
          <option value="HIGH" ${f.priority==='HIGH'?'selected':''}>High</option>
          <option value="NORMAL" ${f.priority==='NORMAL'?'selected':''}>Normal</option>
        </select>
        <select onchange="window.adminMsgFilter.status=this.value;renderAdminContactsNew(document.getElementById('adminContent'))" style="padding:10px 12px;border:1px solid rgba(15,23,42,0.12);border-radius:10px;font-size:0.85rem;background:#fff;font-weight:600;color:#0f172a;">
          <option value="ALL" ${f.status==='ALL'?'selected':''}>All Status</option>
          <option value="new" ${f.status==='new'?'selected':''}>Unread</option>
          <option value="read" ${f.status==='read'?'selected':''}>Read</option>
          <option value="replied" ${f.status==='replied'?'selected':''}>Replied</option>
        </select>
        <button onclick="adminMsgExportCSV()" style="padding:10px 14px;background:#0f172a;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-download"></i> Export CSV</button>
        <button onclick="adminMsgMarkAllRead()" style="padding:10px 14px;background:#22c55e;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-check-double"></i> Mark All Read</button>
        <button onclick="adminMsgClearAll()" style="padding:10px 14px;background:#fee2e2;color:#b91c1c;border:none;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;"><i class="fa-solid fa-trash"></i> Clear All</button>
      </div>

      <!-- Inbox -->
      <div class="admin-panel-card" style="padding:0;overflow:hidden;">
        ${list.length === 0 ? `
          <div class="admin-empty" style="padding:60px 20px;"><i class="fa-solid fa-inbox"></i><p>${all.length === 0 ? 'No messages yet. When someone submits the footer contact form, it will appear here.' : 'No messages match your filters.'}</p></div>
        ` : `
          <div style="max-height:calc(100vh - 400px);overflow:auto;">
            ${list.map(c => {
              const pColor = c.priority==='CRITICAL'?'#ef4444':c.priority==='HIGH'?'#f59e0b':'#3b82f6';
              const isNew = c.status === 'new';
              return `
              <div onclick="adminMsgOpen('${c.id}')" style="padding:16px 20px;border-bottom:1px solid rgba(15,23,42,0.06);cursor:pointer;display:flex;gap:14px;align-items:flex-start;background:${isNew?'rgba(59,130,246,0.04)':'#fff'};transition:background 0.15s;" onmouseover="this.style.background='rgba(255,107,53,0.05)'" onmouseout="this.style.background='${isNew?'rgba(59,130,246,0.04)':'#fff'}'">
                <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,${pColor},${pColor}cc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.95rem;flex-shrink:0;">${adminMsgEsc((c.name||'?')[0].toUpperCase())}</div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                    <span style="font-weight:${isNew?'800':'600'};color:#0f172a;font-size:0.92rem;">${adminMsgEsc(c.name)}</span>
                    ${c.starred ? '<i class="fa-solid fa-star" style="color:#f59e0b;font-size:0.75rem;"></i>' : ''}
                    <span style="background:${pColor}22;color:${pColor};padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:800;letter-spacing:0.5px;">${c.priority}</span>
                    ${isNew ? '<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:800;">NEW</span>' : ''}
                    ${c.status==='replied' ? '<span style="background:#22c55e22;color:#22c55e;padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:800;">REPLIED</span>' : ''}
                    <span style="margin-left:auto;font-size:0.72rem;color:#94a3b8;">${adminMsgFmtDate(c.createdAt)}</span>
                  </div>
                  <div style="font-size:0.85rem;color:#334155;font-weight:${isNew?'700':'500'};margin-bottom:3px;">${adminMsgEsc(c.subject||'(no subject)')}</div>
                  <div style="font-size:0.8rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${adminMsgEsc((c.message||'').slice(0,140))}</div>
                  <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;"><i class="fa-solid fa-envelope"></i> ${adminMsgEsc(c.email)}</div>
                </div>
              </div>`;
            }).join('')}
          </div>`}
      </div>
    `;
    adminUpdateMsgBadge();
  } catch(e) {
    console.error('renderAdminContactsNew error:', e);
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error: ${e.message}</p></div>`;
  }
}

function adminMsgOpen(id) {
  const list = adminLoadContacts();
  const c = list.find(x => x.id === id);
  if (!c) return;
  if (c.status === 'new') { c.status = 'read'; adminSaveContacts(list); }
  const pColor = c.priority==='CRITICAL'?'#ef4444':c.priority==='HIGH'?'#f59e0b':'#3b82f6';
  const waPhone = (c.email||'').match(/\d{7,}/) ? (c.email.match(/\d{7,}/)[0]) : '';
  const modal = document.createElement('div');
  modal.id = 'adminMsgModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:#fff;border-radius:18px;max-width:640px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
      <div style="padding:22px 26px;border-bottom:1px solid rgba(15,23,42,0.08);display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${pColor},${pColor}cc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.2rem;">${adminMsgEsc((c.name||'?')[0].toUpperCase())}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;color:#0f172a;font-size:1.05rem;">${adminMsgEsc(c.name)}</div>
          <div style="font-size:0.82rem;color:#64748b;">${adminMsgEsc(c.email)}</div>
        </div>
        <span style="background:${pColor}22;color:${pColor};padding:4px 10px;border-radius:8px;font-size:0.72rem;font-weight:800;">${c.priority}</span>
        <button onclick="document.getElementById('adminMsgModal').remove()" style="width:36px;height:36px;border-radius:10px;border:none;background:#f1f5f9;color:#64748b;cursor:pointer;font-size:1rem;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:22px 26px;">
        <div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">SUBJECT</div>
        <div style="font-size:1.05rem;font-weight:700;color:#0f172a;margin-bottom:16px;">${adminMsgEsc(c.subject||'(no subject)')}</div>
        <div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">MESSAGE</div>
        <div style="background:#f8fafc;border:1px solid rgba(15,23,42,0.06);border-radius:12px;padding:16px;font-size:0.9rem;color:#334155;line-height:1.6;white-space:pre-wrap;margin-bottom:16px;">${adminMsgEsc(c.message)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.78rem;color:#64748b;margin-bottom:20px;">
          <div><i class="fa-solid fa-clock" style="color:#94a3b8;"></i> ${adminMsgFmtDate(c.createdAt)}</div>
          <div><i class="fa-solid fa-tag" style="color:#94a3b8;"></i> Status: <b style="color:#0f172a;">${c.status}</b></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <a href="mailto:${adminMsgEsc(c.email)}?subject=${encodeURIComponent('Re: '+(c.subject||''))}&body=${encodeURIComponent('Hi '+(c.name||'')+',\n\nThank you for reaching out to Vextro Lyntra.\n\n')}" onclick="adminMsgMarkReplied('${c.id}')" style="flex:1;min-width:120px;text-align:center;padding:11px 14px;background:#ff6b35;color:#fff;border-radius:10px;font-weight:700;font-size:0.85rem;text-decoration:none;"><i class="fa-solid fa-reply"></i> Reply Email</a>
          ${waPhone ? `<a href="https://wa.me/${waPhone}?text=${encodeURIComponent('Hi '+(c.name||'')+', regarding your message about "'+(c.subject||'')+'"...')}" target="_blank" style="flex:1;min-width:120px;text-align:center;padding:11px 14px;background:#22c55e;color:#fff;border-radius:10px;font-weight:700;font-size:0.85rem;text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
          <button onclick="adminMsgToggleStar('${c.id}')" style="padding:11px 14px;background:${c.starred?'#f59e0b':'#f1f5f9'};color:${c.starred?'#fff':'#64748b'};border:none;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;"><i class="fa-${c.starred?'solid':'regular'} fa-star"></i> ${c.starred?'Starred':'Star'}</button>
          <button onclick="adminMsgMarkReplied('${c.id}',true)" style="padding:11px 14px;background:#22c55e;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;"><i class="fa-solid fa-check"></i> Mark Replied</button>
          <button onclick="adminMsgDelete('${c.id}')" style="padding:11px 14px;background:#fee2e2;color:#b91c1c;border:none;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function adminMsgToggleStar(id) {
  const list = adminLoadContacts();
  const c = list.find(x => x.id === id);
  if (!c) return;
  c.starred = !c.starred;
  adminSaveContacts(list);
  const m = document.getElementById('adminMsgModal'); if (m) m.remove();
  renderAdminContactsNew(document.getElementById('adminContent'));
}
function adminMsgMarkReplied(id, closeModal) {
  const list = adminLoadContacts();
  const c = list.find(x => x.id === id);
  if (!c) return;
  c.status = 'replied';
  adminSaveContacts(list);
  if (closeModal) { const m = document.getElementById('adminMsgModal'); if (m) m.remove(); }
  renderAdminContactsNew(document.getElementById('adminContent'));
}
function adminMsgDelete(id) {
  if (!confirm('Delete this message permanently?')) return;
  let list = adminLoadContacts();
  list = list.filter(x => x.id !== id);
  adminSaveContacts(list);
  try { if (typeof firebase !== 'undefined' && firebase.firestore) firebase.firestore().collection('contacts').doc(id).delete().catch(()=>{}); } catch(e){}
  const m = document.getElementById('adminMsgModal'); if (m) m.remove();
  renderAdminContactsNew(document.getElementById('adminContent'));
}
function adminMsgMarkAllRead() {
  const list = adminLoadContacts();
  list.forEach(c => { if (c.status === 'new') c.status = 'read'; });
  adminSaveContacts(list);
  renderAdminContactsNew(document.getElementById('adminContent'));
}
function adminMsgClearAll() {
  if (!confirm('Delete ALL messages permanently? This cannot be undone.')) return;
  adminSaveContacts([]);
  renderAdminContactsNew(document.getElementById('adminContent'));
}
function adminMsgExportCSV() {
  const list = adminLoadContacts();
  if (!list.length) { alert('No messages to export.'); return; }
  const esc = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const rows = [['Date','Name','Email','Subject','Priority','Status','Message']];
  list.forEach(c => rows.push([c.createdAt,c.name,c.email,c.subject,c.priority,c.status,c.message]));
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'vextro-messages-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click(); URL.revokeObjectURL(url);
}

// Update badge on admin load
setTimeout(() => { try { adminUpdateMsgBadge(); } catch(e){} }, 800);


async function renderAdminStatsNew(container) {
  container.innerHTML = `<div class="admin-empty" style="padding:60px 20px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:#ff6b35;"></i><p style="margin-top:12px;color:#64748b;">Loading analytics…</p></div>`;
  try {
    // ---- Load all data in parallel ----
    const [ordersMap, usersMap, contactsMap, commentsMap, blogsList] = await Promise.all([
      (window.fsLoadMap ? window.fsLoadMap('orders').catch(()=>({})) : Promise.resolve({})),
      (window.fsLoadMap ? window.fsLoadMap('users').catch(()=>({})) : Promise.resolve({})),
      (window.fsLoadMap ? window.fsLoadMap('contacts').catch(()=>({})) : Promise.resolve({})),
      (window.fsLoadMap ? window.fsLoadMap('blog_comments').catch(()=>({})) : Promise.resolve({})),
      Promise.resolve(window.allBlogs || []),
    ]);
    // Fallback to localStorage for orders
    let ordersObj = ordersMap || {};
    if (!ordersObj || Object.keys(ordersObj).length === 0) {
      try { ordersObj = JSON.parse(localStorage.getItem('admin_orders') || '{}'); } catch(e) { ordersObj = {}; }
    }

    const orders = Object.values(ordersObj || {});
    const users = Object.values(usersMap || {});
    const contacts = Object.values(contactsMap || {});
    const productCount = Object.keys(window.PRODUCTS_DATA || {}).length;
    const listingCount = Object.keys(window.MARKETPLACE_DATA || {}).length;
    const blogCount = blogsList.length;

    // ---- Metrics ----
    const totalRevenue   = orders.filter(o => o.paymentStatus === 'paid').reduce((s,o) => s + Number(o.amount||0), 0);
    const pendingRevenue = orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled' && o.status !== 'refunded').reduce((s,o) => s + Number(o.amount||0), 0);
    const paidOrders     = orders.filter(o => o.paymentStatus === 'paid').length;
    const pendingOrders  = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const avgOrderValue  = paidOrders ? (totalRevenue / paidOrders) : 0;

    const newContacts    = contacts.filter(c => !c.status || c.status === 'new' || c.status === 'unread').length;
    const bannedUsers    = users.filter(u => u.banned || u.blocked).length;
    const adminUsers     = users.filter(u => u.role === 'admin').length;

    // Total blog views (sum of real views + comments)
    let totalBlogViews = 0, totalBlogComments = 0;
    (blogsList || []).forEach(b => { totalBlogViews += Number(b.views||0); });
    Object.values(commentsMap || {}).forEach(entry => {
      if (entry && Array.isArray(entry.items)) totalBlogComments += entry.items.length;
    });

    // Signups & orders last 7 / 30 days
    const now = Date.now(), day = 86400000;
    const in7d = (t) => t && (now - t) < 7*day;
    const in30d = (t) => t && (now - t) < 30*day;
    const newUsers7d  = users.filter(u => in7d(u.createdAt || u.joinedAt)).length;
    const newUsers30d = users.filter(u => in30d(u.createdAt || u.joinedAt)).length;
    const orders7d    = orders.filter(o => in7d(o.createdAt)).length;
    const orders30d   = orders.filter(o => in30d(o.createdAt)).length;
    const revenue30d  = orders.filter(o => in30d(o.createdAt) && o.paymentStatus === 'paid').reduce((s,o) => s + Number(o.amount||0), 0);

    // Revenue by service (top breakdown)
    const revByService = {};
    orders.forEach(o => {
      if (o.paymentStatus !== 'paid') return;
      const k = o.service || 'Other';
      revByService[k] = (revByService[k] || 0) + Number(o.amount||0);
    });
    const topServices = Object.entries(revByService).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const maxSvc = topServices.length ? topServices[0][1] : 1;

    // 14-day revenue sparkline
    const days = 14;
    const buckets = new Array(days).fill(0);
    orders.forEach(o => {
      if (o.paymentStatus !== 'paid' || !o.createdAt) return;
      const diff = Math.floor((now - o.createdAt) / day);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += Number(o.amount||0);
    });
    const maxBucket = Math.max(1, ...buckets);

    // Recent activity feed
    const activity = [];
    orders.forEach(o => activity.push({ ts: o.createdAt||0, icon: 'fa-receipt', color: '#ff6b35', text: `New order <b>#${(o.id||'').slice(0,6).toUpperCase()}</b> from ${escapeHtml(o.buyerName||'-')} — ${fmtMoney(o.amount)}` }));
    users.forEach(u => { if (u.createdAt || u.joinedAt) activity.push({ ts: u.createdAt||u.joinedAt, icon: 'fa-user-plus', color: '#3b82f6', text: `New user signup: <b>${escapeHtml(u.displayName||u.name||u.email||'User')}</b>` }); });
    contacts.forEach(c => activity.push({ ts: c.createdAt||c.timestamp||0, icon: 'fa-envelope', color: '#8b5cf6', text: `Message from <b>${escapeHtml(c.name||c.email||'Visitor')}</b>` }));
    const recent = activity.filter(a => a.ts).sort((a,b) => b.ts - a.ts).slice(0, 8);

    const statCard = (label, val, sub, icon, grad, onClick) => `
      <div class="admin-stat-card" ${onClick?`onclick="${onClick}" style="background:${grad};cursor:pointer;"`:`style="background:${grad};"`}>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:0.75rem;opacity:0.85;margin-bottom:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${label}</div>
            <div style="font-size:2rem;font-weight:900;line-height:1;">${val}</div>
          </div>
          <div style="width:44px;height:44px;background:rgba(255,255,255,0.18);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.15rem;"><i class="${icon}"></i></div>
        </div>
        <div style="margin-top:14px;font-size:0.78rem;opacity:0.85;">${sub}</div>
      </div>`;

    container.innerHTML = `
      <!-- Welcome Banner -->
      <div style="background:linear-gradient(135deg,rgba(255,107,53,0.15),rgba(59,130,246,0.1));border:1px solid rgba(255,107,53,0.2);border-radius:20px;padding:26px 34px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:20px;">
        <div>
          <div style="font-size:0.78rem;color:#ff6b35;font-weight:700;letter-spacing:1px;margin-bottom:6px;">WELCOME BACK</div>
          <h2 style="margin:0;font-size:1.7rem;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">Vextro Lyntra Admin</h2>
          <p style="margin:6px 0 0;color:#64748b;font-size:0.9rem;">Yeh raha aapke platform ka full overview.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="adminNewOrder()" style="padding:11px 20px;background:#ff6b35;border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;font-size:0.85rem;box-shadow:0 4px 12px rgba(255,107,53,0.3);"><i class="fa-solid fa-plus"></i> New Order</button>
          <button onclick="showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view=\\'adminBlogs\\']'))" style="padding:11px 20px;background:rgba(15,23,42,0.05);border:1px solid rgba(15,23,42,0.12);border-radius:10px;color:#0f172a;font-weight:700;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-newspaper"></i> New Blog</button>
        </div>
      </div>

      <!-- Primary Revenue Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin-bottom:20px;">
        ${statCard('Total Revenue', fmtMoney(totalRevenue), `${paidOrders} paid orders`, 'fa-solid fa-sack-dollar', 'linear-gradient(135deg,#059669,#10b981)', "showAdminView('adminOrders', document.querySelector('.admin-sidebar-item[data-view=\\'adminOrders\\']'))")}
        ${statCard('Pending Revenue', fmtMoney(pendingRevenue), `${pendingOrders} orders in queue`, 'fa-solid fa-hourglass-half', 'linear-gradient(135deg,#d97706,#f59e0b)', "showAdminView('adminOrders', document.querySelector('.admin-sidebar-item[data-view=\\'adminOrders\\']'))")}
        ${statCard('Avg Order Value', fmtMoney(avgOrderValue), `Last 30d: ${fmtMoney(revenue30d)}`, 'fa-solid fa-chart-line', 'linear-gradient(135deg,#7c3aed,#8b5cf6)')}
        ${statCard('Orders (30d)', orders30d, `${orders7d} this week`, 'fa-solid fa-receipt', 'linear-gradient(135deg,#ff6b35,#f7931e)', "showAdminView('adminOrders', document.querySelector('.admin-sidebar-item[data-view=\\'adminOrders\\']'))")}
      </div>

      <!-- Secondary Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
        ${statCard('Users', users.length, `+${newUsers7d} this week`, 'fa-solid fa-users', 'linear-gradient(135deg,#1d4ed8,#3b82f6)', "showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view=\\'adminUsers\\']'))")}
        ${statCard('New Messages', newContacts, `${contacts.length} total`, 'fa-solid fa-envelope', 'linear-gradient(135deg,#be185d,#ec4899)', "showAdminView('adminContacts', document.querySelector('.admin-sidebar-item[data-view=\\'adminContacts\\']'))")}
        ${statCard('Blog Views', totalBlogViews.toLocaleString(), `${totalBlogComments} comments`, 'fa-solid fa-eye', 'linear-gradient(135deg,#0891b2,#06b6d4)', "showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view=\\'adminBlogs\\']'))")}
        ${statCard('Products', productCount, `${listingCount} listings`, 'fa-solid fa-box', 'linear-gradient(135deg,#065f46,#10b981)', "showAdminView('products', document.querySelector('.admin-sidebar-item[data-view=\\'products\\']'))")}
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;" class="admin-chart-grid">
        <!-- Revenue Sparkline -->
        <div class="admin-panel-card" style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <div style="font-weight:700;color:#0f172a;font-size:1rem;">Revenue — Last 14 Days</div>
              <div style="color:#94a3b8;font-size:0.8rem;margin-top:2px;">Paid orders only</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.4rem;font-weight:800;color:#059669;">${fmtMoney(buckets.reduce((a,b)=>a+b,0))}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">14-day total</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-end;gap:6px;height:160px;padding:0 4px;">
            ${buckets.map((v,i) => {
              const h = Math.max(4, (v / maxBucket) * 150);
              const date = new Date(now - (days-1-i)*day);
              const label = date.getDate() + '/' + (date.getMonth()+1);
              return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;" title="${label}: ${fmtMoney(v)}">
                <div style="width:100%;height:${h}px;background:linear-gradient(180deg,#ff6b35,#f7931e);border-radius:6px 6px 0 0;transition:all 0.3s;position:relative;" onmouseover="this.style.transform='scaleY(1.03)'" onmouseout="this.style.transform='scaleY(1)'"></div>
                <div style="font-size:0.65rem;color:#94a3b8;font-weight:600;">${label}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Top Services -->
        <div class="admin-panel-card" style="padding:24px;">
          <div style="font-weight:700;color:#0f172a;font-size:1rem;margin-bottom:18px;">Top Services by Revenue</div>
          ${topServices.length === 0 ? `<div style="text-align:center;color:#94a3b8;padding:40px 0;font-size:0.85rem;"><i class="fa-solid fa-chart-pie" style="font-size:2rem;opacity:0.4;"></i><p style="margin-top:10px;">No paid orders yet</p></div>` : topServices.map(([svc, amt]) => `
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:6px;">
                <span style="color:#0f172a;font-weight:600;">${escapeHtml(svc)}</span>
                <span style="color:#ff6b35;font-weight:700;">${fmtMoney(amt)}</span>
              </div>
              <div style="height:8px;background:#f1f5f9;border-radius:20px;overflow:hidden;">
                <div style="height:100%;width:${(amt/maxSvc)*100}%;background:linear-gradient(90deg,#ff6b35,#f7931e);border-radius:20px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Activity Feed & Health -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;" class="admin-chart-grid">
        <div class="admin-panel-card">
          <div style="padding:20px 24px;border-bottom:1px solid rgba(15,23,42,0.08);font-weight:700;color:#0f172a;">Recent Activity</div>
          <div style="padding:8px 0;">
            ${recent.length === 0 ? `<div class="admin-empty" style="padding:40px 20px;"><i class="fa-solid fa-clock-rotate-left"></i><p style="color:#94a3b8;">No activity yet</p></div>` : recent.map(a => `
              <div style="display:flex;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(15,23,42,0.04);align-items:center;">
                <div style="width:36px;height:36px;border-radius:10px;background:${a.color}22;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${a.icon}"></i></div>
                <div style="flex:1;min-width:0;">
                  <div style="color:#0f172a;font-size:0.88rem;">${a.text}</div>
                  <div style="color:#94a3b8;font-size:0.75rem;margin-top:2px;">${fmtRelative(a.ts)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="admin-panel-card" style="padding:22px;">
          <div style="font-weight:700;color:#0f172a;font-size:1rem;margin-bottom:16px;">Platform Health</div>
          ${[
            ['Total Users', users.length, '#3b82f6', 'fa-users'],
            ['Admins', adminUsers, '#ff6b35', 'fa-user-shield'],
            ['Banned', bannedUsers, '#ef4444', 'fa-ban'],
            ['Blog Posts', blogCount, '#8b5cf6', 'fa-newspaper'],
            ['Total Comments', totalBlogComments, '#06b6d4', 'fa-comments'],
            ['Contact Msgs', contacts.length, '#ec4899', 'fa-envelope'],
          ].map(([lbl, val, color, icon]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(15,23,42,0.05);">
              <div style="display:flex;align-items:center;gap:10px;"><i class="fa-solid ${icon}" style="color:${color};width:16px;"></i><span style="color:#475569;font-size:0.85rem;">${lbl}</span></div>
              <span style="color:#0f172a;font-weight:700;font-size:0.95rem;">${val}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="admin-panel-card" style="padding:22px;">
        <div style="font-weight:700;color:#0f172a;font-size:1rem;margin-bottom:16px;">⚡ Quick Actions</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <button onclick="adminNewOrder()" style="padding:10px 18px;background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:10px;color:#ff6b35;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-receipt"></i> New Order</button>
          <button onclick="adminAddProductNew()" style="padding:10px 18px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;color:#10b981;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-plus"></i> Add Product</button>
          <button onclick="showAdminView('adminBlogs', document.querySelector('.admin-sidebar-item[data-view=\\'adminBlogs\\']'))" style="padding:10px 18px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;color:#3b82f6;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-newspaper"></i> Manage Blogs</button>
          <button onclick="showAdminView('adminUsers', document.querySelector('.admin-sidebar-item[data-view=\\'adminUsers\\']'))" style="padding:10px 18px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;color:#f59e0b;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-users"></i> View Users</button>
          <button onclick="showAdminView('adminContacts', document.querySelector('.admin-sidebar-item[data-view=\\'adminContacts\\']'))" style="padding:10px 18px;background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.3);border-radius:10px;color:#ec4899;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-envelope"></i> Messages ${newContacts?`<span style="background:#ef4444;color:#fff;padding:1px 8px;border-radius:20px;font-size:0.7rem;margin-left:4px;">${newContacts}</span>`:''}</button>
          <button onclick="adminGoToSite()" style="padding:10px 18px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;color:#8b5cf6;font-weight:600;cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-globe"></i> View Live Site</button>
        </div>
      </div>

      <style>
        @media(max-width:900px){ .admin-chart-grid{ grid-template-columns: 1fr !important; } }
      </style>
    `;
  } catch(e) {
    container.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Error loading analytics</p></div>`;
    console.error('Admin stats error:', e);
  }
}

function fmtRelative(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (diff < 60000) return 'just now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  if (d < 30) return d + 'd ago';
  try { return new Date(ts).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }); } catch(e) { return ''; }
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
      removeAdminDashboard();
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
