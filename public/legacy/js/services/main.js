/**
 * Main JavaScript File for Vextro Lyntra Web
 * Handles UI interactions, page navigation, blog posts, and marketplace loading.
 */

// Persistence helpers for admin changes (Firestore + localStorage fallback)
window.vextroSave = function(key, data) {
  try { localStorage.setItem('vextro_' + key, JSON.stringify(data)); } catch(e) {}
  if (window.fsSaveMap) window.fsSaveMap(key, data);
};
window.vextroLoad = function(key) {
  try { const d = localStorage.getItem('vextro_' + key); return d ? JSON.parse(d) : null; } catch(e) { return null; }
};

// Initialize Firebase Auth
const firebaseConfig = {
  apiKey: "AIzaSyAvlaKbCKqv1Z_sYAFhmmn-un2hYiWXEPc",
  authDomain: "vextro-lyntra.firebaseapp.com",
  projectId: "vextro-lyntra",
  storageBucket: "vextro-lyntra.firebasestorage.app",
  messagingSenderId: "327851944469",
  appId: "1:327851944469:web:208c5363e73856af99fc1c"
};
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
  } catch(e) {
    console.warn('Firebase init:', e.message);
  }
}

// Initialize EmailJS
const EMAILJS_SERVICE_ID = 'service_60ugcjb';
const EMAILJS_TEMPLATE_ID = 'fa4k04x';
const EMAILJS_PUBLIC_KEY = '8zOJpAjU7J2LOGB0l';
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Global Blog States
let allBlogs = [];
let currentCategory = 'All';
let searchQuery = '';

// Global Guides Data
let currentGuideId = 'intro';
let guideSearchQuery = '';
const allGuides = [
    {
        id: "intro",
        title: "Introduction to Vextro Lyntra",
        category: "Getting Started",
        tags: ["welcome", "overview", "platform"],
        content: `
            <h2>Welcome to Vextro Lyntra Documentation</h2>
            <p>Vextro Lyntra is your ultimate workspace for premium, production-ready digital assets, automation scripts, Chrome extensions, and developer source codes. Our platform is built by developers, for developers, designed to supercharge your online business instantly.</p>
            
            <div class="guide-alert guide-alert-info">
                <i class="fa-solid fa-circle-info alert-icon"></i>
                <div class="alert-content">
                    <strong>Pro Tip:</strong> All scripts downloaded from our marketplace undergo rigorous security audits to ensure zero vulnerabilities and maximum execution speeds.
                </div>
            </div>

            <h3>What You Will Find in Our Catalog:</h3>
            <ul>
                <li><strong>Browser Extensions:</strong> Fully isolated automation scripts for high-frequency traffic modeling, proxy rotation, and click-simulation.</li>
                <li><strong>Code Scripts:</strong> Production-ready snippets and microservices built with Vanilla JS, React, and Python.</li>
                <li><strong>Bypass Tools:</strong> Advanced security bypass configs, automated user-agent spoofers, and session cookies loaders.</li>
            </ul>

            <h3>Instant Delivery & Integration</h3>
            <p>Every product purchased from our Shop is delivered instantly to your dashboard and registered email address. You also receive life-time support and regular automatic updates.</p>
        `
    },
    {
        id: "chrome-extension",
        title: "Chrome Extension Installation Guide",
        category: "Scripts & Tools Setup",
        tags: ["chrome", "extension", "setup"],
        content: `
            <h2>How to Install Chrome Extensions Unpacked</h2>
            <p>Most of our premium browser extension source files are delivered as unpacked developer files to give you 100% control over the source code. Follow these simple steps to install them in Google Chrome:</p>

            <div class="guide-steps">
                <div class="guide-step">
                    <span class="step-number">1</span>
                    <div class="step-text">
                        <strong>Download & Extract:</strong> Download the extension ZIP file from your Vextro Lyntra dashboard and extract it to a dedicated folder on your local machine.
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">2</span>
                    <div class="step-text">
                        <strong>Open Extensions Page:</strong> Open Google Chrome and type <code>chrome://extensions/</code> in the URL address bar, then press Enter.
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">3</span>
                    <div class="step-text">
                        <strong>Enable Developer Mode:</strong> Toggle the <strong>"Developer mode"</strong> switch in the top-right corner of the Extensions dashboard to activate it.
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">4</span>
                    <div class="step-text">
                        <strong>Load Unpacked Extension:</strong> Click the <strong>"Load unpacked"</strong> button in the top-left corner, navigate to your extracted folder, select it, and click open.
                    </div>
                </div>
            </div>

            <div class="guide-alert guide-alert-warning">
                <i class="fa-solid fa-triangle-exclamation alert-icon"></i>
                <div class="alert-content">
                    <strong>Important Note:</strong> Do not move or delete the folder after loading it into Chrome! The browser directly reads files from this folder. If you move it, the extension will deactivate.
                </div>
            </div>

            <h3>Manifest Configuration File</h3>
            <p>A typical premium Vextro extension includes a robust, security-audited <code>manifest.json</code> configuration block: </p>

            <div class="code-container">
                <button class="copy-code-btn" onclick="copyCode(this)">Copy Code</button>
                <pre><code>{
  "manifest_version": 3,
  "name": "Vextro Lyntra Traffic Automator",
  "version": "1.2.0",
  "permissions": [
    "declarativeNetRequest",
    "storage",
    "proxy"
  ]
}</code></pre>
            </div>
        `
    },
    {
        id: "proxy-setup",
        title: "Rotated Proxies Setup in Python",
        category: "Scripts & Tools Setup",
        tags: ["proxy", "rotation", "python"],
        content: `
            <h2>Rotated Proxies Setup & Configuration</h2>
            <p>For high-frequency web request pipelines, automated testing, or data gathering scripts, integrating dynamic rotated proxies is essential to prevent IP rate-limiting and access blocks.</p>

            <h3>Standard Python Integration</h3>
            <p>Below is the recommended clean-code integration pattern to load credentials securely and rotate proxies using the standard Python <code>requests</code> framework:</p>

            <div class="code-container">
                <button class="copy-code-btn" onclick="copyCode(this)">Copy Code</button>
                <pre><code>import requests

# Set proxy credentials securely
PROXY_HOST = "rotated.proxy-service.com"
PROXY_PORT = "8000"
PROXY_USER = "vextro_user123"
PROXY_PASS = "securePass789"

proxies = {
    "http": f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}",
    "https": f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"
}

try:
    response = requests.get("https://api.ipify.org?format=json", proxies=proxies, timeout=10)
    print("Success! Automated request routed via IP:", response.json()["ip"])
except Exception as e:
    print("Connection failed:", e)</code></pre>
            </div>

            <div class="guide-alert guide-alert-info">
                <i class="fa-solid fa-circle-info alert-icon"></i>
                <div class="alert-content">
                    <strong>Pro Tip:</strong> For Chrome extensions, proxy rotators are configured inside background service workers using the native <code>chrome.proxy</code> API namespace.
                </div>
            </div>
        `
    },
    {
        id: "refund-support",
        title: "Refunds, Licensing & Live Support",
        category: "Account & Billing",
        tags: ["refund", "billing", "support"],
        content: `
            <h2>Licensing, Refunds & Direct Support Channels</h2>
            <p>We believe in absolute transparency and want to ensure a secure, worry-free shopping experience for our digital products. Here is how our licenses and support channels operate:</p>

            <h3>1. Instant Digital License Delivery</h3>
            <p>Upon completing your purchase, your digital products and single-domain activation licenses are added to your personal dashboard and sent via automated email instantly. No waiting periods, no delays.</p>

            <h3>2. Transparent Refund Window</h3>
            <div class="guide-alert guide-alert-success">
                <i class="fa-solid fa-circle-check alert-icon"></i>
                <div class="alert-content">
                    <strong>Standard Policy:</strong> We offer a <strong>100% money-back guarantee within 48 hours</strong> of purchase if any digital script or extension is found to be broken, incomplete, or fails to execute as described.
                </div>
            </div>

            <h3>3. Contact Expert (Aftab) - Live Channels</h3>
            <p>Need custom script development, bug fixes, or installation assistance? Contact our team directly through our live channels:</p>
            <ul>
                <li><strong>WhatsApp / Phone Support:</strong> <code>+92 328 127 0900</code></li>
                <li><strong>Email Support:</strong> <code>vextrolyntra@gmail.com</code></li>
            </ul>
        `
    }
];

// Page Navigation Logic
function showPage(page, subview) {
    // Prevent default browser link navigation behavior when called from click events
    if (window.event && typeof window.event.preventDefault === 'function') {
        window.event.preventDefault();
    }

    // Always scroll to top when navigating between pages (important for mobile)
    window.scrollTo({ top: 0, behavior: 'instant' });

    const home = document.getElementById('homePage');
    const blogs = document.getElementById('blogsPage');
    const shop = document.getElementById('shopPage');
    const marketplace = document.getElementById('marketplacePage');
    const guide = document.getElementById('guidePage');
    const about = document.getElementById('aboutPage');
    const privacy = document.getElementById('privacyPage');
    const terms = document.getElementById('termsPage');
    const refund = document.getElementById('refundPage');
    const contact = document.getElementById('contactPage');
    const founder = document.getElementById('founderPage');
    const faq = document.getElementById('faqPage');
    const emailSupport = document.getElementById('emailSupportPage');
    const authPage = document.getElementById('authPage');
    const dashboard = document.getElementById('dashboardPage');
    const servicesMain = document.getElementById('servicesMainPage');
    const servicesPage = document.getElementById('servicesPage');
    const navItems = document.querySelectorAll('.nav-item');
    const desktopLinks = document.querySelectorAll('#desktopNavLinks .nav-link-item');

    // Update location path to enable refresh and back/forward persistence without #
    const pageKey = page || 'home';
    if (pageKey === 'home') {
        if (location.pathname !== '/' && location.pathname !== '/index.html') {
            history.pushState(null, null, '/');
        }
    } else {
        if (location.pathname !== '/' + pageKey) {
            history.pushState(null, null, '/' + pageKey);
        }
    }

    // Hide all pages
    if(home) home.style.display = 'none';
    if(blogs) blogs.style.display = 'none';
    if(shop) shop.style.display = 'none';
    if(marketplace) marketplace.style.display = 'none';
    if(guide) guide.style.display = 'none';
    if(about) about.style.display = 'none';
    if(privacy) privacy.style.display = 'none';
    if(terms) terms.style.display = 'none';
    if(refund) refund.style.display = 'none';
    if(contact) contact.style.display = 'none';
    if(founder) founder.style.display = 'none';
    if(faq) faq.style.display = 'none';
    if(emailSupport) emailSupport.style.display = 'none';
    if(authPage) authPage.style.display = 'none';
    if(dashboard) dashboard.style.display = 'none';
    if(servicesMain) servicesMain.style.display = 'none';
    if(servicesPage) servicesPage.style.display = 'none';
    const cbPage = document.getElementById('createBlogPage');
    if(cbPage) cbPage.style.display = 'none';
    const productDetailPage = document.getElementById('productDetailPage');
    if(productDetailPage) productDetailPage.style.display = 'none';
    const pd = document.getElementById('productDetailPage');
    if(pd) pd.style.display = 'none';

    // Remove active classes from mobile nav & desktop links
    navItems.forEach(item => item.classList.remove('active'));
    desktopLinks.forEach(link => link.classList.remove('active'));

    // Show selected page
    if (page === 'shop') {
        if(shop) shop.style.display = 'block';
        if(navItems[1]) navItems[1].classList.add('active');
        if(desktopLinks[0]) desktopLinks[0].classList.add('active');
        // Render products when navigating to shop
        if (window.renderShopProducts) {
            window.renderShopProducts();
            window.applyShopFiltersAndSort();
        }
    } else if (page === 'blogs') {
        if(blogs) blogs.style.display = 'block';
        if(desktopLinks[1]) desktopLinks[1].classList.add('active');
        // Fetch blogs if not already fetched
        if (allBlogs.length === 0) {
            fetchBlogs();
        } else {
            renderBlogs(allBlogs);
        }
    } else if (page === 'marketplace') {
        if(marketplace) marketplace.style.display = 'block';
        if(navItems[2]) navItems[2].classList.add('active');
        if(desktopLinks[2]) desktopLinks[2].classList.add('active');
    } else if (page === 'guide') {
        if(guide) guide.style.display = 'block';
        if(desktopLinks[3]) desktopLinks[3].classList.add('active');
        initGuides();
    } else if (page === 'servicesMain') {
        if(servicesMain) servicesMain.style.display = 'block';
        if (window.renderMainServices) window.renderMainServices();
    } else if (page === 'services') {
        if(servicesPage) servicesPage.style.display = 'block';
    } else if (page === 'about') {
        if(about) about.style.display = 'block';
    } else if (page === 'privacy') {
        if(privacy) privacy.style.display = 'block';
    } else if (page === 'terms') {
        if(terms) terms.style.display = 'block';
    } else if (page === 'refund') {
        if(refund) refund.style.display = 'block';
    } else if (page === 'contact') {
        if(contact) contact.style.display = 'block';
    } else if (page === 'founder') {
        if(founder) {
            founder.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (page === 'faq') {
        if(faq) faq.style.display = 'block';
    } else if (page === 'emailSupport') {
        if(emailSupport) {
            emailSupport.style.display = 'block';
            updateEmailTemplate();
        }
    } else if (page === 'auth') {
        if(authPage) authPage.style.display = 'block';
        if(navItems[4]) navItems[4].classList.add('active');
        if(subview === 'signup') {
            switchAuthTab('signup');
        } else {
            switchAuthTab('login');
        }
    } else if (page === 'dashboard') {
        if(dashboard) dashboard.style.display = 'block';
    } else if (page === 'createBlog') {
        const cblog = document.getElementById('createBlogPage');
        if(cblog) cblog.style.display = 'block';
    } else if (page === 'createListing') {
        const cld = document.getElementById('createListingPage');
        if(cld) cld.style.display = 'block';
    } else if (page === 'mpDetail') {
        const mpd = document.getElementById('mpDetailPage');
        if(mpd) mpd.style.display = 'block';
    } else if (page === 'blogDetail') {
        const bd = document.getElementById('blogDetailPage');
        if(bd) bd.style.display = 'block';
    } else if (page === 'product') {
        const pd = document.getElementById('productDetailPage');
        if(pd) pd.style.display = 'block';
    } else {
        if(home) home.style.display = 'block';
        if(navItems[0]) navItems[0].classList.add('active');
    }
    
    updateMobileNavHighlight(page);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ensure correct mobile nav tab is highlighted based on visible nav and current page
window.updateMobileNavHighlight = function(pageStr) {
    const page = pageStr || location.hash.replace('#', '') || 'home';
    const guestNavElement = document.getElementById('guestMobileNav');
    const userNavElement = document.getElementById('userMobileNav');
    
    if (!guestNavElement || !userNavElement) return;
    
    // Select all items in both nav bars and clear active class
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    
    if (!guestNavElement.classList.contains('hide-important')) {
        const guestItems = guestNavElement.querySelectorAll('.nav-item');
        if (page === 'shop' || page === 'shopPage') {
            if (guestItems[1]) guestItems[1].classList.add('active');
        } else if (page === 'marketplace' || page === 'marketplacePage') {
            if (guestItems[2]) guestItems[2].classList.add('active');
        } else if (page === 'auth' || page === 'authPage') {
            if (guestItems[4]) guestItems[4].classList.add('active');
        } else if (page === 'home' || page === 'homePage') {
            if (guestItems[0]) guestItems[0].classList.add('active');
        }
    } else if (!userNavElement.classList.contains('hide-important')) {
        const userItems = userNavElement.querySelectorAll('.nav-dash-item');
        if (page === 'shop' || page === 'shopPage') {
            if (userItems[2]) userItems[2].classList.add('active');
        } else if (page === 'dashboard' || page === 'dashboardPage') {
            const currentView = window.currentDashView || 'home';
            if (currentView === 'home' && userItems[0]) userItems[0].classList.add('active');
            else if (currentView === 'listings' && userItems[1]) userItems[1].classList.add('active');
            else if (currentView === 'orders' && userItems[3]) userItems[3].classList.add('active');
            else if (currentView === 'profile' && userItems[4]) userItems[4].classList.add('active');
        }
    }
}

// Fetch Blogs dynamically
// Priority: localStorage (admin changes) > Firestore > API > static json (seed only).
// Deleted blog IDs are tracked in `blogs_deleted` so they never come back.
async function fetchBlogs() {
    const savedLocal = window.vextroLoad ? window.vextroLoad('blogs') : null;
    const deletedIds = (window.vextroLoad && window.vextroLoad('blogs_deleted')) || [];
    const isDeleted = id => deletedIds.map(String).includes(String(id));
    const dedupe = list => {
        const seen = new Set();
        return list.filter(b => { const k = String(b && b.id); if (!b || seen.has(k)) return false; seen.add(k); return true; });
    };

    // 1. Firestore FIRST — shared source of truth across all users/browsers
    if (window.fsLoadMap) {
        try {
            const fsData = await window.fsLoadMap('blogs');
            if (fsData && Object.keys(fsData).length > 0) {
                allBlogs = dedupe(Object.values(fsData).filter(b => !isDeleted(b.id)));
                window.allBlogs = allBlogs;
                if (window.vextroSave) window.vextroSave('blogs', allBlogs);
                renderBlogs(allBlogs);
                return;
            }
        } catch (e) {}
    }

    // 2. localStorage cache (offline / Firestore unreachable)
    if (Array.isArray(savedLocal) && savedLocal.length > 0) {
        allBlogs = dedupe(savedLocal.filter(b => !isDeleted(b.id)));
        window.allBlogs = allBlogs;
        renderBlogs(allBlogs);
        return;
    }

    // 3. Backend API
    try {
        const r = await fetch('/api/blogs');
        if (r.ok) {
            const d = await r.json();
            if (Array.isArray(d) && d.length > 0) {
                allBlogs = dedupe(d.filter(b => !isDeleted(b.id)));
                window.allBlogs = allBlogs;
                if (window.vextroSave) window.vextroSave('blogs', allBlogs);
                renderBlogs(allBlogs);
                return;
            }
        }
    } catch (e) {}

    // 4. Static json seed
    try {
        const response = await fetch('./data/blogs.json');
        if (response.ok) {
            const seed = await response.json();
            if (Array.isArray(seed) && seed.length > 0) {
                allBlogs = dedupe(seed.filter(b => !isDeleted(b.id)));
                window.allBlogs = allBlogs;
                if (window.vextroSave) window.vextroSave('blogs', allBlogs);
                renderBlogs(allBlogs);
                return;
            }
        }
    } catch (error) {
        console.warn("blogs.json load failed:", error);

    }

    // 5. No hardcoded fallback — start empty so admin controls blogs
    allBlogs = [];
    window.allBlogs = allBlogs;
    if (window.vextroSave) window.vextroSave('blogs', allBlogs);
    renderBlogs(allBlogs);
}

// Render Blogs into the grid dynamically
function renderBlogs(blogsList) {
    const grid = document.getElementById('blogsGrid');
    const emptyState = document.getElementById('blogEmptyState');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (blogsList.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    blogsList.forEach(blog => {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.innerHTML = `
            <div class="blog-card-image-wrap">
                <span class="blog-card-badge">${blog.category}</span>
                <img src="${blog.image}" alt="${blog.title}" loading="lazy">
                <div class="blog-card-img-overlay">
                    <h3 class="blog-card-title">${blog.title}</h3>
                </div>
            </div>
            <div class="blog-card-body">
                <p class="blog-card-excerpt">${blog.excerpt}</p>
                <a href="#" class="blog-card-link" onclick="viewBlogPost('${blog.id}'); return false;">Read More <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter Blogs by Category
function filterBlogs(category, btn) {
    currentCategory = category;
    
    // Toggle active classes on category buttons
    const buttons = document.querySelectorAll('.blog-cat-btn');
    buttons.forEach(button => button.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    } else {
        // Fallback to find the button programmatically if called elsewhere
        const btns = Array.from(buttons);
        const match = btns.find(b => b.innerText === category);
        if (match) match.classList.add('active');
    }

    applyBlogFilters();
}

// Handle Text Search Input
function handleBlogSearch() {
    const searchInput = document.getElementById('blogSearchInput');
    if (searchInput) {
        searchQuery = searchInput.value.toLowerCase().trim();
    }
    applyBlogFilters();
}

// Apply Filters and Search dynamically
function applyBlogFilters() {
    let filtered = allBlogs;

    // Apply category filter
    if (currentCategory !== 'All') {
        filtered = filtered.filter(blog => blog.category === currentCategory);
    }

    // Apply search query filter
    if (searchQuery !== '') {
        filtered = filtered.filter(blog => 
            blog.title.toLowerCase().includes(searchQuery) || 
            blog.excerpt.toLowerCase().includes(searchQuery) ||
            blog.category.toLowerCase().includes(searchQuery)
        );
    }

    renderBlogs(filtered);
}

// Stub view full blog post function
async function viewBlogPost(id) {
    const clickedBlog = allBlogs.find(b => String(b.id) === String(id));
    if (!clickedBlog) return;

    document.getElementById('bdCategory').innerText = clickedBlog.category;
    document.getElementById('bdTitle').innerText = clickedBlog.title;
    document.getElementById('bdDate').innerText = clickedBlog.date;
    document.getElementById('bdReadTime').innerText = clickedBlog.readTime || '5 min read';
    document.getElementById('bdImage').src = clickedBlog.image;
    document.getElementById('bdExcerpt').innerText = clickedBlog.excerpt;

    let bodyHtml = '';
    if (clickedBlog.content && String(clickedBlog.content).trim().length > 0) {
        bodyHtml = clickedBlog.content;
    } else {
        bodyHtml = `
            <p>${clickedBlog.excerpt || ''}</p>
            <p>Thank you for reading. Stay tuned for more insights and updates in our upcoming posts.</p>
        `;
    }
    document.getElementById('bdBodyText').innerHTML = bodyHtml;

    const popGrid = document.getElementById('bdPopularGrid');
    if (popGrid) {
        popGrid.innerHTML = '';
        const otherBlogs = allBlogs.filter(b => b.id !== id).slice(0, 3);
        otherBlogs.forEach(blog => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.style.margin = '0';
            card.innerHTML = `
                <div class="blog-card-image-wrap">
                    <span class="blog-card-badge">${blog.category}</span>
                    <img src="${blog.image}" alt="${blog.title}" loading="lazy">
                    <div class="blog-card-img-overlay">
                        <h3 class="blog-card-title">${blog.title}</h3>
                    </div>
                </div>
                <div class="blog-card-body">
                    <p class="blog-card-excerpt">${blog.excerpt}</p>
                    <a href="#" class="blog-card-link" onclick="viewBlogPost('${blog.id}'); return false;">Read More <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            `;
            popGrid.appendChild(card);
        });
    }

    showPage('blogDetail');
    window.scrollTo(0, 0);

    mountBlogViewsAndComments(id);
}

// ==========================================
// BLOG VIEWS + COMMENTS
// ==========================================
window.blogStats = window.blogStats || {};
window.blogComments = window.blogComments || {};

window.loadBlogStatsAndComments = async function() {
    if (!window.fsLoadMap) return;
    try {
        const s = await window.fsLoadMap('blog_stats');
        if (s) Object.keys(s).forEach(k => { window.blogStats[k] = { views: Number(s[k].views) || 0 }; });
    } catch(e) {}
    try {
        const c = await window.fsLoadMap('blog_comments');
        if (c) Object.keys(c).forEach(k => {
            const items = Array.isArray(c[k].items) ? c[k].items : [];
            window.blogComments[k] = items;
        });
    } catch(e) {}
};

async function mountBlogViewsAndComments(id) {
    const container = document.getElementById('bdBodyText');
    if (!container) return;

    if (!window.__blogStatsLoaded) {
        window.__blogStatsLoaded = true;
        await window.loadBlogStatsAndComments();
    }

    const key = String(id);
    const cur = window.blogStats[key] || { views: Math.floor(20 + Math.random() * 60) };
    // Only count 1 view per browser per blog per 12 hours (prevents inflated counts on refresh/re-open)
    let shouldCount = false;
    try {
        const lsKey = 'blog_viewed_' + key;
        const last = Number(localStorage.getItem(lsKey) || 0);
        const now = Date.now();
        if (!last || (now - last) > 12 * 60 * 60 * 1000) {
            shouldCount = true;
            localStorage.setItem(lsKey, String(now));
        }
    } catch(e) { shouldCount = true; }
    if (shouldCount) {
        cur.views = (Number(cur.views) || 0) + 1;
        if (window.fsSetDoc) { try { window.fsSetDoc('blog_stats', key, { views: cur.views }); } catch(e) {} }
    } else {
        cur.views = Number(cur.views) || 0;
    }
    window.blogStats[key] = cur;


    // Inject views badge into meta row
    const dateEl = document.getElementById('bdDate');
    if (dateEl && dateEl.parentElement && dateEl.parentElement.parentElement) {
        const meta = dateEl.parentElement.parentElement;
        let viewsSpan = meta.querySelector('.bd-views');
        if (!viewsSpan) {
            viewsSpan = document.createElement('span');
            viewsSpan.className = 'bd-views';
            viewsSpan.innerHTML = `<i class="fa-regular fa-eye" style="color:#94a3b8; margin-right:5px;"></i> <span class="bd-views-n"></span> views`;
            meta.appendChild(viewsSpan);
        }
        const n = viewsSpan.querySelector('.bd-views-n');
        if (n) n.textContent = cur.views.toLocaleString();
    }

    let section = document.getElementById('bdCommentsSection');
    if (!section) {
        section = document.createElement('div');
        section.id = 'bdCommentsSection';
        section.style.cssText = 'margin-top:60px;padding-top:40px;border-top:1px solid #e2e8f0;';
        section.innerHTML = `
            <h2 style="font-size:1.8rem;font-weight:800;color:#0f172a;margin-bottom:20px;">
                Comments <span id="bdCommentCount" style="color:#94a3b8;font-weight:600;font-size:1rem;"></span>
            </h2>
            <form id="bdCommentForm" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:28px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <input id="bdcName" required maxlength="60" placeholder="Your name" style="padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;">
                    <input id="bdcEmail" type="email" maxlength="120" placeholder="Email (optional)" style="padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;">
                </div>
                <textarea id="bdcText" required maxlength="1000" rows="3" placeholder="Write your comment..." style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:0.95rem;background:#fff;color:#0f172a;resize:vertical;font-family:inherit;"></textarea>
                <div style="display:flex;justify-content:flex-end;margin-top:12px;">
                    <button type="submit" style="background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border:none;padding:11px 22px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.3);">
                        <i class="fa-regular fa-paper-plane"></i> Post Comment
                    </button>
                </div>
            </form>
            <div id="bdCommentList" style="display:flex;flex-direction:column;gap:14px;"></div>
        `;
        const parent = container.parentElement;
        const headers = parent ? parent.querySelectorAll('h2') : [];
        let popularBlock = null;
        headers.forEach(h => { if (h.textContent && h.textContent.includes('Popular')) popularBlock = h.parentElement; });
        if (popularBlock) popularBlock.parentElement.insertBefore(section, popularBlock);
        else if (parent) parent.appendChild(section);

        section.querySelector('#bdCommentForm').addEventListener('submit', function(e){
            e.preventDefault();
            submitBlogComment(id);
        });
    }
    renderBlogComments(id);
}

function renderBlogComments(id) {
    const list = document.getElementById('bdCommentList');
    const countEl = document.getElementById('bdCommentCount');
    if (!list) return;
    const items = (window.blogComments[String(id)] || []).slice().reverse();
    if (countEl) countEl.textContent = `(${items.length})`;
    if (items.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:#94a3b8;padding:24px;background:#f8fafc;border-radius:12px;">Be the first to comment on this post.</div>`;
        return;
    }
    list.innerHTML = items.map(c => {
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();
        const safeName = (c.name || 'Anonymous').replace(/</g,'&lt;');
        const safeText = (c.text || '').replace(/</g,'&lt;').replace(/\n/g,'<br>');
        const dt = c.date ? new Date(c.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';
        return `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;display:flex;gap:14px;">
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${initial}</div>
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                    <div style="font-weight:700;color:#0f172a;">${safeName}</div>
                    <div style="color:#94a3b8;font-size:0.8rem;">${dt}</div>
                </div>
                <div style="color:#334155;line-height:1.6;">${safeText}</div>
            </div>
        </div>`;
    }).join('');
}

async function submitBlogComment(id) {
    const name = (document.getElementById('bdcName').value || '').trim();
    const email = (document.getElementById('bdcEmail').value || '').trim();
    const text = (document.getElementById('bdcText').value || '').trim();
    if (!name || !text) { alert('Please enter your name and a comment.'); return; }
    if (text.length > 1000) { alert('Comment is too long (max 1000 chars).'); return; }

    const key = String(id);
    const comment = { name: name.slice(0,60), email: email.slice(0,120), text: text.slice(0,1000), date: new Date().toISOString() };
    const arr = window.blogComments[key] || [];
    arr.push(comment);
    window.blogComments[key] = arr;

    document.getElementById('bdcName').value = '';
    document.getElementById('bdcEmail').value = '';
    document.getElementById('bdcText').value = '';

    renderBlogComments(id);

    if (window.fsSetDoc) {
        try { await window.fsSetDoc('blog_comments', key, { items: arr }); } catch(e) {}
    }
}

window.viewBlogPost = viewBlogPost;
window.mountBlogViewsAndComments = mountBlogViewsAndComments;
window.renderBlogComments = renderBlogComments;
window.submitBlogComment = submitBlogComment;

// Example function to fetch JSON data securely (Ready for backend integration)
async function fetchMarketplaceListings() {
    try {
        const response = await fetch('./data/listings.json');
        const listings = await response.json();
        console.log("Securely fetched listings:", listings);
    } catch (error) {
        console.error("Error fetching secure JSON data:", error);
    }
}

// ==========================================
// GUIDE KNOWLEDGE BASE LOGIC
// ==========================================

// Initialize Guides
function initGuides() {
    renderGuideMenu();
    showGuideArticle(currentGuideId);
}

// Render Left Sidebar Navigation Menu
function renderGuideMenu() {
    const menu = document.getElementById('guideMenu');
    if (!menu) return;

    menu.innerHTML = '';

    // Group guides by category
    const categories = {};
    allGuides.forEach(guide => {
        if (!categories[guide.category]) {
            categories[guide.category] = [];
        }
        categories[guide.category].push(guide);
    });

    let filteredAny = false;

    for (const catName in categories) {
        // Filter articles in category by search query
        const articles = categories[catName].filter(g => 
            g.title.toLowerCase().includes(guideSearchQuery) ||
            g.tags.some(t => t.toLowerCase().includes(guideSearchQuery))
        );

        if (articles.length === 0) continue;
        filteredAny = true;

        // Create Category Header
        const catHeader = document.createElement('div');
        catHeader.className = 'guide-menu-cat-header';
        catHeader.innerText = catName.toUpperCase();
        menu.appendChild(catHeader);

        // Create Links
        articles.forEach(art => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = `guide-menu-item ${art.id === currentGuideId ? 'active' : ''}`;
            link.innerHTML = `<i class="fa-regular fa-file-lines"></i> <span>${art.title}</span>`;
            link.onclick = (e) => {
                e.preventDefault();
                selectGuide(art.id);
            };
            menu.appendChild(link);
        });
    }

    if (!filteredAny) {
        menu.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 20px 10px; font-size: 0.85rem;">
                No guides match your search query.
            </div>
        `;
    }
}

// Select and render a Guide article
function selectGuide(id) {
    currentGuideId = id;
    
    // Update sidebar active class
    const links = document.querySelectorAll('.guide-menu-item');
    links.forEach(l => l.classList.remove('active'));
    
    // Re-render menu to ensure perfect active state toggling
    renderGuideMenu();
    
    // Show the article content
    showGuideArticle(id);
}

// Display guide content in right main container
function showGuideArticle(id) {
    const articleContainer = document.getElementById('guideArticle');
    if (!articleContainer) return;

    const guide = allGuides.find(g => g.id === id);
    if (!guide) return;

    // Smooth fade transition
    articleContainer.style.opacity = 0;
    
    setTimeout(() => {
        articleContainer.innerHTML = `
            ${guide.content}
            <div class="guide-feedback-widget">
                <span>Was this guide helpful?</span>
                <div class="feedback-buttons">
                    <button class="feedback-btn" onclick="rateGuide('up', this)"><i class="fa-regular fa-thumbs-up"></i> Yes</button>
                    <button class="feedback-btn" onclick="rateGuide('down', this)"><i class="fa-regular fa-thumbs-down"></i> No</button>
                </div>
            </div>
        `;
        articleContainer.style.opacity = 1;
    }, 150);
}

// Handle guide search box input
function handleGuideSearch() {
    const searchInput = document.getElementById('guideSearchInput');
    if (searchInput) {
        guideSearchQuery = searchInput.value.toLowerCase().trim();
        renderGuideMenu();
    }
}

// Copy Code utility helper
function copyCode(btn) {
    const codeBlock = btn.nextElementSibling.querySelector('code');
    if (!codeBlock) return;

    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.background = '#22c55e';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy code: ", err);
        alert("Could not copy code. Please select and copy manually.");
    });
}

// Rate Guide utility helper
function rateGuide(rating, btn) {
    const parent = btn.parentElement;
    parent.innerHTML = `<span style="color: #22c55e; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Thank you for your feedback!</span>`;
}

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Vextro Lyntra frontend initialized securely.");
    
    // Check path on page load to restore active page
    const currentPath = location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';
    
    // Also check hash for backward compatibility with old links
    const currentHash = location.hash.replace('#', '');
    const activeRoute = currentHash ? currentHash : currentPath;

    if (activeRoute.startsWith('service/') || activeRoute.startsWith('service-')) {
        const serviceId = activeRoute.replace('service/', '').replace('service-', '');
        showService(serviceId);
    } else if (activeRoute !== 'home' && activeRoute !== 'index.html') {
        showPage(activeRoute);
    } else {
        showPage('home');
    }
    
    // Render empty or populated products to UI
    if (window.filterShopProducts) window.filterShopProducts();
});

// Listen to popstate changes for browser back/forward buttons (replaces hashchange)
window.addEventListener('popstate', () => {
    const currentPath = location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';
    if (currentPath.startsWith('service/')) {
        const serviceId = currentPath.replace('service/', '');
        showService(serviceId);
    } else {
        const page = (currentPath === 'index.html') ? 'home' : currentPath;
        showPage(page);
    }
});

// FAQ Accordion Toggle Utility
function toggleFaq(el) {
    const faqItem = el.parentElement;
    const answer = el.nextElementSibling;
    const icon = el.querySelector('.faq-icon');
    
    // Toggle active state
    if (faqItem.classList.contains('active')) {
        faqItem.classList.remove('active');
        answer.style.maxHeight = null;
        if(icon) {
            icon.className = 'fa-solid fa-plus faq-icon';
        }
    } else {
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const ans = item.querySelector('.faq-answer');
            if(ans) ans.style.maxHeight = null;
            const ic = item.querySelector('.faq-icon');
            if(ic) ic.className = 'fa-solid fa-plus faq-icon';
        });
        
        faqItem.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + "px";
        if(icon) {
            icon.className = 'fa-solid fa-minus faq-icon';
        }
    }
}

// Contact Form Submit Handler
function submitContactForm(event, form) {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Extract input values
    const nameInput = form.querySelector('input[type="text"][placeholder="Aftab"]');
    const emailInput = form.querySelector('input[type="email"]');
    const subjectInput = document.getElementById('contactSubjectInput');
    const messageInput = document.getElementById('contactMessageInput');
    
    const name = nameInput ? nameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const subject = subjectInput ? subjectInput.value : 'General Inquiry';
    const message = messageInput ? messageInput.value : '';
    
    if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return false;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    
    // Send via EmailJS directly (no mail app popup)
    const templateParams = {
        title: subject,
        name: name,
        email: email,
        message: `Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSubmitted via Vextro Lyntra Contact Form.`
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Sent!';
            btn.style.background = '#22c55e';
            
            // Show success card
            const formParent = form.parentElement;
            formParent.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #0f172a;">
                    <div style="width: 72px; height: 72px; background: rgba(34, 197, 94, 0.1); color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 24px;">
                        <i class="fa-solid fa-envelope-open-text"></i>
                    </div>
                    <h2 style="font-size: 1.8rem; font-weight: 850; margin-bottom: 12px; color: #0f172a;">Message Sent Successfully!</h2>
                    <p style="color: #64748b; font-size: 1.05rem; line-height: 1.6; max-width: 450px; margin: 0 auto 30px;">
                        Your message has been delivered directly to <strong>support@vextrolyntra.online</strong>. We'll respond within 24 hours!
                    </p>
                    <a href="javascript:void(0)" onclick="showPage('home')" style="display: inline-block; background: linear-gradient(135deg, #131130 0%, #1e1b4b 100%); color: white; padding: 12px 30px; border-radius: 50px; font-weight: 700; text-decoration: none; transition: transform 0.2s ease;">Back to Home</a>
                </div>
            `;
        })
        .catch((error) => {
            console.error('EmailJS Error:', error);
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert('Failed to send message. Please try again or email us directly at support@vextrolyntra.online');
        });
    
    return false;
}

// Cookie preferences state switcher
function toggleCookiePref(type) {
    console.log(`Cookie preference toggled: ${type}`);
}

// Cookie preferences save action
function saveCookiePreferences(btn) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Applied Successfully!';
        btn.style.background = '#22c55e';
        const saveStatus = document.getElementById('cookieSaveStatus');
        if (saveStatus) {
            saveStatus.innerHTML = `<strong>Preferences Applied Dynamically!</strong>`;
            saveStatus.style.color = '#22c55e';
        }
        
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.style.background = '';
            if (saveStatus) {
                saveStatus.innerHTML = `Active Browser Session`;
                saveStatus.style.color = '';
            }
        }, 2000);
    }, 1000);
}

// Topic Cards Pre-fill Contact form action
function prefillContactForm(subject, message) {
    const subjectInput = document.getElementById('contactSubjectInput');
    const messageInput = document.getElementById('contactMessageInput');
    
    if (subjectInput && messageInput) {
        subjectInput.value = subject;
        messageInput.value = message;
        
        // Highlight inputs with a nice scale-glow transition
        subjectInput.style.borderColor = '#2563eb';
        subjectInput.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.15)';
        messageInput.style.borderColor = '#2563eb';
        messageInput.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.15)';
        
        // Scroll the form columns into view smoothly
        subjectInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            subjectInput.style.borderColor = '';
            subjectInput.style.boxShadow = '';
            messageInput.style.borderColor = '';
            messageInput.style.boxShadow = '';
        }, 1500);
    }
}

// Global active email addons state
window.activeEmailAddons = window.activeEmailAddons || {
    whatsapp_call: false,
    nda_req: false
};

// Priority selection chip handler
function selectPriorityChip(priorityVal, el) {
    const priorityInput = document.getElementById('emailPriorityInput');
    if (priorityInput) priorityInput.value = priorityVal;
    
    document.querySelectorAll('.priority-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.style.background = 'white';
        if (chip.id === 'chip-priority-critical') {
            chip.style.borderColor = '#ef4444';
            chip.style.color = '#ef4444';
        } else if (chip.id === 'chip-priority-high') {
            chip.style.borderColor = '#f97316';
            chip.style.color = '#f97316';
        } else if (chip.id === 'chip-priority-normal') {
            chip.style.borderColor = '#2563eb';
            chip.style.color = '#2563eb';
        }
    });
    
    el.classList.add('active');
    
    if (priorityVal === 'CRITICAL') {
        el.style.background = 'rgba(239, 68, 68, 0.08)';
    } else if (priorityVal === 'HIGH') {
        el.style.background = 'rgba(249, 115, 22, 0.08)';
    } else if (priorityVal === 'NORMAL') {
        el.style.background = 'rgba(37, 99, 235, 0.08)';
    }
    
    updateEmailTemplate();
}

// Department selection chip handler
function selectDeptChip(deptVal, el) {
    const deptInput = document.getElementById('emailDepartmentInput');
    if (deptInput) deptInput.value = deptVal;
    
    document.querySelectorAll('.dept-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.style.border = '1px solid #e2e8f0';
        chip.style.background = 'white';
        const icon = chip.querySelector('.checkmark-icon i');
        if (icon) {
            icon.className = 'fa-regular fa-circle';
            icon.parentElement.style.color = '#cbd5e1';
        }
    });
    
    el.classList.add('active');
    el.style.background = 'rgba(37, 99, 235, 0.04)';
    el.style.border = '1px solid #2563eb';
    
    const icon = el.querySelector('.checkmark-icon i');
    if (icon) {
        icon.className = 'fa-solid fa-circle-check';
        icon.parentElement.style.color = '#2563eb';
    }
    
    updateEmailTemplate();
}

// Addon toggle switch handler
function toggleEmailAddon(type, el) {
    window.activeEmailAddons[type] = !window.activeEmailAddons[type];
    
    const checkbox = document.getElementById(`addon-${type}-check`);
    const slider = el.querySelector('.custom-switch-slider');
    
    if (checkbox) checkbox.checked = window.activeEmailAddons[type];
    
    if (window.activeEmailAddons[type]) {
        el.style.borderColor = '#2563eb';
        el.style.background = 'rgba(37, 99, 235, 0.02)';
        if (slider) {
            slider.style.backgroundColor = '#2563eb';
            slider.style.boxShadow = 'inset 0 0 0 10px #2563eb';
        }
    } else {
        el.style.borderColor = '#e2e8f0';
        el.style.background = 'white';
        if (slider) {
            slider.style.backgroundColor = '#cbd5e1';
            slider.style.boxShadow = 'none';
        }
    }
    
    updateEmailTemplate();
}

// Restored Dynamic Email Support Template Builder
function updateEmailTemplate() {
    const priorityInput = document.getElementById('emailPriorityInput');
    const deptInput = document.getElementById('emailDepartmentInput');
    const briefText = document.getElementById('emailBriefText');
    const previewBox = document.getElementById('emailTemplatePreview');
    
    if (!priorityInput || !deptInput || !previewBox) return;
    
    const priorityVal = priorityInput.value;
    const deptVal = deptInput.value;
    
    let priorityText = "⭐ HIGH PRIORITY (Response < 30 mins)";
    if (priorityVal === "CRITICAL") {
        priorityText = "🔥 CRITICAL PRIORITY (Response < 15 mins)";
    } else if (priorityVal === "NORMAL") {
        priorityText = "💬 NORMAL ENQUIRY (Response < 1 hour)";
    }
    
    let deptText = "💻 Technical & Custom Scrapers Desk";
    if (deptVal === "ESCROW_TRANSACTIONS") {
        deptText = "🤝 Escrow & Asset Handovers";
    } else if (deptVal === "GENERAL_PARTNERSHIPS") {
        deptText = "🚀 Bulk Listings & Brand Partnerships";
    }
    
    const brief = (briefText && briefText.value.trim()) ? briefText.value.trim() : '[Please insert details of your request here...]';
    
    // Addons compilation
    let addonsText = "";
    if (window.activeEmailAddons) {
        if (window.activeEmailAddons.whatsapp_call) {
            addonsText += "\n- [✔] Request WhatsApp Callback: YES";
        }
        if (window.activeEmailAddons.nda_req) {
            addonsText += "\n- [✔] NDA Protection Required: YES";
        }
    }
    if (!addonsText) {
        addonsText = "\n- None";
    }
    
    const template = `[VEXTRO LYNTRA PRIORITY ROUTE DISPATCH]
=========================================
Priority Level : ${priorityText}
Target Desk    : ${deptText}
Power-Ups      : ${addonsText}
=========================================

Requirement Description:
${brief}

-----------------------------------------
Submitted via Vextro Lyntra Priority Portal.`;

    previewBox.textContent = template;
}

// Launch mailto client
function launchEmailClient() {
    const priorityInput = document.getElementById('emailPriorityInput');
    const deptInput = document.getElementById('emailDepartmentInput');
    const briefText = document.getElementById('emailBriefText');
    const previewBox = document.getElementById('emailTemplatePreview');
    const btn = document.querySelector('button[onclick="launchEmailClient()"]');
    
    if (!priorityInput || !previewBox) return;
    
    const priorityVal = priorityInput.value;
    const deptVal = deptInput ? deptInput.value : 'GENERAL';
    const bodyContent = previewBox.textContent;
    const brief = briefText ? briefText.value : '';

    if (!brief.trim()) {
        alert('Please describe your requirement before sending.');
        return;
    }

    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    }

    const templateParams = {
        title: `Priority Support Request [${priorityVal}] - ${deptVal}`,
        name: 'Website Visitor',
        email: 'no-reply@vextrolyntra.online',
        message: bodyContent
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Request Sent!';
                btn.style.background = '#22c55e';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 3000);
            }
            alert('Your priority support request has been sent successfully to support@vextrolyntra.online!');
        })
        .catch((error) => {
            console.error('EmailJS Error:', error);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            alert('Failed to send. Please email us directly at support@vextrolyntra.online');
        });
}

// Copy to Clipboard Utility
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: #22c55e;"></i>';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1500);
    }).catch(err => {
        console.warn("Could not copy clipboard text: ", err);
    });
}

// Toggle Mobile Menu Drawer
function toggleMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (drawer) {
        drawer.classList.toggle('active');
        // Prevent body scrolling when menu is active
        if (drawer.classList.contains('active')) {
            
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close Mobile Menu on Backdrop Click
function closeMobileMenuOnBackdrop(event) {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (event.target === drawer) {
        toggleMobileMenu();
    }
}

// ==========================================
// FIREBASE AUTHENTICATION UTILITY HANDLERS
// ==========================================

// Active Auth Tab State ('login' or 'signup')
let activeAuthTab = 'login';

// Switch Authentication Tab View (Split Screen)
function switchAuthTab(tab) {
    activeAuthTab = tab;
    
    const loginForm = document.getElementById('authLoginFormContainer');
    const signupForm = document.getElementById('authSignupFormContainer');
    const verifyForm = document.getElementById('authVerifyEmailContainer');
    const phoneForm = document.getElementById('authPhoneSetupContainer');
    const rightLogin = document.getElementById('authRightLogin');
    const rightSignup = document.getElementById('authRightSignup');
    
    // Hide alert
    showAuthAlert('', 'hide');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'none';
    if (verifyForm) verifyForm.style.display = 'none';
    if (phoneForm) phoneForm.style.display = 'none';
    
    if (tab === 'signup') {
        if (signupForm) signupForm.style.display = 'block';
        if (rightLogin) rightLogin.style.display = 'none';
        if (rightSignup) rightSignup.style.display = 'flex';
    } else if (tab === 'verifyEmail') {
        if (verifyForm) verifyForm.style.display = 'block';
        if (rightLogin) rightLogin.style.display = 'none';
        if (rightSignup) rightSignup.style.display = 'flex';
    } else if (tab === 'phoneSetup') {
        if (phoneForm) phoneForm.style.display = 'block';
        if (rightLogin) rightLogin.style.display = 'none';
        if (rightSignup) rightSignup.style.display = 'flex';
    } else {
        if (loginForm) loginForm.style.display = 'block';
        if (rightLogin) rightLogin.style.display = 'flex';
        if (rightSignup) rightSignup.style.display = 'none';
    }
}

// Toggle password text visibility input
function togglePasswordVisibility(fieldId, btn) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fa-regular fa-eye';
    }
}

// Render dynamic authentication message toast banner
function showAuthAlert(message, type = 'danger') {
    const alertBox = document.getElementById('authAlert');
    const alertText = document.getElementById('authAlertText');
    if (!alertBox || !alertText) return;
    
    if (type === 'hide') {
        alertBox.style.display = 'none';
        return;
    }
    
    alertText.textContent = message;
    alertBox.style.display = 'block';
    
    if (type === 'success') {
        alertBox.style.background = '#f0fdf4';
        alertBox.style.border = '1px solid #bbf7d0';
        alertBox.style.color = '#166534';
    } else {
        alertBox.style.background = '#fef2f2';
        alertBox.style.border = '1px solid #fecaca';
        alertBox.style.color = '#991b1b';
    }
}

// Handle Form Submission for Email Auth
async function handleAuthSubmit(event) {
    event.preventDefault();
    if (typeof window.auth === 'undefined') {
        showAuthAlert("Firebase is not fully loaded. Check network connection.");
        return;
    }
    
    let email, password, name, confirmPassword, submitBtn;
    
    if (activeAuthTab === 'signup') {
        email = document.getElementById('signupEmail').value.trim();
        password = document.getElementById('signupPassword').value;
        confirmPassword = document.getElementById('signupConfirmPassword').value;
        name = document.getElementById('signupName') ? document.getElementById('signupName').value.trim() : '';
        submitBtn = document.getElementById('signupSubmitBtn');
        
        // Confirm Password Match Check
        if (password !== confirmPassword) {
            showAuthAlert("Passwords do not match. Please verify.", "danger");
            return;
        }
    } else {
        email = document.getElementById('loginEmail').value.trim();
        password = document.getElementById('loginPassword').value;
        submitBtn = document.getElementById('loginSubmitBtn');
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }
    
    showAuthAlert('', 'hide');
    
    try {
        if (activeAuthTab === 'signup') {
            // Sign Up Flow
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save display name
            if (name) {
                try {
                    await user.updateProfile({ displayName: name });
                } catch(e) { console.error("Update profile error:", e); }
            }
            
            // Send Email Verification
            try {
                // Ensure we use the currentUser instance from auth
                const currentUser = window.auth.currentUser || user;
                await currentUser.sendEmailVerification();
                console.log("Verification email sent successfully.");
            } catch (verifErr) {
                console.error("Email Verif Error:", verifErr);
                showAuthAlert("Account created, but couldn't send verification email: " + verifErr.message, "danger");
                // Fallback to verify screen anyway so they can try resending
            }
            
            // Display verify screen
            const verifyDisplay = document.getElementById('verifyEmailDisplay');
            if (verifyDisplay) verifyDisplay.textContent = user.email;
            
            switchAuthTab('verifyEmail');
        } else {
            // Log In Flow
            await window.auth.signInWithEmailAndPassword(email, password);
            showAuthAlert("Successfully signed in!", "success");
            setTimeout(() => { showPage('home'); }, 1000);
        }
    } catch (error) {
        console.error("Auth Exception: ", error);
        let errorMsg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = "This email is already registered. Try signing in!";
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMsg = "Incorrect email or password combination. Try again.";
        } else if (error.code === 'auth/weak-password') {
            errorMsg = "Password must be at least 6 characters long.";
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = "Please enter a valid email address.";
        }
        showAuthAlert(errorMsg, "danger");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            if (activeAuthTab === 'signup') {
                submitBtn.innerHTML = '<span>CREATE ACCOUNT</span>';
            } else {
                submitBtn.innerHTML = '<span>Sign In</span>';
            }
        }
    }
}

// Handle Verify Email Check
async function handleVerifyEmailCheck() {
    if (typeof window.auth === 'undefined' || !window.auth.currentUser) return;
    
    const user = window.auth.currentUser;
    await user.reload(); // Refresh token and user state from Firebase
    
    if (user.emailVerified) {
        showAuthAlert("Email successfully verified!", "success");
        setTimeout(() => {
            switchAuthTab('phoneSetup');
        }, 1000);
    } else {
        showAuthAlert("Your email is not verified yet. Please check your inbox and click the link.", "danger");
    }
}

// Handle Resend Verification Email
async function handleResendVerification() {
    if (typeof window.auth === 'undefined' || !window.auth.currentUser) return;
    
    const user = window.auth.currentUser;
    const btn = document.getElementById('resendEmailBtn');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    }
    
    try {
        await user.sendEmailVerification();
        showAuthAlert("Verification email has been resent successfully!", "success");
    } catch (error) {
        console.error("Resend Email Exception:", error);
        // Firebase has rate limits for sending verification emails
        if (error.code === 'auth/too-many-requests') {
            showAuthAlert("Too many requests. Please wait a minute before resending.", "danger");
        } else {
            showAuthAlert(error.message, "danger");
        }
    } finally {
        if (btn) {
            btn.innerHTML = 'RESEND EMAIL';
            // Disable for 30 seconds to prevent spam
            setTimeout(() => {
                btn.disabled = false;
            }, 30000);
        }
    }
}

// Handle Phone Setup Completion
function handlePhoneSetupComplete() {
    const phoneInput = document.getElementById('setupPhone');
    if (!phoneInput || !phoneInput.value.trim()) {
        showAuthAlert("Please enter a valid phone number.", "danger");
        return;
    }
    
    showAuthAlert("Setup Complete! Welcome to Vextro Lyntra.", "success");
    setTimeout(() => { 
        showPage('dashboard'); // Route directly to dashboard after setup
    }, 1500);
}

// ==========================================
// COUNTRY CODE PICKER LOGIC
// ==========================================
const countriesData = [
    { name: "Afghanistan", code: "+93", iso: "af" }, { name: "Albania", code: "+355", iso: "al" }, { name: "Algeria", code: "+213", iso: "dz" },
    { name: "Andorra", code: "+376", iso: "ad" }, { name: "Angola", code: "+244", iso: "ao" }, { name: "Argentina", code: "+54", iso: "ar" },
    { name: "Armenia", code: "+374", iso: "am" }, { name: "Australia", code: "+61", iso: "au" }, { name: "Austria", code: "+43", iso: "at" },
    { name: "Azerbaijan", code: "+994", iso: "az" }, { name: "Bahamas", code: "+1", iso: "bs" }, { name: "Bahrain", code: "+973", iso: "bh" },
    { name: "Bangladesh", code: "+880", iso: "bd" }, { name: "Belarus", code: "+375", iso: "by" }, { name: "Belgium", code: "+32", iso: "be" },
    { name: "Belize", code: "+501", iso: "bz" }, { name: "Benin", code: "+229", iso: "bj" }, { name: "Bhutan", code: "+975", iso: "bt" },
    { name: "Bolivia", code: "+591", iso: "bo" }, { name: "Bosnia", code: "+387", iso: "ba" }, { name: "Botswana", code: "+267", iso: "bw" },
    { name: "Brazil", code: "+55", iso: "br" }, { name: "Brunei", code: "+673", iso: "bn" }, { name: "Bulgaria", code: "+359", iso: "bg" },
    { name: "Burkina Faso", code: "+226", iso: "bf" }, { name: "Burundi", code: "+257", iso: "bi" }, { name: "Cambodia", code: "+855", iso: "kh" },
    { name: "Cameroon", code: "+237", iso: "cm" }, { name: "Canada", code: "+1", iso: "ca" }, { name: "Cape Verde", code: "+238", iso: "cv" },
    { name: "CAR", code: "+236", iso: "cf" }, { name: "Chad", code: "+235", iso: "td" }, { name: "Chile", code: "+56", iso: "cl" },
    { name: "China", code: "+86", iso: "cn" }, { name: "Colombia", code: "+57", iso: "co" }, { name: "Comoros", code: "+269", iso: "km" },
    { name: "Congo", code: "+242", iso: "cg" }, { name: "Costa Rica", code: "+506", iso: "cr" }, { name: "Croatia", code: "+385", iso: "hr" },
    { name: "Cuba", code: "+53", iso: "cu" }, { name: "Cyprus", code: "+357", iso: "cy" }, { name: "Czech Republic", code: "+420", iso: "cz" },
    { name: "Denmark", code: "+45", iso: "dk" }, { name: "Djibouti", code: "+253", iso: "dj" }, { name: "Dominica", code: "+1", iso: "dm" },
    { name: "Dominican Republic", code: "+1", iso: "do" }, { name: "Ecuador", code: "+593", iso: "ec" }, { name: "Egypt", code: "+20", iso: "eg" },
    { name: "El Salvador", code: "+503", iso: "sv" }, { name: "Equatorial Guinea", code: "+240", iso: "gq" }, { name: "Eritrea", code: "+291", iso: "er" },
    { name: "Estonia", code: "+372", iso: "ee" }, { name: "Eswatini", code: "+268", iso: "sz" }, { name: "Ethiopia", code: "+251", iso: "et" },
    { name: "Fiji", code: "+679", iso: "fj" }, { name: "Finland", code: "+358", iso: "fi" }, { name: "France", code: "+33", iso: "fr" },
    { name: "Gabon", code: "+241", iso: "ga" }, { name: "Gambia", code: "+220", iso: "gm" }, { name: "Georgia", code: "+995", iso: "ge" },
    { name: "Germany", code: "+49", iso: "de" }, { name: "Ghana", code: "+233", iso: "gh" }, { name: "Greece", code: "+30", iso: "gr" },
    { name: "Grenada", code: "+1", iso: "gd" }, { name: "Guatemala", code: "+502", iso: "gt" }, { name: "Guinea", code: "+224", iso: "gn" },
    { name: "Guinea-Bissau", code: "+245", iso: "gw" }, { name: "Guyana", code: "+592", iso: "gy" }, { name: "Haiti", code: "+509", iso: "ht" },
    { name: "Honduras", code: "+504", iso: "hn" }, { name: "Hungary", code: "+36", iso: "hu" }, { name: "Iceland", code: "+354", iso: "is" },
    { name: "India", code: "+91", iso: "in" }, { name: "Indonesia", code: "+62", iso: "id" }, { name: "Iran", code: "+98", iso: "ir" },
    { name: "Iraq", code: "+964", iso: "iq" }, { name: "Ireland", code: "+353", iso: "ie" }, { name: "Israel", code: "+972", iso: "il" },
    { name: "Italy", code: "+39", iso: "it" }, { name: "Jamaica", code: "+1", iso: "jm" }, { name: "Japan", code: "+81", iso: "jp" },
    { name: "Jordan", code: "+962", iso: "jo" }, { name: "Kazakhstan", code: "+7", iso: "kz" }, { name: "Kenya", code: "+254", iso: "ke" },
    { name: "Kiribati", code: "+686", iso: "ki" }, { name: "Kuwait", code: "+965", iso: "kw" }, { name: "Kyrgyzstan", code: "+996", iso: "kg" },
    { name: "Laos", code: "+856", iso: "la" }, { name: "Latvia", code: "+371", iso: "lv" }, { name: "Lebanon", code: "+961", iso: "lb" },
    { name: "Lesotho", code: "+266", iso: "ls" }, { name: "Liberia", code: "+231", iso: "lr" }, { name: "Libya", code: "+218", iso: "ly" },
    { name: "Liechtenstein", code: "+423", iso: "li" }, { name: "Lithuania", code: "+370", iso: "lt" }, { name: "Luxembourg", code: "+352", iso: "lu" },
    { name: "Madagascar", code: "+261", iso: "mg" }, { name: "Malawi", code: "+265", iso: "mw" }, { name: "Malaysia", code: "+60", iso: "my" },
    { name: "Maldives", code: "+960", iso: "mv" }, { name: "Mali", code: "+223", iso: "ml" }, { name: "Malta", code: "+356", iso: "mt" },
    { name: "Marshall Islands", code: "+692", iso: "mh" }, { name: "Mauritania", code: "+222", iso: "mr" }, { name: "Mauritius", code: "+230", iso: "mu" },
    { name: "Mexico", code: "+52", iso: "mx" }, { name: "Micronesia", code: "+691", iso: "fm" }, { name: "Moldova", code: "+373", iso: "md" },
    { name: "Monaco", code: "+377", iso: "mc" }, { name: "Mongolia", code: "+976", iso: "mn" }, { name: "Montenegro", code: "+382", iso: "me" },
    { name: "Morocco", code: "+212", iso: "ma" }, { name: "Mozambique", code: "+258", iso: "mz" }, { name: "Myanmar", code: "+95", iso: "mm" },
    { name: "Namibia", code: "+264", iso: "na" }, { name: "Nauru", code: "+674", iso: "nr" }, { name: "Nepal", code: "+977", iso: "np" },
    { name: "Netherlands", code: "+31", iso: "nl" }, { name: "New Zealand", code: "+64", iso: "nz" }, { name: "Nicaragua", code: "+505", iso: "ni" },
    { name: "Niger", code: "+227", iso: "ne" }, { name: "Nigeria", code: "+234", iso: "ng" }, { name: "North Korea", code: "+850", iso: "kp" },
    { name: "North Macedonia", code: "+389", iso: "mk" }, { name: "Norway", code: "+47", iso: "no" }, { name: "Oman", code: "+968", iso: "om" },
    { name: "Pakistan", code: "+92", iso: "pk" }, { name: "Palau", code: "+680", iso: "pw" }, { name: "Palestine", code: "+970", iso: "ps" },
    { name: "Panama", code: "+507", iso: "pa" }, { name: "Papua New Guinea", code: "+675", iso: "pg" }, { name: "Paraguay", code: "+595", iso: "py" },
    { name: "Peru", code: "+51", iso: "pe" }, { name: "Philippines", code: "+63", iso: "ph" }, { name: "Poland", code: "+48", iso: "pl" },
    { name: "Portugal", code: "+351", iso: "pt" }, { name: "Qatar", code: "+974", iso: "qa" }, { name: "Romania", code: "+40", iso: "ro" },
    { name: "Russia", code: "+7", iso: "ru" }, { name: "Rwanda", code: "+250", iso: "rw" }, { name: "Saint Kitts", code: "+1", iso: "kn" },
    { name: "Saint Lucia", code: "+1", iso: "lc" }, { name: "Saint Vincent", code: "+1", iso: "vc" }, { name: "Samoa", code: "+685", iso: "ws" },
    { name: "San Marino", code: "+378", iso: "sm" }, { name: "Sao Tome", code: "+239", iso: "st" }, { name: "Saudi Arabia", code: "+966", iso: "sa" },
    { name: "Senegal", code: "+221", iso: "sn" }, { name: "Serbia", code: "+381", iso: "rs" }, { name: "Seychelles", code: "+248", iso: "sc" },
    { name: "Sierra Leone", code: "+232", iso: "sl" }, { name: "Singapore", code: "+65", iso: "sg" }, { name: "Slovakia", code: "+421", iso: "sk" },
    { name: "Slovenia", code: "+386", iso: "si" }, { name: "Solomon Islands", code: "+677", iso: "sb" }, { name: "Somalia", code: "+252", iso: "so" },
    { name: "South Africa", code: "+27", iso: "za" }, { name: "South Korea", code: "+82", iso: "kr" }, { name: "South Sudan", code: "+211", iso: "ss" },
    { name: "Spain", code: "+34", iso: "es" }, { name: "Sri Lanka", code: "+94", iso: "lk" }, { name: "Sudan", code: "+249", iso: "sd" },
    { name: "Suriname", code: "+597", iso: "sr" }, { name: "Sweden", code: "+46", iso: "se" }, { name: "Switzerland", code: "+41", iso: "ch" },
    { name: "Syria", code: "+963", iso: "sy" }, { name: "Taiwan", code: "+886", iso: "tw" }, { name: "Tajikistan", code: "+992", iso: "tj" },
    { name: "Tanzania", code: "+255", iso: "tz" }, { name: "Thailand", code: "+66", iso: "th" }, { name: "Togo", code: "+228", iso: "tg" },
    { name: "Tonga", code: "+676", iso: "to" }, { name: "Trinidad and Tobago", code: "+1", iso: "tt" }, { name: "Tunisia", code: "+216", iso: "tn" },
    { name: "Turkey", code: "+90", iso: "tr" }, { name: "Turkmenistan", code: "+993", iso: "tm" }, { name: "Tuvalu", code: "+688", iso: "tv" },
    { name: "Uganda", code: "+256", iso: "ug" }, { name: "Ukraine", code: "+380", iso: "ua" }, { name: "UAE", code: "+971", iso: "ae" },
    { name: "United Kingdom", code: "+44", iso: "gb" }, { name: "United States", code: "+1", iso: "us" }, { name: "Uruguay", code: "+598", iso: "uy" },
    { name: "Uzbekistan", code: "+998", iso: "uz" }, { name: "Vanuatu", code: "+678", iso: "vu" }, { name: "Vatican City", code: "+379", iso: "va" },
    { name: "Venezuela", code: "+58", iso: "ve" }, { name: "Vietnam", code: "+84", iso: "vn" }, { name: "Yemen", code: "+967", iso: "ye" },
    { name: "Zambia", code: "+260", iso: "zm" }, { name: "Zimbabwe", code: "+263", iso: "zw" }
];

function toggleCountryPicker() {
    const dropdown = document.getElementById('countryPickerDropdown');
    const arrow = document.getElementById('countryPickerArrow');
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'flex';
        arrow.style.transform = 'rotate(180deg)';
        renderCountryList(countriesData);
        setTimeout(() => { document.getElementById('countrySearchInput').focus(); }, 100);
    } else {
        dropdown.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

function filterCountries(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = countriesData.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) || 
        c.code.toLowerCase().includes(lowerQuery)
    );
    renderCountryList(filtered);
}

function renderCountryList(list) {
    const container = document.getElementById('countryList');
    container.innerHTML = '';
    
    if(list.length === 0) {
        container.innerHTML = '<div style="padding: 10px 14px; color: #64748b; font-size: 0.9rem; text-align: center;">No countries found.</div>';
        return;
    }
    
    list.forEach(country => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: background 0.2s;';
        item.onmouseover = () => item.style.background = '#f8fafc';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = () => selectCountry(country.iso, country.code);
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="https://flagcdn.com/w40/${country.iso}.png" style="width: 24px; height: 18px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 2px rgba(0,0,0,0.2);" alt="${country.name}">
                <span style="font-size: 0.9rem; color: #0f172a; font-weight: 500;">${country.name}</span>
            </div>
            <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">${country.code}</span>
        `;
        container.appendChild(item);
    });
}

function selectCountry(iso, code) {
    const flagImg = document.getElementById('selectedCountryFlag');
    if(flagImg) {
        flagImg.src = `https://flagcdn.com/w40/${iso}.png`;
    }
    document.getElementById('selectedCountryCode').innerText = code;
    
    document.getElementById('countryPickerDropdown').style.display = 'none';
    document.getElementById('countryPickerArrow').style.transform = 'rotate(0deg)';
    document.getElementById('setupPhone').focus();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const picker = document.getElementById('countryPickerBtn');
    const dropdown = document.getElementById('countryPickerDropdown');
    
    if (picker && dropdown) {
        if (!picker.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
            document.getElementById('countryPickerArrow').style.transform = 'rotate(0deg)';
        }
    }
});


// Google Pop-up Provider Sign In handler
async function handleGoogleSignIn() {
    showAuthAlert('', 'hide');
    if (typeof window.auth === 'undefined') {
        showAuthAlert("Firebase is not fully loaded. Check network connection.");
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        await window.auth.signInWithPopup(provider);
        showAuthAlert("Google Login Successful!", "success");
        setTimeout(() => { showPage('home'); }, 1000);
    } catch (error) {
        console.error("Google Auth Exception: ", error);
        showAuthAlert(error.message, "danger");
    }
}

// Forgot Password link handler
async function handleForgotPassword() {
    const emailInput = document.getElementById('loginEmail') || document.getElementById('signupEmail');
    if (!emailInput || !emailInput.value.trim()) {
        showAuthAlert("Please enter your email address in the field first.", "danger");
        return;
    }
    
    const email = emailInput.value.trim();
    showAuthAlert('', 'hide');
    
    try {
        await window.auth.sendPasswordResetEmail(email);
        showAuthAlert("Reset password link has been sent to your email!", "success");
    } catch (error) {
        console.error("Forgot Pass Exception: ", error);
        showAuthAlert(error.message, "danger");
    }
}

// Log Out Action
async function handleLogout() {
    if (typeof window.auth !== 'undefined') {
        try {
            await window.auth.signOut();
        } catch (error) {
            console.error("Logout Exception: ", error);
        }
    }
    showPage('home');
}

// Toggle Dropdown menu for Desktop profile
function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
}

// Close Dropdown when clicking outside
window.addEventListener('click', () => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
});

// Centralized dynamic UI updating utility for state monitoring
function updateAuthUI(user) {
    const desktopAuth = document.getElementById('desktopAuthButtons');
    const desktopUser = document.getElementById('desktopUserBlock');
    const mobileAuth = document.getElementById('mobileAuthButtons');
    const mobileUser = document.getElementById('mobileUserBlock');
    
    const avatar = document.getElementById('userAvatar');
    const displayName = document.getElementById('userDisplayName');
    const dropEmail = document.getElementById('userDropdownEmail');
    
    const mAvatar = document.getElementById('mobileUserAvatar');
    const mDisplayName = document.getElementById('mobileUserDisplayName');
    const mEmail = document.getElementById('mobileUserEmail');

    // Dashboard elements
    const dashSidebarAvatar = document.getElementById('dashSidebarAvatar');
    const dashSidebarName = document.getElementById('dashSidebarName');
    const dashMainWelcome = document.getElementById('dashMainWelcome');
    const dashMainAvatar = document.getElementById('dashMainAvatar');
    const dashMainName = document.getElementById('dashMainName');
    const dashMainEmail = document.getElementById('dashMainEmail');

    // Profile View Elements
    const dashProfileAvatar = document.getElementById('dashProfileAvatar');
    const dashProfileName = document.getElementById('dashProfileName');
    const dashProfileEmail = document.getElementById('dashProfileEmail');
    const dashFormName = document.getElementById('dashFormName');
    const dashFormEmail = document.getElementById('dashFormEmail');
    
    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        const letter = name.charAt(0).toUpperCase();
        
        if (avatar) avatar.textContent = letter;
        if (displayName) displayName.textContent = name;
        if (dropEmail) dropEmail.textContent = user.email;
        
        if (mAvatar) mAvatar.textContent = letter;
        if (mDisplayName) mDisplayName.textContent = name;
        if (mEmail) mEmail.textContent = user.email;

        if (dashSidebarAvatar) dashSidebarAvatar.textContent = letter;
        if (dashSidebarName) dashSidebarName.textContent = name;
        if (dashMainWelcome) dashMainWelcome.textContent = `Welcome back, ${name}`;
        if (dashMainAvatar) dashMainAvatar.textContent = letter;
        if (dashMainName) dashMainName.textContent = name;
        if (dashMainEmail) dashMainEmail.textContent = user.email;

        // Populate Profile Page
        if (dashProfileAvatar) dashProfileAvatar.textContent = letter;
        if (dashProfileName) dashProfileName.textContent = name;
        if (dashProfileEmail) dashProfileEmail.textContent = user.email;
        if (dashFormName) dashFormName.value = name;
        if (dashFormEmail) dashFormEmail.value = user.email;
        
        if (desktopAuth) desktopAuth.style.display = 'none';
        if (desktopUser) desktopUser.style.display = 'flex';
        if (mobileAuth) mobileAuth.style.display = 'none';
        if (mobileUser) mobileUser.style.display = 'flex';
        
        const mobileHeaderUserMenu = document.getElementById('mobileHeaderUserMenu');
        if (mobileHeaderUserMenu) mobileHeaderUserMenu.style.display = 'block';
        
        const guestNav = document.getElementById('guestMobileNav');
        const userNav = document.getElementById('userMobileNav');
        if (guestNav) {
            guestNav.classList.add('hide-important');
            guestNav.style.display = 'none';
        }
        if (userNav) {
            userNav.classList.remove('hide-important');
            userNav.style.display = 'flex';
        }
    } else {
        if (desktopAuth) desktopAuth.style.display = 'flex';
        if (desktopUser) desktopUser.style.display = 'none';
        if (mobileAuth) mobileAuth.style.display = 'flex';
        if (mobileUser) mobileUser.style.display = 'none';
        
        const mobileHeaderUserMenu = document.getElementById('mobileHeaderUserMenu');
        if (mobileHeaderUserMenu) mobileHeaderUserMenu.style.display = 'none';

        const guestNav = document.getElementById('guestMobileNav');
        const userNav = document.getElementById('userMobileNav');
        if (guestNav) {
            guestNav.classList.remove('hide-important');
            guestNav.style.display = 'flex';
        }
        if (userNav) {
            userNav.classList.add('hide-important');
            userNav.style.display = 'none';
        }
    }
    
    // Ensure mobile navigation has the correct tab highlighted after an auth UI swap
    if (typeof window.updateMobileNavHighlight === 'function') {
        window.updateMobileNavHighlight();
    }
}

// Setup real-time listeners for standard Firebase session state
if (typeof window.auth !== 'undefined') {
    window.auth.onAuthStateChanged(user => {
        updateAuthUI(user);
    });
}

// Switch nested dashboard views
function switchDashView(view) {
    const dashHome = document.getElementById('dashViewHome');
    const dashListings = document.getElementById('dashViewListings');
    const dashOrders = document.getElementById('dashViewOrders');
    const dashBlogs = document.getElementById('dashViewBlogs');
    const dashProfile = document.getElementById('dashViewProfile');

    const navHome = document.getElementById('navDashHome');
    const navListings = document.getElementById('navDashListings');
    const navOrders = document.getElementById('navDashOrders');
    const navBlogs = document.getElementById('navDashBlogs');
    const navProfile = document.getElementById('navDashProfile');

    // Helper: safely remove active state from a nav link
    function deactivateNav(nav) {
        if (!nav) return;
        nav.classList.remove('active');
        var arrow = nav.querySelector('.arrow-icon');
        if (arrow) arrow.style.display = 'none';
    }

    // Helper: safely activate a nav link
    function activateNav(nav) {
        if (!nav) return;
        nav.classList.add('active');
        var arrow = nav.querySelector('.arrow-icon');
        if (arrow) arrow.style.display = 'inline-block';
    }

    // Remove active state from all nav items
    deactivateNav(navHome);
    deactivateNav(navListings);
    deactivateNav(navOrders);
    deactivateNav(navBlogs);
    deactivateNav(navProfile);

    // Hide all views
    if (dashHome) dashHome.style.display = 'none';
    if (dashListings) dashListings.style.display = 'none';
    if (dashOrders) dashOrders.style.display = 'none';
    if (dashBlogs) dashBlogs.style.display = 'none';
    if (dashProfile) dashProfile.style.display = 'none';

    // Show the selected view
    if (view === 'listings') {
        if (dashListings) { dashListings.style.display = 'flex'; dashListings.style.flexDirection = 'column'; }
        activateNav(navListings);
    } else if (view === 'orders') {
        if (dashOrders) { dashOrders.style.display = 'flex'; dashOrders.style.flexDirection = 'column'; }
        activateNav(navOrders);
    } else if (view === 'blogs') {
        if (dashBlogs) { dashBlogs.style.display = 'flex'; dashBlogs.style.flexDirection = 'column'; dashBlogs.style.gap = '30px'; }
        activateNav(navBlogs);
        // Always re-render blogs table with current data
        var blogsList = window.dashBlogsList || [];
        if (window.renderDashBlogsTable) window.renderDashBlogsTable(blogsList);
    } else if (view === 'profile') {
        if (dashProfile) { dashProfile.style.display = 'flex'; dashProfile.style.flexDirection = 'column'; }
        activateNav(navProfile);
    } else {
        // Default: home
        if (dashHome) { dashHome.style.display = 'flex'; dashHome.style.flexDirection = 'column'; }
        activateNav(navHome);
    }
}

// WhatsApp Popup Close Logic
function closeWaPopup(e) {
    e.preventDefault();
    e.stopPropagation();
    const container = document.getElementById('waFloatContainer');
    if(container) {
        container.classList.add('popup-closed');
    }
}

// Handle Mobile User Navigation clicks
window.handleMobileUserNav = function(view, element) {
    // Show the dashboard page
    showPage('dashboard');
    // Switch the internal dashboard view
    switchDashView(view);
    
    // Remove active class from all user mobile nav items
    const navItems = document.querySelectorAll('#userMobileNav .nav-dash-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked element
    if (element) {
        element.classList.add('active');
    }
}

// Handle Top Header Grid Icon Click
window.handleHeaderDashboardClick = function() {
    if (typeof window.auth !== 'undefined' && window.auth.currentUser) {
        // User is logged in, navigate to dashboard home and highlight bottom nav
        const dashHomeNav = document.querySelector('#userMobileNav .nav-dash-item:first-child');
        handleMobileUserNav('home', dashHomeNav);
    } else {
        // User is not logged in, show authentication page
        showPage('auth');
    }
}

// Toggle Profile Edit Section
window.toggleProfileEdit = function() {
    const editSection = document.getElementById('profileEditSection');
    const btn = document.getElementById('editProfileBtn');
    
    if (editSection.style.display === 'none') {
        editSection.style.display = 'block';
        btn.innerHTML = '<i class="fa-solid fa-times"></i> Cancel Editing';
        btn.style.background = '#ef4444'; // Red for cancel
        // Scroll to the edit section smoothly
        setTimeout(() => {
            editSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        editSection.style.display = 'none';
        btn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
        btn.style.background = '#10b981'; // Green for edit
    }
}

// Shop Dropdowns Logic
window.toggleDropdown = function(id) {
    // Close other dropdowns
    document.querySelectorAll('.custom-dropdown-menu').forEach(menu => {
        if(menu.id !== id) menu.classList.remove('show');
    });
    
    // Toggle requested
    const menu = document.getElementById(id);
    menu.classList.toggle('show');
};

window.selectOption = function(labelId, value, dropdownId, element) {
    document.getElementById(labelId).innerText = value;
    document.getElementById(dropdownId).classList.remove('show');
    
    // Update active states
    const items = document.getElementById(dropdownId).querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.classList.remove('active');
        item.querySelector('.check-icon').style.display = 'none';
    });
    element.classList.add('active');
    element.querySelector('.check-icon').style.display = 'block';
};

// Close dropdowns if clicked outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-dropdown-container')) {
        document.querySelectorAll('.custom-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Shop Live Search Filter
window.filterShopProducts = function() {
    const input = document.getElementById('shopSearchInput');
    const filter = input.value.toLowerCase();
    
    // Find all product cards in the shop page
    const shopPage = document.getElementById('shopPage');
    if(!shopPage) return;
    
    const cards = shopPage.querySelectorAll('.service-card.product-card');
    
    let visibleCount = 0;
    
    cards.forEach(card => {
        // Find the title (h3) and description within the card
        const titleElement = card.querySelector('h3');
        const descElement = card.querySelector('.product-desc');
        
        let textToSearch = "";
        if (titleElement) textToSearch += titleElement.innerText.toLowerCase() + " ";
        if (descElement) textToSearch += descElement.innerText.toLowerCase();
        
        if (textToSearch.includes(filter)) {
            card.style.display = ''; // Restore original display
            visibleCount++;
        } else {
            card.style.display = 'none'; // Hide
        }
    });
    
    // Update the item badge count
    const badgeCount = shopPage.querySelector('.item-badge');
    if(badgeCount) {
        badgeCount.innerText = visibleCount + ' items';
    }
};

// =============================================
// SHOP SORT & CATEGORY FILTER ENGINE
// =============================================

// Override selectOption to trigger filter+sort after selection
window.selectOption = function(labelId, value, dropdownId, element) {
    document.getElementById(labelId).innerText = value;
    document.getElementById(dropdownId).classList.remove('show');

    // Update active states & checkmarks
    const items = document.getElementById(dropdownId).querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.classList.remove('active');
        item.querySelector('.check-icon').style.display = 'none';
    });
    element.classList.add('active');
    element.querySelector('.check-icon').style.display = 'block';

    // Apply filter + sort
    applyShopFiltersAndSort();
};

window.renderShopProducts = function() {
    const shopPage = document.getElementById('shopPage');
    if (!shopPage) return;
    const grid = shopPage.querySelector('.services-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const products = Object.values(window.PRODUCTS_DATA || {});
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'service-card product-card';
        card.setAttribute('data-category', p.category || 'General');
        card.setAttribute('data-price', p.price || 0);
        card.setAttribute('data-old-price', p.oldPrice || 0);
        card.setAttribute('data-rating', p.rating || 5.0);
        card.setAttribute('data-sold', p.sold || 0);
        card.setAttribute('data-date', p.id || Date.now());
        card.onclick = () => openProduct(p.id);
        card.style.cursor = 'pointer';
        
        let badgesHtml = '';
        if (p.discount) badgesHtml += `<div class="badge-discount">${p.discount}</div>`;
        if (p.badge) badgesHtml += `<div class="badge-featured"><i class="fa-solid fa-star"></i> ${p.badge}</div>`;
        
        let ribbonHtml = '';
        if (p.ribbonStatus) {
            let ribbonColor = '#10b981'; // default green (For Sale)
            if (p.ribbonStatus.toLowerCase() === 'sold') ribbonColor = '#ef4444'; // red
            else if (p.ribbonStatus.toLowerCase() === 'pending') ribbonColor = '#f59e0b'; // orange
            
            ribbonHtml = `<div class="status-ribbon" style="position: absolute; top: 15px; right: -35px; background: ${ribbonColor}; color: white; padding: 6px 40px; font-size: 0.75rem; font-weight: 800; transform: rotate(45deg); z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.15); letter-spacing: 1px; text-transform: uppercase;">${p.ribbonStatus}</div>`;
        }
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; overflow: hidden;">
                ${ribbonHtml}
                ${badgesHtml}
                <img src="${p.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80'}" alt="${p.title || 'Product'}" loading="lazy">
                <div class="card-overlay"><span class="view-btn"><i class="fa-solid fa-eye"></i> Quick View</span></div>
            </div>
            <div class="product-info-body">
                <div class="product-category">${p.category || 'General'}</div>
                <h3>${p.title || 'Untitled Product'}</h3>
                <p class="product-desc">${p.shortDesc || ''}</p>
                <div class="product-stats">
                    <span class="rating-star"><i class="fa-solid fa-star"></i> ${(p.rating||5.0).toFixed(1)} <span style="color:#cbd5e1">(${p.reviews||0})</span></span>
                    <span>| ${p.sold||0} sold</span>
                </div>
            </div>
            <div class="product-card-footer">
                <div class="price-container">
                    <span class="current-price">USD ${p.price||0}</span>
                    <span class="old-price">USD ${p.oldPrice||0}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

window.applyShopFiltersAndSort = function() {
    const shopPage = document.getElementById('shopPage');
    if (!shopPage) return;

    const grid = shopPage.querySelector('.services-grid');
    if (!grid) return;

    const sortValue   = (document.getElementById('sortLabel')     || {}).innerText || 'Newest First';
    const catValue    = (document.getElementById('categoryLabel') || {}).innerText || 'All Categories';
    const searchValue = ((document.getElementById('shopSearchInput') || {}).value || '').toLowerCase();

    // Get all cards
    let cards = Array.from(grid.querySelectorAll('.service-card.product-card'));

    // --- 1. CATEGORY FILTER ---
    cards.forEach(card => {
        const cardCat  = (card.getAttribute('data-category') || '').toLowerCase();
        const title    = (card.querySelector('h3') || {}).innerText || '';
        const desc     = (card.querySelector('.product-desc') || {}).innerText || '';
        const fullText = (title + ' ' + desc).toLowerCase();

        const catMatch  = (catValue === 'All Categories') || (cardCat === catValue.toLowerCase());
        const searchMatch = !searchValue || fullText.includes(searchValue);

        card.style.display = (catMatch && searchMatch) ? '' : 'none';
    });

    // --- 2. SORT (only visible cards) ---
    let visibleCards = cards.filter(c => c.style.display !== 'none');

    visibleCards.sort((a, b) => {
        if (sortValue === 'Price: Low to High') {
            return parseFloat(a.getAttribute('data-price') || 0) - parseFloat(b.getAttribute('data-price') || 0);
        } else if (sortValue === 'Price: High to Low') {
            return parseFloat(b.getAttribute('data-price') || 0) - parseFloat(a.getAttribute('data-price') || 0);
        } else if (sortValue === 'Most Popular') {
            return parseFloat(b.getAttribute('data-sold') || 0) - parseFloat(a.getAttribute('data-sold') || 0);
        } else if (sortValue === 'Best Rated') {
            return parseFloat(b.getAttribute('data-rating') || 0) - parseFloat(a.getAttribute('data-rating') || 0);
        } else {
            // Newest First (default) - highest date number = newest
            return parseFloat(b.getAttribute('data-date') || 0) - parseFloat(a.getAttribute('data-date') || 0);
        }
    });

    // Re-append sorted visible cards to grid (hidden cards stay hidden)
    visibleCards.forEach(card => grid.appendChild(card));

    // --- 3. UPDATE COUNT BADGE ---
    const badge = shopPage.querySelector('.item-badge');
    if (badge) badge.innerText = visibleCards.length + ' items';
};

// Hook search into the combined filter engine
window.filterShopProducts = function() {
    window.renderShopProducts(); // Re-render first
    window.applyShopFiltersAndSort();
};

// =============================================
// PRODUCT DATA - Local Fallback (no backend needed)
// =============================================

function normalizeAssetPath(path) {
  if (typeof path !== 'string') return path;
  return path
    .replace(/^\.\/?assets\//, 'assets/')
    .replace(/^\/?assets\/prod_/, 'assets/products/prod_')
    .replace('assets/products/prod_8_gallery_1.jpg', 'assets/products/prod_8_main.jpg');
}

function normalizeProductAssets(product) {
  if (!product || typeof product !== 'object') return product;
  product.image = normalizeAssetPath(product.image);
  if (Array.isArray(product.gallery)) {
    product.gallery = product.gallery.map(normalizeAssetPath);
  }
  return product;
}

const PRODUCTS_FALLBACK = [
  { id:"p1", title:"Perfex CRM - Powerful Open Source CRM", category:"PHP Scripts", price:59, oldPrice:120, discount:"-51%", badge:"Best Seller", badgeColor:"#ef4444", rating:4.5, reviews:342, sold:1523, shortDesc:"Complete Customer Relationship Management software for any company.", image:"assets/products/prod_0_main.jpg", features:["Project Management","Invoicing","Support Tickets","Leads Tracking","Finance Management"], included:["Full Source Code","6 Months Support","Future Updates"] },
  { id:"p2", title:"MagicAI - OpenAI Content, Text & Image Generator", category:"SaaS Software", price:39, oldPrice:79, discount:"-51%", badge:"Best Seller", badgeColor:"#ef4444", rating:4.7, reviews:512, sold:2341, shortDesc:"Advanced AI platform to generate text, images and code.", image:"assets/products/prod_1_main.jpg", features:["AI Text Generator","AI Image Generator","AI Code Generator","SaaS Ready","Subscription Billing"], included:["SaaS Platform Code","Admin Panel","Payment Gateways"] },
  { id:"p3", title:"Acelle - Email Marketing Web Application", category:"Marketing", price:49, oldPrice:99, discount:"-51%", badge:"Best Seller", badgeColor:"#ef4444", rating:4.3, reviews:278, sold:1120, shortDesc:"Self-hosted email marketing web app written in PHP.", image:"assets/products/prod_2_main.jpg", features:["Campaign Management","List Segmentation","Autoresponders","Bounce Handling","SMTP Integration"], included:["Acelle Source Code","API Documentation","Email Templates"] },
  { id:"p4", title:"Stackposts - Social Media Marketing Tool", category:"Marketing", price:45, oldPrice:89, discount:"-49%", rating:4.6, reviews:198, sold:876, shortDesc:"Auto post & schedule on Instagram, Facebook & Twitter.", image:"assets/products/prod_3_main.jpg", features:["Auto Posting","Analytics","Multi-Account Support","Watermark Support","Proxy Manager"], included:["Web App","Documentation","Free Installation"] },
  { id:"p5", title:"FileBird - WordPress Media Library Folders", category:"WordPress Plugins", price:39, oldPrice:0, discount:"Limited", rating:4.8, reviews:156, sold:654, shortDesc:"Organize WordPress media files into folders.", image:"assets/products/prod_4_main.jpg", features:["Drag and Drop Interface","Unlimited Folders","Smart Search","Gutenberg Ready","Multilingual"], included:["Plugin ZIP","License Key","6 Months Support"] },
  { id:"p21", title:"Node.js REST API Boilerplate", category:"Code Scripts", price:42, oldPrice:89, discount:"-53%", rating:4.4, reviews:145, sold:623, shortDesc:"Production-ready Node.js API with auth & Docker.", image:"assets/products/wp_pexels_mowgli2.jpg", features:["JWT Auth","Database ORM","File Upload","Email Service","Docker Setup"], included:["Complete Source","Postman Collection","Deployment Guide"] },
  { id:"p22", title:"AI Content Writer & Blog Generator", category:"SaaS Software", price:59, oldPrice:129, discount:"-54%", badge:"Best Seller", badgeColor:"#ef4444", rating:4.8, reviews:456, sold:1987, shortDesc:"AI writing platform with GPT & WordPress auto-posting.", image:"assets/products/wp_01_preview_magic9.9.jpg", features:["AI Writing","Batch Generation","SEO Analysis","WordPress Auto-Post","Template Library"], included:["SaaS Platform","Admin Dashboard","API Access"] },
  { id:"p23", title:"Facebook Pixel & Retargeting Tool", category:"SEO", price:25, oldPrice:55, discount:"-55%", rating:4.0, reviews:78, sold:345, shortDesc:"Facebook Pixel manager with retargeting automation.", image:"assets/products/prod_6_main.jpg", features:["Pixel Manager","Event Tracking","Custom Audiences","Retargeting","Conversion Analytics"], included:["Plugin Files","Integration Guide","Email Support"] },
  { id:"p24", title:"Telegram Bot & Notification System", category:"Automation", price:32, oldPrice:69, discount:"-54%", rating:4.3, reviews:112, sold:478, shortDesc:"Multi-purpose Telegram bot with payments & group manager.", image:"assets/products/prod_8_main.jpg", features:["Bot Builder","Notifications","Command System","Payment Integration","Group Manager"], included:["Source Code","Bot Setup Guide","Hosting Config"] },
  { id:"p25", title:"Professional Logo & Branding Kit", category:"Tools & Software", price:19, oldPrice:49, discount:"-61%", rating:4.6, reviews:89, sold:567, shortDesc:"Complete branding package with logo templates.", image:"assets/products/prod_6_gallery_4.jpg", features:["Logo Templates","Business Cards","Social Media Kit","Brand Guidelines","Vector Files"], included:["Editable Files","Font Pack","Usage License"] },
  { id:"p26", title:"Affiliate Marketing Platform", category:"eCommerce", price:74, oldPrice:159, discount:"-53%", badge:"Trending", badgeColor:"#f97316", rating:4.4, reviews:234, sold:1023, shortDesc:"Full affiliate platform with commission tracking.", image:"assets/products/prod_7_main.jpg", features:["Commission Tracking","Referral Links","Payout System","Performance Dashboard","Coupon Engine"], included:["Complete System","Merchant Panel","Affiliate Panel"] },
  { id:"p27", title:"Advanced Web Scraper & Data Extractor", category:"Code Scripts", price:38, oldPrice:84, discount:"-55%", rating:4.1, reviews:67, sold:289, shortDesc:"PHP web scraper with proxy support & CSV export.", image:"assets/products/prod_9_main.jpg", features:["CSS Selectors","Proxy Support","Scheduled Scraping","CSV/JSON Export","Multi-threading"], included:["PHP Scripts","Configuration Files","Usage Examples"] },
  { id:"p28", title:"Social Media Auto Poster - Multi Platform", category:"Automation", price:44, oldPrice:94, discount:"-53%", rating:4.3, reviews:178, sold:765, shortDesc:"Schedule & auto-post across all major platforms.", image:"assets/products/prod_6_gallery_2.jpg", features:["Multi-Platform","Schedule Posts","Media Library","Analytics","Team Collaboration"], included:["Web Application","API Integrations","User Manual"] },
  { id:"p29", title:"E-commerce Dropshipping Management", category:"eCommerce", price:65, oldPrice:139, discount:"-53%", rating:4.2, reviews:145, sold:623, shortDesc:"Dropshipping system with supplier integration.", image:"assets/products/prod_7_gallery_1.jpg", features:["Supplier Integration","Order Tracking","Inventory Sync","Profit Calculator","Shipping Manager"], included:["Source Code","Database Schema","Integration Guide"] },
  { id:"p30", title:"PDF Generation & Document Automation", category:"Code Scripts", price:28, oldPrice:59, discount:"-53%", rating:4.0, reviews:56, sold:234, shortDesc:"PHP PDF generation system with templates & batch processing.", image:"assets/products/prod_8_main.jpg", features:["Template System","Dynamic Content","Batch Processing","Cloud Storage","API Support"], included:["PHP Library","Sample Templates","Developer Docs"] }
];

// Populate PRODUCTS_DATA from localStorage first, then fallback to hardcoded
// (Firestore loading is handled in api.js after all scripts load)
window.PRODUCTS_DATA = {};
try {
  const saved = localStorage.getItem('vextro_products');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && Object.keys(parsed).length > 0) {
      window.PRODUCTS_DATA = parsed;
      let changed = false;
      Object.values(window.PRODUCTS_DATA).forEach(product => {
        const before = JSON.stringify({ image: product.image, gallery: product.gallery });
        normalizeProductAssets(product);
        if (before !== JSON.stringify({ image: product.image, gallery: product.gallery })) changed = true;
      });
      if (changed) localStorage.setItem('vextro_products', JSON.stringify(window.PRODUCTS_DATA));
    }
  }
} catch(e) {}
if (Object.keys(window.PRODUCTS_DATA).length === 0) {
  PRODUCTS_FALLBACK.forEach(p => {
    window.PRODUCTS_DATA[p.id] = {
      ...normalizeProductAssets({ ...p }),
      gallery: p.gallery || [normalizeAssetPath(p.image)],
      fullDesc: p.fullDesc || p.shortDesc,
      whatsappMsg: `Hi! I want to buy ${p.title} for USD ${p.price}. Please guide me.`
    };
  });
  localStorage.setItem('vextro_products', JSON.stringify(window.PRODUCTS_DATA));
}

let currentProductId = null;

window.openProduct = function(id) {
    const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[id] : null;
    if (!p) return;
    currentProductId = id;

    try {
        if(document.getElementById('pdBreadcrumbTitle')) document.getElementById('pdBreadcrumbTitle').innerText = p.title;
        if(document.getElementById('pdHeroImage')) document.getElementById('pdHeroImage').src = p.image;
        
        const thumbContainer = document.getElementById('pdThumbnailsContainer');
        if (thumbContainer) {
            thumbContainer.innerHTML = '';
            const gallery = (p.gallery && p.gallery.length > 0) ? p.gallery : [p.image];
            gallery.forEach((imgSrc, idx) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = 'Thumb';
                img.style.cursor = 'pointer';
                if (idx === 0) img.className = 'active';
                img.onclick = () => {
                    document.getElementById('pdHeroImage').src = imgSrc;
                    Array.from(thumbContainer.children).forEach(c => c.classList.remove('active'));
                    img.classList.add('active');
                };
                thumbContainer.appendChild(img);
            });
        }
        
        if(document.getElementById('pdCategory')) document.getElementById('pdCategory').innerText = p.category;
        if(document.getElementById('pdTitle')) document.getElementById('pdTitle').innerText = p.title;
        if(document.getElementById('pdRating')) document.getElementById('pdRating').innerText = p.rating ? p.rating.toFixed(1) : "5.0";
        if(document.getElementById('pdReviewCount')) document.getElementById('pdReviewCount').innerText = p.reviews || "0";
        if(document.getElementById('pdSoldCount')) document.getElementById('pdSoldCount').innerText = p.sold || "0";
        if(document.getElementById('pdShortDesc')) document.getElementById('pdShortDesc').innerText = p.shortDesc;
        if(document.getElementById('pdCurrentPrice')) document.getElementById('pdCurrentPrice').innerText = p.price;
        if(document.getElementById('pdOldPrice')) document.getElementById('pdOldPrice').innerText = 'USD ' + p.oldPrice;

        const discBadge = document.getElementById('pdBadgeDiscount');
        if (discBadge) {
            discBadge.innerText = p.discount;
            discBadge.style.display = p.discount ? 'block' : 'none';
        }

        const featBadge = document.getElementById('pdBadgeFeatured');
        if (featBadge) {
            if (p.badge) {
                featBadge.innerText = p.badge.replace('? ', '').replace('?? ', '');
                featBadge.style.display = 'block';
            } else {
                featBadge.style.display = 'none';
            }
        }

        const waLink = 'https://wa.me/923281270900?text=' + encodeURIComponent(p.whatsappMsg || '');
        if(document.getElementById('pdBuyNow')) document.getElementById('pdBuyNow').href = waLink;

        if(document.getElementById('pdFullDesc')) document.getElementById('pdFullDesc').innerHTML = `<p>${p.fullDesc}</p>`;
        if(document.getElementById('pdFeatures')) document.getElementById('pdFeatures').innerHTML = (p.features||[]).map(f => `<li>${f}</li>`).join('');

        const reviewsEl = document.getElementById('pdReviews');
        if (reviewsEl) {
            const fakeReviews = [
                { name: "Shikha Rajani", avatar: "S", date: "5/9/2026", text: "This is really good script and working fine" },
                { name: "John Doe", avatar: "J", date: "4/20/2026", text: "Excellent product, exactly what I needed for my project. highly recommended." }
            ];
            
            let revHtml = '';
            fakeReviews.forEach(r => {
                revHtml += `
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
                    <div class="pd-rev-header">
                        <div class="pd-rev-left">
                            <div class="pd-rev-avatar">${r.avatar}</div>
                            <div>
                                <div class="pd-rev-name">${r.name}</div>
                                <div class="pd-stars" style="font-size:0.8rem; letter-spacing:1px; color:#ffb800;">
                                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                                </div>
                            </div>
                        </div>
                        <div class="pd-rev-date">${r.date}</div>
                    </div>
                    <div class="pd-rev-text">${r.text}</div>
                </div>
                `;
            });
            reviewsEl.innerHTML = revHtml;
        }

        const popGrid = document.getElementById('pdPopularGrid');
        const mainGrid = document.querySelector('#shopPage .services-grid');
        if (popGrid && mainGrid) {
            popGrid.innerHTML = mainGrid.innerHTML;
        }
    } catch(e) {
        console.error("Error setting product details:", e);
    }

        // Directly show product detail, bypass showPage to avoid override issues
    document.querySelectorAll('#homePage,#blogsPage,#shopPage,#marketplacePage,#guidePage,#aboutPage,#privacyPage,#termsPage,#refundPage,#contactPage,#faqPage,#emailSupportPage,#authPage,#dashboardPage,#createBlogPage,#mpDetailPage,#blogDetailPage')
      .forEach(el => { if (el) el.style.display = 'none'; });
    const pdp = document.getElementById('productDetailPage');
    if (pdp) pdp.style.display = 'block';
    window.scrollTo(0, 0);
};

window.closeProduct = function() {
  document.querySelectorAll('#homePage,#productDetailPage,#blogsPage,#marketplacePage,#guidePage,#aboutPage,#privacyPage,#termsPage,#refundPage,#contactPage,#faqPage,#emailSupportPage,#authPage,#dashboardPage,#createBlogPage,#mpDetailPage,#blogDetailPage')
    .forEach(el => { if (el) el.style.display = 'none'; });
  const shop = document.getElementById('shopPage');
  if (shop) shop.style.display = 'block';
  window.scrollTo(0, 0);
};

window.viewDemo = function() {
    const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[currentProductId] : null;
    if (p && p.demoUrl && p.demoUrl !== '#') {
        window.open(p.demoUrl, '_blank');
    } else {
        alert('Demo coming soon! Contact us on WhatsApp for a live preview.');
    }
};

window.shareProduct = function() {
    const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[currentProductId] : null;
    if (!p) return;
    if (navigator.share) {
        navigator.share({ title: p.title, text: 'Check out this amazing product!', url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    }
};








// =============================================
// MARKETPLACE LISTING DATA & LOGIC
// =============================================

const MARKETPLACE_FALLBACK = {
    1: {
        id: 1,
        title: "Movies Downloading Website - AdSense Active",
        category: "Website",
        status: "Active",
        price: "99",
        location: "Pakistan",
        views: 17,
        image: "assets/images/product1.jpg",
        stats: [
            { label: "Traffic/Mo", value: "15,000" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Age", value: "2 yr" },
            { label: "Pages", value: "50+" }
        ],
        info: [
            { label: "Listed", value: "May 2026" },
            { label: "Status", value: "Active" },
            { label: "Location", value: "Pakistan" },
            { label: "Type", value: "Website" },
            { label: "Monetization", value: "AdSense" }
        ],
        description: "<p>A fully functional movies downloading website with active AdSense monetization. The website gets consistent organic traffic of 15,000+ visitors per month from Pakistan and worldwide.</p><p>Included in sale: Full source code, domain transfer, hosting setup guide, AdSense account setup, and 30 days WhatsApp support after purchase.</p><p>This is perfect for anyone wanting to enter the digital publishing space without starting from scratch.</p>"
    },
    2: {
        id: 2,
        title: "2023 Old Non Verified Play Console Account",
        category: "Play Console",
        status: "Sold",
        price: "2,000",
        location: "India",
        views: 20,
        image: "assets/images/product2.jpg",
        stats: [
            { label: "Age", value: "30 mo" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Apps", value: "0" },
            { label: "Status", value: "Sold" }
        ],
        info: [
            { label: "Account Age", value: "30 Months" },
            { label: "Verified", value: "No" },
            { label: "Location", value: "India" },
            { label: "Status", value: "Sold" },
            { label: "Type", value: "Play Console" }
        ],
        description: "<p>A 30-month old Google Play Console account. Non-verified personal account suitable for publishing Android apps. Clean history with no policy violations.</p><p>Includes full account transfer, Gmail access, and 7 days support after handover.</p>"
    },
    3: {
        id: 3,
        title: "2019 Organization Google Play Console Account",
        category: "Play Console",
        status: "Active",
        price: "2,200",
        location: "India",
        views: 14,
        image: "assets/images/product3.jpg",
        stats: [
            { label: "Age", value: "79 mo" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Apps", value: "0" },
            { label: "Type", value: "Organization" }
        ],
        info: [
            { label: "Account Age", value: "79 Months" },
            { label: "Account Type", value: "Organization" },
            { label: "Location", value: "India" },
            { label: "Status", value: "Active" },
            { label: "Policy", value: "Clean" }
        ],
        description: "<p>A premium 2019 Organization-type Google Play Console account. Organization accounts are more trusted by Google and have higher app approval rates.</p><p>Perfect for serious app developers looking for a reliable, aged developer account. No apps published, clean policy record, instant transfer available.</p>"
    },
    4: {
        id: 4,
        title: "2019 Old Age Google AdSense Account",
        category: "Other",
        status: "Active",
        price: "1,200",
        location: "India",
        views: 19,
        image: "assets/images/product4.jpg",
        stats: [
            { label: "Age", value: "88 mo" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Type", value: "AdSense" },
            { label: "Status", value: "Active" }
        ],
        info: [
            { label: "Account Age", value: "88 Months" },
            { label: "Account Type", value: "AdSense" },
            { label: "Location", value: "India" },
            { label: "Status", value: "Active" },
            { label: "Payments", value: "Enabled" }
        ],
        description: "<p>A 7-year-old Google AdSense account with full payment threshold eligibility. This account has been kept clean with no policy violations and is ready for monetization on any website.</p><p>Ideal for new publishers who want to skip the AdSense approval wait. Full transfer via Google account handover.</p>"
    },
    5: {
        id: 5,
        title: "2025 Organization Play Console - 2 Apps",
        category: "Play Console",
        status: "Active",
        price: "600",
        location: "India",
        views: 14,
        image: "assets/images/product5.jpg",
        stats: [
            { label: "Age", value: "12 mo" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Apps", value: "2" },
            { label: "Type", value: "Org" }
        ],
        info: [
            { label: "Account Age", value: "12 Months" },
            { label: "Account Type", value: "Organization" },
            { label: "Apps", value: "2 Published" },
            { label: "Status", value: "Active" },
            { label: "Location", value: "India" }
        ],
        description: "<p>A 2025 Organization Play Console account with 2 published apps. The apps are live on the Play Store with no violations. Good account for someone wanting to expand their app portfolio.</p><p>Transfer includes full Gmail access, Play Console ownership, and app source codes (if requested).</p>"
    },
    6: {
        id: 6,
        title: "2026 Personal Google Play Console - 1 App",
        category: "Play Console",
        status: "Active",
        price: "500",
        location: "India",
        views: 19,
        image: "assets/images/product6.jpg",
        stats: [
            { label: "Age", value: "6 mo" },
            { label: "Rev/Mo", value: "$0" },
            { label: "Apps", value: "1" },
            { label: "Type", value: "Personal" }
        ],
        info: [
            { label: "Account Age", value: "6 Months" },
            { label: "Account Type", value: "Personal" },
            { label: "Apps", value: "1 Published" },
            { label: "Status", value: "Active" },
            { label: "Location", value: "India" }
        ],
        description: "<p>A fresh 2026 personal Google Play Console account with 1 successfully published app. Clean account with no policy warnings. Ideal for new app developers needing a starter account.</p><p>Includes full account access transfer, app source code, and 7 days post-sale support on WhatsApp.</p>"
    }
};
const MARKETPLACE_DATA = window.vextroLoad('marketplace') || MARKETPLACE_FALLBACK;
// Sync from Firestore in background
(async () => {
  if (window.fsLoadMap) {
    const fsData = await window.fsLoadMap('listings');
    if (fsData && Object.keys(fsData).length > 0) {
      Object.assign(MARKETPLACE_DATA, fsData);
    }
  }
})();

// Filter Marketplace by Category
window.filterMpCategory = function(category, el) {
    // Update active pill
    document.querySelectorAll('.mp-cat-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');

    // Filter cards
    const cards = document.querySelectorAll('#marketplacePage .mp-card');
    let count = 0;
    cards.forEach(card => {
        const cat = card.getAttribute('data-mp-category') || '';
        if (category === 'All' || cat === category) {
            card.style.display = '';
            count++;
        } else {
            card.style.display = 'none';
        }
    });

    // Update count badge
    const badge = document.getElementById('mpCountBadge');
    if (badge) badge.innerText = count;
};

// Open Marketplace Listing Detail
window.openMarketplaceListing = function(id) {
    const listing = MARKETPLACE_DATA[id];
    if (!listing) return;

    // Status badge
    const statusEl = document.getElementById('mpdStatusBadge');
    if (statusEl) {
        statusEl.innerText = listing.status;
        statusEl.style.background = listing.status === 'Active' ? '#dcfce7' : '#fee2e2';
        statusEl.style.color = listing.status === 'Active' ? '#16a34a' : '#dc2626';
    }

    if(document.getElementById('mpdTitle')) document.getElementById('mpdTitle').innerText = listing.title;
    if(document.getElementById('mpdCategory')) document.getElementById('mpdCategory').innerText = listing.category;
    if(document.getElementById('mpdLocation')) document.getElementById('mpdLocation').innerText = listing.location;
    if(document.getElementById('mpdViews')) document.getElementById('mpdViews').innerText = listing.views;
    if(document.getElementById('mpdImage')) document.getElementById('mpdImage').src = listing.image;
    if(document.getElementById('mpdPrice')) document.getElementById('mpdPrice').innerText = listing.price;
    if(document.getElementById('mpdDescription')) document.getElementById('mpdDescription').innerHTML = listing.description;

    // WhatsApp link
    const waMsg = `Hi! I am interested in the listing: "${listing.title}" priced at $${listing.price}. Please provide more details.`;
    const waLink = document.getElementById('mpdWhatsApp');
    if (waLink) waLink.href = 'https://wa.me/923281270900?text=' + encodeURIComponent(waMsg);

    // Stats
    const statsRow = document.getElementById('mpdStatsRow');
    if (statsRow) {
        statsRow.innerHTML = listing.stats.map(s => `
            <div class="mp-stat-item">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
            </div>
        `).join('');
    }

    // Info list
    const infoList = document.getElementById('mpdInfoList');
    if (infoList) {
        infoList.innerHTML = listing.info.map(i => `
            <div class="mp-info-row">
                <span>${i.label}</span>
                <span>${i.value}</span>
            </div>
        `).join('');
    }

    showPage('mpDetail');
    window.scrollTo(0, 0);
};


// Marketplace Search Filter
window.filterMpBySearch = function(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('#marketplacePage .mp-card');
    let count = 0;
    cards.forEach(card => {
        const title = (card.querySelector('.mp-card-title') ? card.querySelector('.mp-card-title').innerText : '').toLowerCase();
        const cat = (card.querySelector('.mp-card-category') ? card.querySelector('.mp-card-category').innerText : '').toLowerCase();
        const matches = !q || title.includes(q) || cat.includes(q);
        card.style.display = matches ? '' : 'none';
        if (matches) count++;
    });
    const badge = document.getElementById('mpCountBadge');
    if (badge) badge.innerText = count;
    // Reset active pill to All
    document.querySelectorAll('.mp-cat-pill').forEach(p => p.classList.remove('active'));
    const allPill = document.querySelector('.mp-cat-pill');
    if (allPill && !q) allPill.classList.add('active');
};



// =============================================
// CREATE LISTING WIZARD LOGIC
// =============================================

let clCurrentStep = 1;
let clData = { category: '', title: '', desc: '', location: '', status: 'Active', revenue: '', traffic: '', age: '', count: '', price: '', negotiable: 'Yes', whatsapp: '' };

window.showCreateListing = function() {
    // Show custom Coming Soon popup
    const popup = document.getElementById('comingSoonPopup');
    const card = document.getElementById('comingSoonCard');
    if (popup && card) {
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 10);
    }
    return;
    
    // Original Code kept for future use:
    clCurrentStep = 1;
    clData = { category: '', title: '', desc: '', location: '', status: 'Active', revenue: '', traffic: '', age: '', count: '', price: '', negotiable: 'Yes', whatsapp: '' };
    // Reset all panels
    for (let i = 1; i <= 5; i++) {
        const panel = document.getElementById('clPanel' + i);
        if (panel) panel.style.display = i === 1 ? 'block' : 'none';
        const step = document.getElementById('clStep' + i);
        if (step) { step.classList.remove('active','done'); if (i === 1) step.classList.add('active'); }
    }
    // Reset category selection
    document.querySelectorAll('.cl-cat-card').forEach(c => c.classList.remove('selected'));
    // Reset prev btn
    const prevBtn = document.getElementById('clPrevBtn');
    if (prevBtn) prevBtn.style.visibility = 'hidden';
    const nextBtn = document.getElementById('clNextBtn');
    if (nextBtn) nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
    showPage('createListing');
    window.scrollTo(0, 0);
};

window.selectCategory = function(el, category) {
    document.querySelectorAll('.cl-cat-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    clData.category = category;
};

window.goToStep = function(step) {
    if (step > clCurrentStep) return; // Can only go back
    clCurrentStep = step;
    updateWizardUI();
};

window.clNextStep = function() {
    // Validate current step
    if (clCurrentStep === 1 && !clData.category) {
        alert('Please select a category first!');
        return;
    }
    if (clCurrentStep === 2) {
        clData.title = document.getElementById('clTitle').value;
        clData.desc = document.getElementById('clDesc').value;
        clData.location = document.getElementById('clLocation').value;
        clData.status = document.getElementById('clStatus').value;
        if (!clData.title) { alert('Please enter a listing title!'); return; }
    }
    if (clCurrentStep === 4) {
        clData.revenue = document.getElementById('clRevenue').value;
        clData.traffic = document.getElementById('clTraffic').value;
        clData.age = document.getElementById('clAge').value;
        clData.count = document.getElementById('clCount').value;
    }
    if (clCurrentStep === 5) {
        clData.price = document.getElementById('clPrice').value;
        clData.negotiable = document.getElementById('clNegotiable').value;
        clData.whatsapp = document.getElementById('clWhatsApp').value;
        if (!clData.price) { alert('Please enter a price!'); return; }
        // Submit
        submitListing();
        return;
    }
    
    // Mark current as done, advance
    const doneStep = document.getElementById('clStep' + clCurrentStep);
    if (doneStep) { doneStep.classList.remove('active'); doneStep.classList.add('done'); doneStep.querySelector('.cl-step-circle').innerHTML = '<i class="fa-solid fa-check"></i>'; }
    
    clCurrentStep++;
    
    // If going to step 5, render summary
    if (clCurrentStep === 5) renderSummary();
    
    updateWizardUI();
};

window.clPrevStep = function() {
    if (clCurrentStep <= 1) return;
    const curStep = document.getElementById('clStep' + clCurrentStep);
    if (curStep) { curStep.classList.remove('active','done'); curStep.querySelector('.cl-step-circle').innerHTML = clCurrentStep; }
    clCurrentStep--;
    updateWizardUI();
};

function updateWizardUI() {
    for (let i = 1; i <= 5; i++) {
        const panel = document.getElementById('clPanel' + i);
        if (panel) panel.style.display = i === clCurrentStep ? 'block' : 'none';
    }
    const curStep = document.getElementById('clStep' + clCurrentStep);
    if (curStep) { curStep.classList.remove('done'); curStep.classList.add('active'); }
    
    const prevBtn = document.getElementById('clPrevBtn');
    if (prevBtn) prevBtn.style.visibility = clCurrentStep > 1 ? 'visible' : 'hidden';
    
    const nextBtn = document.getElementById('clNextBtn');
    if (nextBtn) {
        if (clCurrentStep === 5) {
            nextBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Listing';
            nextBtn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        } else {
            nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
            nextBtn.style.background = 'linear-gradient(135deg,#2563eb,#1d4ed8)';
        }
    }
    window.scrollTo(0, 0);
}

function renderSummary() {
    clData.title = document.getElementById('clTitle') ? document.getElementById('clTitle').value : clData.title;
    clData.location = document.getElementById('clLocation') ? document.getElementById('clLocation').value : clData.location;
    clData.revenue = document.getElementById('clRevenue') ? document.getElementById('clRevenue').value : clData.revenue;
    clData.traffic = document.getElementById('clTraffic') ? document.getElementById('clTraffic').value : clData.traffic;
    
    const summaryEl = document.getElementById('clSummary');
    if (!summaryEl) return;
    const rows = [
        { label: 'Category', value: clData.category || '-' },
        { label: 'Title', value: clData.title || '-' },
        { label: 'Location', value: clData.location || '-' },
        { label: 'Status', value: clData.status || '-' },
        { label: 'Monthly Revenue', value: clData.revenue ? '$' + clData.revenue : '-' },
        { label: 'Monthly Traffic', value: clData.traffic || '-' },
        { label: 'Account Age', value: clData.age ? clData.age + ' months' : '-' },
    ];
    summaryEl.innerHTML = rows.map(r => `<div class="cl-summary-row"><span>${r.label}</span><span>${r.value}</span></div>`).join('');
}

window.previewImages = function(input) {
    const preview = document.getElementById('clImagePreview');
    if (!preview) return;
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement('div');
            div.style.cssText = 'position:relative; border-radius:10px; overflow:hidden; aspect-ratio:1;';
            div.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
                <button onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:0.8rem;">�</button>`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
};

function submitListing() {
    // WhatsApp message with all listing data
    const msg = `??? *New Listing Submission*\n\n?? *Category:* ${clData.category}\n?? *Title:* ${clData.title}\n?? *Location:* ${clData.location}\n? *Status:* ${clData.status}\n?? *Price:* $${clData.price} (${clData.negotiable})\n?? *Revenue/Mo:* $${clData.revenue || '0'}\n?? *Traffic/Mo:* ${clData.traffic || 'N/A'}\n?? *Age:* ${clData.age || 'N/A'} months\n\n?? *Contact:* ${clData.whatsapp || 'Not provided'}\n\n?? *Description:* ${clData.desc}`;
    const waUrl = 'https://wa.me/923281270900?text=' + encodeURIComponent(msg);
    
    // Show success message
    const page = document.getElementById('createListingPage');
    if (page) {
        page.querySelector('.pd-container').innerHTML = `
            <div style="text-align:center; padding:80px 20px; background:white; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="width:80px; height:80px; background:#dcfce7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 25px; font-size:2.5rem;">?</div>
                <h2 style="font-size:2rem; font-weight:800; color:#0f172a; margin-bottom:10px;">Listing Submitted!</h2>
                <p style="color:#64748b; font-size:1.1rem; margin-bottom:30px;">Your listing has been submitted. Contact us on WhatsApp to complete the review process.</p>
                <a href="${waUrl}" target="_blank" style="display:inline-flex; align-items:center; gap:10px; background:linear-gradient(135deg,#25d366,#128c7e); color:white; padding:16px 32px; border-radius:12px; font-weight:700; font-size:1.1rem; text-decoration:none; margin-bottom:15px;">
                    <i class="fa-brands fa-whatsapp"></i> Send via WhatsApp
                </a>
                <br>
                <button onclick="showPage('dashboard')" style="background:#f1f5f9; border:none; color:#0f172a; padding:12px 25px; border-radius:10px; font-weight:600; cursor:pointer; margin-top:10px;">Back to Dashboard</button>
            </div>
        `;
    }
}



window.closeComingSoon = function() {
    const popup = document.getElementById('comingSoonPopup');
    const card = document.getElementById('comingSoonCard');
    if (popup && card) {
        popup.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
};


// =============================================
// CREATE BLOG LOGIC
// =============================================

window.showCreateBlog = function() {
    showPage('createBlog');
    window.scrollTo(0, 0);
    
    // Show Guidelines Popup
    const popup = document.getElementById('guidelinesPopup');
    const card = document.getElementById('guidelinesCard');
    if (popup && card) {
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 10);
    }
};

window.closeGuidelines = function() {
    const popup = document.getElementById('guidelinesPopup');
    const card = document.getElementById('guidelinesCard');
    if (popup && card) {
        popup.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
};

window.submitBlog = function() {
    const title = document.getElementById('cbTitle').value;
    const category = document.getElementById('cbCategory').value;
    const content = document.getElementById('cbContent').innerHTML;
    
    if (!title || title.trim() === '') { 
        alert('Please enter a blog title.'); 
        return; 
    }
    
    const imgEl = document.getElementById('cbImagePreview');
    const imgSrc = (imgEl && imgEl.src && imgEl.src.length > 50) ? imgEl.src : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop';
    
    // Create new blog object
    const newBlog = {
        id: allBlogs.length + 1,
        title: title,
        excerpt: document.getElementById('cbMetaDesc').value || title,
        desc: document.getElementById('cbMetaDesc').value || title,
        category: category,
        date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
        readTime: "5 min read",
        status: 'Published',
        author: { name: "Aftab Malik", avatar: "A" },
        image: imgSrc,
        rating: 5.0,
        content: content
    };
    
    // 1. Add to public blogs page
    allBlogs.unshift(newBlog);
    renderBlogs(allBlogs);
    
    // 2. Add to My Blogs dashboard table
    if (window.addBlogToDashboard) window.addBlogToDashboard(newBlog);
    
    // Reset form
    document.getElementById('cbTitle').value = '';
    document.getElementById('cbSlug').value = '';
    document.getElementById('cbContent').innerHTML = '';
    document.getElementById('cbMetaTitle').value = '';
    document.getElementById('cbMetaDesc').value = '';
    document.getElementById('cbKeywords').value = '';
    if(window.removeBlogImage) window.removeBlogImage(new Event('click'));
    
    // Show a nice success message and go to dashboard My Blogs
    // The blog is saved in allBlogs so it will always show on public Blogs page
    showPage('dashboard');
    setTimeout(function() { switchDashView('blogs'); }, 150);
};




window.previewBlogImage = function(input) {
    const previewContainer = document.getElementById('cbImagePreviewContainer');
    const dropzone = document.getElementById('cbImageDropzone');
    const previewImg = document.getElementById('cbImagePreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
            dropzone.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
};

window.removeBlogImage = function(e) {
    e.stopPropagation();
    const input = document.getElementById('cbImageInput');
    const previewContainer = document.getElementById('cbImagePreviewContainer');
    const dropzone = document.getElementById('cbImageDropzone');
    const previewImg = document.getElementById('cbImagePreview');
    
    input.value = '';
    previewImg.src = '';
    previewContainer.style.display = 'none';
    dropzone.style.display = 'block';
};


window.insertBlogLink = function() {
    const url = prompt("Enter the link URL:");
    if(url) document.execCommand('createLink', false, url);
};

window.insertBlogImage = function() {
    const url = prompt("Enter the image URL:");
    if(url) {
        // Simple insert image
        document.execCommand('insertImage', false, url);
    }
};

window.insertBlogVideo = function() {
    const url = prompt("Enter YouTube embed URL (e.g., https://www.youtube.com/embed/...)");
    if(url) {
        const iframe = `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe><br>`;
        document.execCommand('insertHTML', false, iframe);
    }
};

window.insertBlogCode = function() {
    const code = prompt("Enter your code snippet:");
    if(code) {
        const pre = `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre><br>`;
        document.execCommand('insertHTML', false, pre);
    }
};


// =============================================
// MY BLOGS DASHBOARD TABLE LOGIC
// =============================================

window.dashBlogsList = [];
let dashBlogsList = window.dashBlogsList;

window.addBlogToDashboard = function(blog) {
    window.dashBlogsList.unshift(blog);
    dashBlogsList = window.dashBlogsList;
    renderDashBlogsTable(window.dashBlogsList);
};

window.renderDashBlogsTable = function(blogs) {
    const tbody = document.getElementById('dashBlogsTableBody');
    const empty = document.getElementById('dashBlogsEmpty');
    if (!tbody) return;

    if (blogs.length === 0) {
        tbody.innerHTML = `<div id="dashBlogsEmpty" style="padding: 60px 20px; text-align: center;">
            <div style="width:70px;height:70px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:2rem;color:#94a3b8;"><i class="fa-regular fa-file-lines"></i></div>
            <h4 style="font-size:1.1rem;color:#0f172a;margin:0 0 8px;">No blogs yet</h4>
            <p style="color:#94a3b8;font-size:0.9rem;margin:0 0 20px;">Get started by writing your first blog post</p>
            <button onclick="showCreateBlog()" style="background:linear-gradient(135deg,#f97316,#ef4444);color:white;border:none;padding:12px 24px;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.95rem;">Write Your First Blog</button>
        </div>`;
        return;
    }

    let rowsHtml = '';
    blogs.forEach(function(blog, idx) {
        const statusColor = blog.status === 'Published' ? '#10b981' : (blog.status === 'Rejected' ? '#ef4444' : '#f59e0b');
        const statusBg = blog.status === 'Published' ? '#dcfce7' : (blog.status === 'Rejected' ? '#fee2e2' : '#fef3c7');
        const thumbUrl = (blog.image && blog.image.length > 10) ? blog.image : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=80&h=80&fit=crop';
        const shortTitle = blog.title.length > 30 ? blog.title.substring(0, 30) + '...' : blog.title;
        const shortDesc = blog.desc && blog.desc.length > 25 ? blog.desc.substring(0, 25) + '...' : (blog.desc || '');
        const authorLetter = blog.author ? blog.author.name.charAt(0) : 'A';
        const authorName = blog.author ? blog.author.name : 'Aftab Malik';

        rowsHtml += `
        <div class="dash-blog-row" data-idx="${idx}" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.5fr;padding:16px 24px;border-bottom:1px solid #f1f5f9;align-items:center;transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            
            <!-- Blog Info -->
            <div style="display:flex;align-items:center;gap:14px;">
                <img src="${thumbUrl}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=80&h=80&fit=crop'">
                <div>
                    <div style="font-weight:700;color:#0f172a;font-size:0.95rem;margin-bottom:4px;">${shortTitle}</div>
                    <div style="color:#94a3b8;font-size:0.8rem;">${shortDesc}</div>
                    <div style="color:#94a3b8;font-size:0.75rem;margin-top:3px;"><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>Created ${blog.date}</div>
                </div>
            </div>

            <!-- Status -->
            <div>
                <span style="background:${statusBg};color:${statusColor};padding:5px 12px;border-radius:20px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-circle-check" style="font-size:0.7rem;"></i>${blog.status}
                </span>
            </div>

            <!-- Author -->
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">${authorLetter}</div>
                <span style="color:#334155;font-size:0.88rem;font-weight:500;">${authorName}</span>
            </div>

            <!-- Date -->
            <div style="display:flex;align-items:center;gap:6px;color:#64748b;font-size:0.88rem;">
                <i class="fa-regular fa-calendar" style="color:#94a3b8;"></i>${blog.date}
            </div>

            <!-- Actions -->
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
                <select onchange="changeBlogStatus(${idx}, this.value)" style="width:100%;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.82rem;outline:none;cursor:pointer;font-family:inherit;color:#334155;">
                    <option ${blog.status==='Published'?'selected':''}>Set as Published</option>
                    <option ${blog.status==='Draft'?'selected':''}>Draft</option>
                    <option ${blog.status==='Pending'?'selected':''}>Pending</option>
                </select>
                <div style="display:flex;gap:8px;">
                    <button onclick="editDashBlog(${idx})" style="background:white;border:1px solid #e2e8f0;color:#334155;padding:6px 14px;border-radius:6px;font-size:0.82rem;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button onclick="deleteDashBlog(${idx})" style="background:white;border:1px solid #fee2e2;color:#ef4444;padding:6px 14px;border-radius:6px;font-size:0.82rem;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        </div>`;
    });

    tbody.innerHTML = rowsHtml;
};

window.filterDashBlogs = function(query) {
    const search = (query || document.getElementById('dashBlogSearch').value || '').toLowerCase();
    const status = document.getElementById('dashBlogStatus').value;

    const filtered = dashBlogsList.filter(function(b) {
        const matchSearch = !search || b.title.toLowerCase().includes(search);
        const matchStatus = !status || b.status === status;
        return matchSearch && matchStatus;
    });

    renderDashBlogsTable(filtered);
};

window.changeBlogStatus = function(idx, value) {
    const statusMap = {'Set as Published': 'Published', 'Draft': 'Draft', 'Pending': 'Pending'};
    if(dashBlogsList[idx]) {
        dashBlogsList[idx].status = statusMap[value] || value;
        renderDashBlogsTable(dashBlogsList);
    }
};

window.deleteDashBlog = function(idx) {
    if(confirm('Are you sure you want to delete this blog?')) {
        dashBlogsList.splice(idx, 1);
        renderDashBlogsTable(dashBlogsList);
    }
};

window.editDashBlog = function(idx) {
    const blog = dashBlogsList[idx];
    if(!blog) return;
    showCreateBlog();
    setTimeout(function() {
        const titleEl = document.getElementById('cbTitle');
        const contentEl = document.getElementById('cbContent');
        const catEl = document.getElementById('cbCategory');
        if(titleEl) titleEl.value = blog.title;
        if(contentEl) contentEl.innerHTML = blog.content || '';
        if(catEl) catEl.value = blog.category;
        dashBlogsList.splice(idx, 1); // remove old one, will be re-added on submit
    }, 100);
};

// --- SERVICES LOGIC ---
const servicesData = {
    web: {
        title: 'Premium Website Development',
        icon: 'fa-laptop-code',
        shortDesc: 'Ultra-fast, conversion-optimized, and highly secure websites built from scratch to dominate your industry and multiply your revenue.',
        desc: 'Your website is the digital face of your business. We don\'t just build sites; we architect digital experiences engineered for maximum conversion. Whether you need a high-end corporate portal, a lightning-fast e-commerce powerhouse, or a complex dynamic web application, our expert developers use cutting-edge frameworks to deliver pixel-perfect, scalable, and SEO-dominant websites that turn visitors into high-paying clients. Perfection level: 8+ years of expertise, 250+ websites delivered, 99+ Google PageSpeed scores, and a 100% on-time delivery track record. Tech stack: React, Next.js, TanStack, Node.js, TypeScript, Tailwind, WordPress, Shopify, and Webflow. Deliverables: full source code, CI/CD pipeline, hosting setup, 30-day free bug support, and complete documentation.',
        features: [
            { icon: 'fa-mobile-screen', title: 'Flawless Omnidevice Responsiveness', desc: 'Every pixel is meticulously crafted to ensure a breathtaking user experience across 4K monitors, tablets, and every mobile device on the market.' },
            { icon: 'fa-bolt', title: 'Ultra-Fast Performance Architecture', desc: 'We employ advanced caching, CDN integrations, and code minification to achieve near-instant load times and 99+ Google PageSpeed scores, drastically reducing bounce rates.' },
            { icon: 'fa-magnifying-glass', title: 'Deep Technical SEO Integration', desc: 'Built from day one with advanced schema markup, semantic HTML5, optimized core web vitals, and perfect URL structures to guarantee top-tier search engine rankings.' },
            { icon: 'fa-palette', title: 'Bespoke UI/UX Design', desc: 'No cheap templates. You get a 100% custom, psychology-driven user interface designed specifically to establish extreme brand authority and trust.' },
            { icon: 'fa-shield-halved', title: 'Bank-Grade Security Protocols', desc: 'Fortified against DDoS attacks, SQL injections, and XSS. We implement robust SSL, firewall rules, and regular vulnerability patching to keep your data impenetrable.' },
            { icon: 'fa-database', title: 'Seamless 3rd-Party Integrations', desc: 'We flawlessly connect your site to CRMs (Salesforce, HubSpot), payment gateways (Stripe, PayPal), marketing tools, and custom APIs to automate your business.' }
        ],
        process: [
            { title: 'Discovery & Strategy', desc: 'Deep dive into your business model, competitors, and target audience to architect a foolproof digital strategy.' },
            { title: 'Wireframing & UI/UX', desc: 'Designing high-fidelity prototypes so you can experience the look and feel before a single line of code is written.' },
            { title: 'Agile Development', desc: 'Writing clean, scalable code using the latest tech stacks with regular milestone updates and rigorous QA testing.' },
            { title: 'Launch & Scaling', desc: 'Deploying your site to elite cloud servers, monitoring performance, and providing continuous maintenance and growth support.' }
        ]
    },
    software: {
        title: 'Custom Software & SaaS Development',
        icon: 'fa-code',
        shortDesc: 'Enterprise-grade software, SaaS platforms, and internal tools custom-engineered to automate operations and scale your enterprise.',
        desc: 'Stop relying on clunky, off-the-shelf software that doesn\'t fit your workflow. We engineer bespoke, cloud-native software solutions—from multi-tenant SaaS MVPs to complex ERPs and business automation tools. Our elite engineering team writes exceptionally clean, maintainable, and highly secure code designed to scale effortlessly from your first 100 users to millions of daily active users. Perfection level: senior engineers with 10+ years of experience, 60+ SaaS platforms shipped, 99.9% uptime SLA, and GDPR/HIPAA/SOC2 compliant delivery. Tech stack: Node.js, NestJS, Python/Django, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS/GCP, Stripe. Deliverables: complete source code, database schema, admin dashboard, API documentation, deployment pipeline, and 60-day post-launch support.',
        features: [
            { icon: 'fa-server', title: 'Cloud-Native Scalable Architecture', desc: 'We utilize AWS, Google Cloud, and microservices architecture to ensure your software can handle massive traffic spikes without a single hiccup.' },
            { icon: 'fa-shield-halved', title: 'Enterprise-Level Data Security', desc: 'Strict compliance with GDPR/HIPAA standards, end-to-end data encryption, JWT authentication, and rigorous penetration testing to protect your assets.' },
            { icon: 'fa-gears', title: 'Complete Business Automation', desc: 'We eliminate human error and slash operational costs by automating your most complex workflows, inventory management, and reporting systems.' },
            { icon: 'fa-chart-pie', title: 'Real-Time Analytics Dashboards', desc: 'Custom-built administrative panels with live charts, custom data exports, and deep analytics to give you total control over your business metrics.' },
            { icon: 'fa-plug', title: 'Robust API Development', desc: 'We build secure, blazing-fast RESTful and GraphQL APIs to allow your software to communicate flawlessly with external platforms and mobile apps.' },
            { icon: 'fa-code-branch', title: 'Future-Proof Clean Code', desc: 'Strict adherence to DRY/SOLID principles, comprehensive unit testing, and Git version control ensures future updates are fast, easy, and extremely cost-effective.' }
        ],
        process: [
            { title: 'Requirements Gathering', desc: 'We map out every single edge case, user story, and database relationship required for your software.' },
            { title: 'System Architecture', desc: 'Planning the tech stack, database schema, server infrastructure, and security protocols.' },
            { title: 'Sprints & Development', desc: 'Iterative development sprints where you see your software coming to life piece by piece, tested rigorously.' },
            { title: 'Deployment & CI/CD', desc: 'Setting up continuous integration pipelines for zero-downtime updates and seamless future scaling.' }
        ]
    },
    ai: {
        title: 'AI Automation & Integration',
        icon: 'fa-robot',
        shortDesc: 'Deploy cutting-edge Artificial Intelligence to eliminate manual work, predict trends, and give your business an unfair advantage.',
        desc: 'The AI revolution is here, and businesses that don\'t adapt will be left behind. We implement state-of-the-art AI solutions—from intelligent customer support agents and predictive data models to automated content generation workflows. We fine-tune Large Language Models (LLMs) and deploy Robotic Process Automation (RPA) to slash your overhead costs by up to 80% while multiplying your output. Perfection level: certified AI engineers, 120+ automation workflows deployed, average 70% reduction in manual work, and 24/7 monitored production agents. Tech stack: OpenAI GPT-4o, Claude 3.5, Gemini, LangChain, LlamaIndex, Pinecone, Zapier, Make, n8n, Python. Deliverables: fully trained AI agents, prompt library, integration with your CRM/ERP, monitoring dashboard, and staff training session.',
        features: [
            { icon: 'fa-comments', title: 'Autonomous AI Support Agents', desc: 'Deploy hyper-intelligent chatbots that understand context, resolve complex customer issues 24/7, and seamlessly escalate sales leads to human agents.' },
            { icon: 'fa-brain', title: 'Predictive Machine Learning', desc: 'Leverage your historical data to forecast sales, predict customer churn, and optimize pricing dynamically using advanced regression models.' },
            { icon: 'fa-wand-magic-sparkles', title: 'End-to-End Workflow Automation', desc: 'Connect your entire software stack using Zapier/Make and custom AI scripts to automate data entry, email drafting, and daily reporting.' },
            { icon: 'fa-magnifying-glass-chart', title: 'Deep AI Data Extraction', desc: 'Automatically extract, classify, and analyze crucial data from unstructured PDFs, invoices, and emails with near 100% accuracy.' },
            { icon: 'fa-file-lines', title: 'Scale Content with AI', desc: 'Programmatic SEO and marketing pipelines that generate thousands of highly-optimized product descriptions and blog posts tailored to your brand voice.' },
            { icon: 'fa-robot', title: 'Custom LLM Fine-Tuning', desc: 'We train private, secure AI models strictly on your company\'s internal data so it operates exactly according to your unique business rules.' }
        ],
        process: [
            { title: 'AI Opportunity Audit', desc: 'We analyze your workflows to identify massive bottlenecks that can be instantly solved with AI.' },
            { title: 'Model Selection', desc: 'Choosing the perfect AI models (OpenAI, Claude, custom open-source) balancing cost, speed, and privacy.' },
            { title: 'Integration & Training', desc: 'Building the data pipelines, fine-tuning the models, and integrating them into your existing software.' },
            { title: 'Optimization', desc: 'Monitoring AI performance, adjusting prompts, and ensuring zero hallucination rates in live environments.' }
        ]
    },
    seo: {
        title: 'Dominant SEO Services',
        icon: 'fa-magnifying-glass-chart',
        shortDesc: 'Take over Google\'s Page 1. Outrank your biggest competitors and capture high-intent organic traffic that runs 24/7 on autopilot.',
        desc: 'Traffic is the lifeblood of your business, and organic traffic is the most profitable kind. We don\'t just chase vanity metrics; we engineer aggressive, data-backed SEO campaigns designed to monopolize search results for your most lucrative keywords. Through a ruthless combination of deep technical SEO, authoritative link building, and world-class content creation, we turn your website into an unstoppable lead-generation machine. Perfection level: 7+ years of SEO expertise, 180+ ranked domains, average 4x organic traffic growth in 6 months, and 100+ Page-1 keywords per campaign. Tools: Ahrefs, SEMrush, Screaming Frog, Google Search Console, Surfer SEO, Clearscope. Deliverables: full technical audit, monthly keyword report, 20+ high-DR backlinks/month, pillar content, and transparent rank-tracking dashboard.',
        features: [
            { icon: 'fa-chart-line', title: 'High-Intent Keyword Mastery', desc: 'We uncover hidden, extremely profitable "buyer-intent" keywords that your competitors are completely ignoring.' },
            { icon: 'fa-file-lines', title: 'Surgical On-Page Optimization', desc: 'We perfectly optimize every H1, meta tag, URL structure, and keyword density ratio to align exactly with Google\'s latest algorithm updates.' },
            { icon: 'fa-link', title: 'Authoritative Backlink Acquisition', desc: 'We secure high DR (Domain Rating), contextual backlinks from trusted industry publications to skyrocket your domain authority.' },
            { icon: 'fa-gauge-high', title: 'Flawless Technical SEO', desc: 'We eliminate crawl errors, fix duplicate content, implement advanced schema markup, and optimize server response times to perfection.' },
            { icon: 'fa-pen-nib', title: 'Pillar Content Creation', desc: 'Our expert copywriters craft massive, authoritative guides and articles that act as traffic magnets and natural backlink attractors.' },
            { icon: 'fa-chart-bar', title: 'Crystal Clear ROI Reporting', desc: 'No fluff. We provide detailed monthly breakdowns of exactly how your rankings are directly contributing to revenue and lead generation.' }
        ],
        process: [
            { title: 'Deep Site Audit', desc: 'A merciless technical breakdown of why you aren\'t ranking and exactly what needs to be fixed.' },
            { title: 'Competitor Reverse-Engineering', desc: 'We dissect your top 3 competitors to steal their traffic strategies and build a plan to outrank them.' },
            { title: 'Aggressive Execution', desc: 'Fixing technical issues instantly, publishing optimized content, and beginning the backlink outreach.' },
            { title: 'Scaling & Domination', desc: 'Tracking rank movements daily and expanding the campaign to capture even more industry keywords.' }
        ]
    },
    google_ads: {
        title: 'Google Ads Management',
        icon: 'fa-google',
        iconPrefix: 'fa-brands',
        shortDesc: 'Skip the line. Force your business to the absolute top of Google instantly and capture buyers the second they search for you.',
        desc: 'Stop burning money on poorly optimized campaigns. We run elite, high-conversion Google Ads campaigns that squeeze maximum ROI out of every single cent. From aggressive Search Network campaigns targeting high-ticket buyers, to visually stunning Display Network retargeting, to highly profitable Google Shopping feeds—we manage millions in ad spend to scale businesses aggressively and profitably. Perfection level: Google Ads certified specialists, $5M+ ad spend managed, average 6.2x ROAS across clients, and campaigns live in 200+ industries. Tools: Google Ads Editor, GA4, Google Tag Manager, Looker Studio, Optmyzr, Triple Whale. Deliverables: full account audit, campaign structure blueprint, conversion tracking setup, weekly optimization reports, and creative ad copy library.',
        features: [
            { icon: 'fa-bullseye', title: 'Hyper-Targeted Search Campaigns', desc: 'We bid exclusively on absolute highest-intent keywords, using exact and phrase match types to filter out tire-kickers and focus purely on buyers.' },
            { icon: 'fa-pen-nib', title: 'Psychological Ad Copywriting', desc: 'We test dozens of ad variants using psychological triggers, FOMO, and irresistible offers to guarantee the highest Click-Through-Rates (CTR) in your niche.' },
            { icon: 'fa-chart-pie', title: 'Precision Conversion Tracking', desc: 'Flawless Google Tag Manager setups. We track every phone call, form submission, and checkout so we know the exact cost to acquire a customer.' },
            { icon: 'fa-money-bill-trend-up', title: 'Ruthless Budget Optimization', desc: 'Daily negative keyword additions, bid adjustments, and device/location targeting to ensure you never waste a single dollar of ad spend.' },
            { icon: 'fa-users-viewfinder', title: 'Dynamic Retargeting', desc: 'We follow your bounced visitors across the internet with highly specific ads based on the exact product or service they viewed on your site.' },
            { icon: 'fa-shop', title: 'Performance Max & Shopping', desc: 'For e-commerce, we optimize your merchant feeds and leverage AI-driven Performance Max campaigns to dominate the shopping carousel.' }
        ],
        process: [
            { title: 'Market & Offer Analysis', desc: 'Reviewing your margins and creating an irresistible offer to feature in the ads.' },
            { title: 'Campaign Architecture', desc: 'Structuring ad groups logically, writing copy, and setting up flawless tracking tags.' },
            { title: 'Launch & Data Gathering', desc: 'Going live and collecting initial data to see exactly which keywords are generating leads.' },
            { title: 'Ruthless Optimization', desc: 'Killing underperforming ads, scaling winners, and constantly pushing down the Cost Per Acquisition (CPA).' }
        ]
    },
    fb_ads: {
        title: 'Facebook & Instagram Ads',
        icon: 'fa-facebook',
        iconPrefix: 'fa-brands',
        shortDesc: 'Harness the immense power of Meta\'s AI to find your perfect customers and force exponential growth through social advertising.',
        desc: 'We don\'t just "boost posts." We engineer sophisticated, multi-funnel Facebook and Instagram advertising ecosystems. By combining scroll-stopping creative assets with advanced machine-learning audience targeting, we turn cold social media traffic into hyper-loyal, high-paying customers. Whether you are generating B2B leads or scaling a D2C e-commerce brand to 7 figures, our strategies deliver unmatched Return on Ad Spend (ROAS). Perfection level: Meta Blueprint certified media buyers, $8M+ ad spend managed, 40+ 7-figure e-commerce brands scaled, and average 5.8x ROAS. Tools: Meta Ads Manager, Business Suite, Facebook Pixel + CAPI, TripleWhale, Hyros, Motion. Deliverables: full pixel + CAPI setup, weekly creative production (10–20 assets), audience research doc, funnel blueprint, and scaling roadmap.',
        features: [
            { icon: 'fa-users-viewfinder', title: 'Advanced Audience Engineering', desc: 'We utilize deep demographic slicing, behavioral triggers, and Meta\'s powerful AI to put your offer directly in front of people primed to buy.' },
            { icon: 'fa-image', title: 'Scroll-Stopping Creative Assets', desc: 'Our in-house design team produces highly engaging UGC (User Generated Content), dynamic videos, and carousel ads that practically force users to click.' },
            { icon: 'fa-retweet', title: 'Omnipresent Retargeting Funnels', desc: 'Complex sequential retargeting that nurtures a cold prospect into a hot buyer over 7, 14, and 30-day windows based on their exact interactions.' },
            { icon: 'fa-users', title: 'Lookalike Audience Scaling', desc: 'We feed your best customer data (LTV, past purchases) into the pixel to find millions of brand-new people who share the exact same buying habits.' },
            { icon: 'fa-code', title: 'Flawless Pixel & CAPI Setup', desc: 'Advanced Conversions API (CAPI) server-side tracking to ensure you don\'t lose critical data to iOS 14+ updates and ad blockers.' },
            { icon: 'fa-chart-line', title: 'Aggressive Vertical Scaling', desc: 'Once we find a winning ad, we implement advanced scaling tactics to 10x your budget quickly without crashing your ROAS.' }
        ],
        process: [
            { title: 'Pixel & CAPI Integration', desc: 'Ensuring your tracking infrastructure is 100% accurate before spending a dime.' },
            { title: 'Creative Testing Phase', desc: 'Testing 10-20 different ad angles, hooks, and visuals to find the undisputed winner.' },
            { title: 'Audience Optimization', desc: 'Shifting budget exclusively to the demographics and placements generating the cheapest purchases.' },
            { title: 'Scaling the Winners', desc: 'Increasing ad spend aggressively while maintaining profit margins to blow up your revenue.' }
        ]
    },
    social: {
        title: 'Premium Social Media Management',
        icon: 'fa-share-nodes',
        shortDesc: 'Transform your social profiles into highly engaged communities and powerful brand assets that command industry respect.',
        desc: 'In today\'s digital economy, an inactive or unprofessional social media presence instantly kills trust. We provide complete, white-glove social media management across Instagram, LinkedIn, TikTok, Facebook, and X (Twitter). We act as your dedicated brand voice, producing high-end content, building massive engaged communities, and executing viral growth strategies that position you as the undisputed authority in your niche. Perfection level: dedicated brand managers with 6+ years of experience, 90+ managed brands, 25M+ organic impressions generated, and viral content on TikTok/Reels explore pages. Tools: Adobe Creative Suite, CapCut Pro, Later, Buffer, Notion, Metricool, Canva Pro. Deliverables: 30-day content calendar, 20+ premium posts/reels per month, community management, monthly analytics report, and viral trend alerts.',
        features: [
            { icon: 'fa-calendar-days', title: 'Strategic Content Roadmaps', desc: 'We don\'t post blindly. We develop 30-day content calendars scientifically designed to educate, entertain, and convert your specific audience.' },
            { icon: 'fa-pen-nib', title: 'High-End Visual Production', desc: 'Stunning graphic design, premium video editing for Reels/TikToks, and flawless carousel formatting that instantly establishes brand authority.' },
            { icon: 'fa-comments', title: 'Aggressive Community Growth', desc: 'Proactive engagement strategies. We don\'t just wait for comments; we actively interact with industry leaders and target accounts to draw attention to your profile.' },
            { icon: 'fa-hashtag', title: 'Data-Driven Discoverability', desc: 'Deep research into trending audio, viral formats, and optimized hashtag clusters to maximize your organic reach and hit the explore page.' },
            { icon: 'fa-user-tie', title: 'Executive Brand Building', desc: 'Specialized LinkedIn ghostwriting and thought-leadership positioning for CEOs and founders to drive high-ticket B2B leads.' },
            { icon: 'fa-shield-halved', title: '24/7 Reputation Management', desc: 'Swift, professional handling of all customer inquiries, DMs, and public comments to ensure your brand reputation remains spotless.' }
        ],
        process: [
            { title: 'Brand Voice Discovery', desc: 'Mapping out exactly how your brand should sound, look, and feel online.' },
            { title: 'Asset Creation', desc: 'Designing a massive library of premium graphics, videos, and copywriting.' },
            { title: 'Publishing & Engagement', desc: 'Posting at optimal algorithmic times and actively engaging with the community.' },
            { title: 'Analytics & Iteration', desc: 'Reviewing what went viral, doubling down on winning formats, and refining the strategy.' }
        ]
    },
    graphic: {
        title: 'Elite Graphic Design & Branding',
        icon: 'fa-palette',
        shortDesc: 'World-class visual identities, marketing assets, and UI/UX designs that instantly command premium prices and absolute trust.',
        desc: 'People judge your business in milliseconds based purely on aesthetics. If your branding looks cheap, your clients will expect cheap prices. Our elite design studio crafts breathtaking, psychology-driven visual identities that elevate your business to a premium status. From timeless logo systems to high-converting pitch decks that have raised millions in venture capital, we design assets that make your competition look obsolete. Perfection level: senior designers with 9+ years of experience, 300+ brand identities delivered, decks that have raised $50M+ in funding, and award-winning work featured on Behance and Dribbble. Tools: Figma, Adobe Illustrator, Photoshop, InDesign, Blender, After Effects, Framer. Deliverables: complete logo system, brand guidelines PDF, editable source files (AI/PSD/Figma), social media templates, and print-ready collateral.',
        features: [
            { icon: 'fa-gem', title: 'Premium Logo & Identity Systems', desc: 'We don\'t do basic logos. We build comprehensive, timeless brand identities with complete usage guidelines, typography pairings, and color psychology.' },
            { icon: 'fa-desktop', title: 'High-Conversion UI/UX Design', desc: 'Stunning website and mobile app interfaces designed in Figma, focusing heavily on user psychology to maximize time-on-site and conversion rates.' },
            { icon: 'fa-layer-group', title: 'Corporate Marketing Collateral', desc: 'Ultra-premium business cards, corporate brochures, whitepapers, and exhibition banners that leave an unforgettable physical impression.' },
            { icon: 'fa-mobile-screen', title: 'Scroll-Stopping Digital Assets', desc: 'Custom illustration, 3D assets, and highly engaging social media templates designed to dominate crowded newsfeeds.' },
            { icon: 'fa-box-open', title: 'Luxury Packaging Design', desc: 'Retail and e-commerce packaging design that creates a breathtaking unboxing experience, drastically increasing customer retention and social sharing.' },
            { icon: 'fa-chart-pie', title: 'Investor Pitch Decks', desc: 'Data-heavy, beautifully visualized presentation decks scientifically structured to capture attention and secure high-ticket funding or sales.' }
        ],
        process: [
            { title: 'Strategic Briefing', desc: 'Understanding your target demographic, price point, and exact visual goals.' },
            { title: 'Concept Exploration', desc: 'Presenting distinct, high-end visual directions for your core brand identity.' },
            { title: 'Refinement & Perfection', desc: 'Polishing the chosen concept down to the finest pixel based on your feedback.' },
            { title: 'Asset Handoff', desc: 'Delivering beautifully organized, print-ready, and digital source files in every format needed.' }
        ]
    }
};

window.showService = function(serviceId) {
    const service = servicesData[serviceId];
    if (!service) return;

    // Update URL path to reflect the specific service
    if (location.pathname !== '/service/' + serviceId) {
        history.pushState(null, null, '/service/' + serviceId);
    }

    // Swap hero — Premium Website Development gets a full homepage-style hero
    const heroWrap = document.querySelector('#servicesPage .service-detail-hero');
    if (heroWrap && !heroWrap.dataset.defaultHtml) {
        heroWrap.dataset.defaultHtml = heroWrap.innerHTML;
    }

    if (serviceId === 'web' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-laptop-code"></i> PREMIUM WEBSITE DEVELOPMENT
                        </div>
                        <h1>Websites That Convert & <span class="gradient-text">Dominate Google</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Ultra-fast, conversion-optimized websites built from scratch. 250+ delivered · 99+ PageSpeed · 100% on-time launches — engineered to multiply your revenue.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want a Premium Website built for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Start My Website</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">A</div>
                                <div class="avatar a2">B</div>
                                <div class="avatar a3">C</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(250+ websites delivered)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-web-hero.jpg" alt="Premium Website Development" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(99,102,241,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">&lt;/&gt; React &amp; Next.js</span> <span class="text-xs">&nearr; Pixel-perfect</span></div>
                                <div class="float-value">99+</div>
                                <div class="float-label">Google PageSpeed</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-bolt text-orange"></i> On-time Launch <span class="text-xs">&nearr; 100%</span></div>
                                <div class="circle-progress"><span>250+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(15,23,42,0.15);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">250+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Websites Delivered</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">99+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Google PageSpeed</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">7-14</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Days to Launch</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbf24,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">100%</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">On-Time Delivery</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#f0f5ff 0%,#faf5ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(99,102,241,0.1); color:#6366f1; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY BUSINESSES CHOOSE US</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Built for Results, Not Just Looks</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">Every website we build is engineered to load fast, rank on Google, and turn visitors into paying customers.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-bolt', c:'#f59e0b', t:'Lightning Fast', d:'Sub-2s load times. 99+ PageSpeed. Your visitors never wait.'},
                        {ic:'fa-magnifying-glass-chart', c:'#6366f1', t:'SEO Ready', d:'On-page SEO, schema, sitemap & Core Web Vitals — rank from day one.'},
                        {ic:'fa-mobile-screen', c:'#22d3ee', t:'Mobile First', d:'70% traffic is mobile. Every pixel is designed for phones first.'},
                        {ic:'fa-shield-halved', c:'#4ade80', t:'Secure by Default', d:'SSL, spam protection, DDoS-hardened hosting recommendations included.'},
                        {ic:'fa-code', c:'#c084fc', t:'Clean Code', d:'React, Next.js, or WordPress — hand-coded, no bloated page builders.'},
                        {ic:'fa-headset', c:'#f472b6', t:'Real Support', d:'Direct WhatsApp with the developer. No tickets. No call centers.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(99,102,241,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- TECH STACK -->
            <section style="margin:0; padding:60px 20px; background:#0f172a;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(34,211,238,0.15); color:#22d3ee; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">MODERN TECHNOLOGY</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Powered by Industry-Leading Tools</h2>
                    <p style="color:#94a3b8;">We use the same stack Netflix, Airbnb & Shopify trust.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${['fa-react|React','fa-node-js|Node.js','fa-js|Next.js','fa-wordpress|WordPress','fa-shopify|Shopify','fa-figma|Figma','fa-html5|HTML5','fa-css3-alt|Tailwind','fa-github|GitHub','fa-aws|AWS'].map(t=>{const[i,n]=t.split('|');return `<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="fa-brands ${i}" style="font-size:1.3rem; color:#818cf8;"></i> ${n}</div>`}).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fdf2f8 0%,#fff7ed 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT LOVE</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">What Our Clients Say</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Ahmed Raza', r:'CEO, FreshMart', a:'A', c:'#6366f1', t:'Our sales jumped 3x within 2 months of launching the new site. The speed and design blew our competitors away.'},
                        {n:'Priya Sharma', r:'Founder, Bloom Studio', a:'P', c:'#f472b6', t:'Absolutely stunning work. Delivered ahead of schedule and the WhatsApp support is faster than any agency I\'ve worked with.'},
                        {n:'Michael Chen', r:'Director, TechFlow', a:'M', c:'#22d3ee', t:'99 PageSpeed score, ranking on page 1 within 6 weeks. This team knows exactly what they\'re doing. Highly recommended.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(99,102,241,0.3);">
                    <div>
                        <i class="fa-solid fa-shield-halved" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">100% Satisfaction</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Unlimited revisions until you love it.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-clock" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">On-Time or Free</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Miss the deadline? Your next month is on us.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-money-bill-transfer" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Safe Payment</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">50% upfront, 50% only after you approve.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-rotate-right" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">30-Day Free Support</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Bug fixes & tweaks — completely free post-launch.</p>
                    </div>
                </div>
            </div></section>




            <!-- ============ PROCESS / TIMELINE ============ -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:linear-gradient(180deg,#fff6f2 0%,#fff0f4 100%); border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:#fff; color:#ff5e3a; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">HOW WE WORK</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#0f172a; font-weight:800;">Our 5-Step Process</h2>
                    <p style="color:#64748b; max-width:600px; margin:0 auto;">From idea to launch in 7-14 days. Here's exactly how.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px;">
                    ${[
                        {n:'01', t:'Discovery', d:'Free 30-min call to map your goals, audience & scope.', icon:'fa-comments'},
                        {n:'02', t:'Design', d:'Figma mockups + 2 revision rounds until pixel-perfect.', icon:'fa-pen-ruler'},
                        {n:'03', t:'Development', d:'Clean code, mobile-first build with daily updates.', icon:'fa-code'},
                        {n:'04', t:'Testing', d:'QA across devices, browsers & speed benchmarks.', icon:'fa-flask'},
                        {n:'05', t:'Launch', d:'Deploy, DNS setup, and 30 days of free support.', icon:'fa-rocket'}
                    ].map(s => `
                        <div style="background:#fff; border-radius:16px; padding:24px 20px; text-align:center; box-shadow:0 4px 12px rgba(255,94,58,0.08); position:relative;">
                            <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#ff5e3a,#ff2a68); color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem;">${s.n}</div>
                            <div style="font-size:2rem; color:#ff5e3a; margin:16px 0 12px;"><i class="fa-solid ${s.icon}"></i></div>
                            <h3 style="font-size:1rem; color:#0f172a; margin:0 0 8px; font-weight:700;">${s.t}</h3>
                            <p style="font-size:0.85rem; color:#64748b; margin:0; line-height:1.5;">${s.d}</p>
                        </div>
                    `).join('')}
                </div>
            </section>




            <!-- ============ INDUSTRIES WE SERVE ============ -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#0f172a; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(255,94,58,0.15); color:#ff8a6c; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">INDUSTRIES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Industries We Serve</h2>
                    <p style="color:#94a3b8; max-width:600px; margin:0 auto;">200+ industries, one commitment: results.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'E-commerce', icon:'fa-cart-shopping'},
                        {t:'Real Estate', icon:'fa-house'},
                        {t:'Healthcare', icon:'fa-heart-pulse'},
                        {t:'Education', icon:'fa-book-open'},
                        {t:'Restaurants', icon:'fa-utensils'},
                        {t:'SaaS / Tech', icon:'fa-microchip'},
                        {t:'Fitness & Gym', icon:'fa-dumbbell'},
                        {t:'Travel & Tours', icon:'fa-plane'},
                        {t:'Legal Firms', icon:'fa-scale-balanced'},
                        {t:'Beauty & Salon', icon:'fa-scissors'},
                        {t:'Automotive', icon:'fa-car'},
                        {t:'Non-Profit', icon:'fa-hand-holding-heart'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#ff8a6c; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>






        `;
    } else if (serviceId === 'graphic' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-paintbrush"></i> ELITE GRAPHIC DESIGN & BRANDING
                        </div>
                        <h1>Luxury Brand Identities That <span class="gradient-text">Command Premium Prices</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">World-class logo design, brand identity systems, pitch decks & packaging for ambitious brands. 300+ identities delivered · decks that raised $50M+ in funding · award-winning work featured on Behance & Dribbble · senior designers with 9+ years experience.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want elite graphic design & branding for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Get Free Brand Consultation</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">A</div>
                                <div class="avatar a2">L</div>
                                <div class="avatar a3">K</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(300+ brand identities · $50M+ raised)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-graphic-hero.jpg" alt="Elite Graphic Design & Branding — Logo, Identity, Pitch Decks, Packaging" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(217,119,6,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">Logo · Identity · Guidelines</span> <span class="text-xs">&nearr; award-winning</span></div>
                                <div class="float-value">300+</div>
                                <div class="float-label">Brand Identities Delivered</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-sack-dollar text-orange"></i> Decks <span class="text-xs">&nearr; funded</span></div>
                                <div class="circle-progress"><span>$50M+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#0f172a,#78350f); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(120,53,15,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbf24,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">300+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Brand Identities Delivered</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fde68a,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">$50M+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Raised With Our Decks</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fb923c,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">9+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Yrs Senior Design Experience</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Unlimited</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Revisions Until Perfect</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#fffbeb 0%,#f8fafc 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(217,119,6,0.1); color:#b45309; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY OUR DESIGN WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Design That Elevates You Above The Competition</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">We craft psychology-driven, luxury visual identities that make your business look premium and worth more.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-crown', c:'#b45309', t:'Luxury Logo Systems', d:'Timeless primary, secondary, submark & responsive logo variations built for real-world applications.'},
                        {ic:'fa-book', c:'#8b5cf6', t:'Full Brand Guidelines PDF', d:'Colors, typography, spacing, imagery, tone-of-voice — a complete rulebook so your brand stays consistent forever.'},
                        {ic:'fa-file-powerpoint', c:'#ec4899', t:'Investor & Pitch Decks', d:'High-converting decks (Figma / PPT / Keynote) that have raised over $50M in venture capital & client contracts.'},
                        {ic:'fa-box-open', c:'#10b981', t:'Luxury Packaging Design', d:'Retail & e-commerce packaging that creates a breathtaking unboxing moment worth sharing on social.'},
                        {ic:'fa-mobile-screen', c:'#4285f4', t:'Social Media Templates', d:'On-brand Instagram, LinkedIn & story templates so your team can post consistently in your visual language.'},
                        {ic:'fa-file-image', c:'#22d3ee', t:'Editable Source Files', d:'You get Figma, AI, PSD & InDesign files — full ownership, no lock-in, ready for print or web at any time.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(217,119,6,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- DESIGN STACK -->
            <section style="margin:0; padding:60px 20px; background:#0f172a;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(251,191,36,0.15); color:#fde68a; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">PRO DESIGN STACK</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Industry-Standard Tools. Award-Winning Output.</h2>
                    <p style="color:#fde68a;">Figma, Adobe Creative Suite, Blender, After Effects, Framer & more.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-figma',n:'Figma',brand:true},{i:'fa-adobe',n:'Illustrator',brand:true},{i:'fa-adobe',n:'Photoshop',brand:true},
                        {i:'fa-adobe',n:'InDesign',brand:true},{i:'fa-adobe',n:'After Effects',brand:true},{i:'fa-cube',n:'Blender 3D'},
                        {i:'fa-wand-magic-sparkles',n:'Framer'},{i:'fa-file-powerpoint',n:'Keynote / PPT'},{i:'fa-swatchbook',n:'Pantone System'},{i:'fa-print',n:'Print-Ready Files'}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#fbbf24;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fff7ed 0%,#fffbeb 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(180,83,9,0.12); color:#b45309; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Brands That Now Look Like Industry Leaders</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Adeel Rehman', r:'Founder, Aurelian Perfumes', a:'A', c:'#b45309', t:'Our new brand identity looks like a Parisian luxury house. Retail buyers took us seriously overnight and we doubled our wholesale price.'},
                        {n:'Laila Ahmed', r:'CEO, NovaHealth SaaS', a:'L', c:'#8b5cf6', t:'Their pitch deck helped us close a $4.2M seed round. Every VC commented on how premium and clear our brand felt. Worth 100x what we paid.'},
                        {n:'Karim Bouchard', r:'Owner, Maison Karim Café Chain', a:'K', c:'#ec4899', t:'The packaging and menu redesign transformed our cafés. Customers now post our cups on Instagram every day — free marketing forever.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#b45309,#0f172a); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(180,83,9,0.3);">
                    <div>
                        <i class="fa-solid fa-award" style="font-size:2.2rem; margin-bottom:10px; color:#fbbf24;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Award-Winning Studio</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Featured on Behance & Dribbble.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-arrows-rotate" style="font-size:2.2rem; margin-bottom:10px; color:#fbbf24;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Unlimited Revisions</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">We refine until you love it.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-folder-open" style="font-size:2.2rem; margin-bottom:10px; color:#fbbf24;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Full Source Files</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Figma, AI, PSD — you own it all.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-clock" style="font-size:2.2rem; margin-bottom:10px; color:#fbbf24;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Fast Turnaround</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Logos in 5 days, brands in 14.</p>
                    </div>
                </div>
            </div></section>

            <!-- DELIVERABLES / INDUSTRIES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#0f172a; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(251,191,36,0.15); color:#fde68a; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">WHAT WE DESIGN</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Complete Design Deliverables</h2>
                    <p style="color:#fde68a; max-width:600px; margin:0 auto;">Everything you need to launch, scale & impress — from logo to launch collateral.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'Logo Design', icon:'fa-pen-nib'},
                        {t:'Brand Guidelines', icon:'fa-book'},
                        {t:'Business Cards', icon:'fa-id-card'},
                        {t:'Pitch Decks', icon:'fa-file-powerpoint'},
                        {t:'Packaging Design', icon:'fa-box-open'},
                        {t:'Social Templates', icon:'fa-mobile-screen'},
                        {t:'Website Mockups', icon:'fa-desktop'},
                        {t:'Menu & Print Design', icon:'fa-utensils'},
                        {t:'Merch & Apparel', icon:'fa-shirt'},
                        {t:'Icon Systems', icon:'fa-icons'},
                        {t:'Illustration & 3D', icon:'fa-cube'},
                        {t:'Motion Graphics', icon:'fa-film'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#fde68a; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'social' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-hashtag"></i> PREMIUM SOCIAL MEDIA MANAGEMENT
                        </div>
                        <h1>Turn Your Social Profiles Into A <span class="gradient-text">Viral Growth Machine</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Full-service social media management for Instagram, TikTok, LinkedIn, Facebook & X (Twitter). 90+ brands managed · 25M+ organic impressions · viral Reels & TikToks · daily community management · monthly analytics & growth reports.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want premium social media management for my brand.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Get Free Social Audit</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">S</div>
                                <div class="avatar a2">M</div>
                                <div class="avatar a3">V</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(90+ brands · 25M+ impressions)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-social-hero.jpg" alt="Premium Social Media Management — Instagram, TikTok, LinkedIn, Facebook" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(219,39,119,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">Reels · TikTok · Stories</span> <span class="text-xs">&nearr; viral ready</span></div>
                                <div class="float-value">10x</div>
                                <div class="float-label">Avg Engagement Lift</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-users text-orange"></i> Followers <span class="text-xs">&nearr; organic</span></div>
                                <div class="circle-progress"><span>25M+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#831843,#4c1d95); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(131,24,67,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#fda4af); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">90+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Brands Managed</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#a78bfa,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">25M+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Organic Impressions</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fb923c,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">20+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Posts / Reels Monthly</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">6+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Years Experience</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#fdf2f8 0%,#eff6ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(219,39,119,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY OUR SOCIAL MEDIA WORKS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Social Media That Builds Real Communities & Sales</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">We combine premium content, viral strategy & daily engagement to turn followers into loyal buyers.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-calendar-days', c:'#db2777', t:'30-Day Content Calendar', d:'Fully planned posts, Reels, TikToks & Stories mapped to your brand voice & business goals.'},
                        {ic:'fa-video', c:'#8b5cf6', t:'Viral Reels & TikTok Production', d:'Trend-driven short-form video with pro editing, captions & hooks designed to hit the explore page.'},
                        {ic:'fa-palette', c:'#f59e0b', t:'Premium Feed Design', d:'On-brand graphics, carousels & stories crafted in Figma, Photoshop & CapCut Pro for a luxury look.'},
                        {ic:'fa-comments', c:'#10b981', t:'Daily Community Management', d:'DM replies, comment moderation & follower engagement — real humans, real conversations, no bots.'},
                        {ic:'fa-hashtag', c:'#4285f4', t:'Hashtag & Trend Research', d:'Weekly trend alerts, niche hashtags & viral sound tracking to keep your content in the algorithm.'},
                        {ic:'fa-chart-simple', c:'#22d3ee', t:'Monthly Growth Reports', d:'Deep analytics on reach, engagement, followers & conversions — transparent, no vanity metrics.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(219,39,119,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- PLATFORMS -->
            <section style="margin:0; padding:60px 20px; background:#1e1b4b;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.15); color:#f9a8d4; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">PLATFORMS WE MASTER</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Every Social Platform, Perfectly Managed</h2>
                    <p style="color:#f9a8d4;">Instagram, TikTok, LinkedIn, Facebook, X, YouTube Shorts & Pinterest.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-instagram',n:'Instagram',brand:true},{i:'fa-tiktok',n:'TikTok',brand:true},{i:'fa-linkedin',n:'LinkedIn',brand:true},
                        {i:'fa-facebook',n:'Facebook',brand:true},{i:'fa-x-twitter',n:'X (Twitter)',brand:true},{i:'fa-youtube',n:'YouTube Shorts',brand:true},
                        {i:'fa-pinterest',n:'Pinterest',brand:true},{i:'fa-video',n:'Reels & TikToks'},{i:'fa-camera',n:'Stories & Highlights'},{i:'fa-comments',n:'Community DMs'}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#f472b6;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fff7ed 0%,#fdf2f8 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Real Brands. Real Communities. Real Growth.</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Sarah Malik', r:'Founder, Bloomé Beauty', a:'S', c:'#db2777', t:'They took our Instagram from 4k to 82k followers in 6 months. Our Reels regularly hit 500k+ views and DMs turn into actual sales daily.'},
                        {n:'Mohammed Al-Farsi', r:'CEO, Nexara SaaS', a:'M', c:'#8b5cf6', t:'Our LinkedIn became a real lead pipeline. 3M+ impressions, 1200+ qualified inbound leads in 90 days. Best social investment we ever made.'},
                        {n:'Valentina Rossi', r:'Owner, Casa Luna Interiors', a:'V', c:'#f59e0b', t:'Their TikTok content pushed us onto the FYP twice. Went viral with 2.4M views on one video and our store had its best month ever.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#db2777,#8b5cf6); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(219,39,119,0.3);">
                    <div>
                        <i class="fa-solid fa-user-tie" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Dedicated Brand Manager</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Real human, 6+ years experience.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-video" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Content Production Included</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Reels, TikToks, graphics & captions.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-file-contract" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">No Long Contracts</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Month-to-month. Cancel anytime.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-chart-line" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Monthly Growth Reports</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Transparent analytics, no fluff.</p>
                    </div>
                </div>
            </div></section>

            <!-- INDUSTRIES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#1e1b4b; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.15); color:#f9a8d4; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">INDUSTRIES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Social Media That Fits Your Niche</h2>
                    <p style="color:#f9a8d4; max-width:600px; margin:0 auto;">90+ brands managed across e-commerce, personal brands, coaches, SaaS, hospitality & more.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'E-commerce / DTC', icon:'fa-cart-shopping'},
                        {t:'Personal Brands', icon:'fa-user-tie'},
                        {t:'Fashion & Apparel', icon:'fa-shirt'},
                        {t:'Beauty & Skincare', icon:'fa-spray-can-sparkles'},
                        {t:'Coaches & Creators', icon:'fa-microphone'},
                        {t:'SaaS / Tech', icon:'fa-microchip'},
                        {t:'Real Estate', icon:'fa-house'},
                        {t:'Restaurants & Cafés', icon:'fa-utensils'},
                        {t:'Fitness & Wellness', icon:'fa-dumbbell'},
                        {t:'Hotels & Travel', icon:'fa-plane'},
                        {t:'Luxury & Jewelry', icon:'fa-gem'},
                        {t:'Interior & Home', icon:'fa-couch'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#f9a8d4; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'fb_ads' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-brands fa-meta"></i> FACEBOOK & INSTAGRAM ADS MANAGEMENT
                        </div>
                        <h1>Scale Your Sales With <span class="gradient-text">Meta Ads That Convert</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Expert Facebook & Instagram Ads management for e-commerce, DTC brands & lead-gen businesses. $3M+ ad spend managed · 5-10x average ROAS · UGC video ads · CAPI server-side tracking · iOS-14+ proof.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want expert Facebook & Instagram Ads management for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Get Free Meta Ads Audit</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">F</div>
                                <div class="avatar a2">B</div>
                                <div class="avatar a3">I</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>($3M+ Meta ad spend managed)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-fb-ads-hero.jpg" alt="Facebook & Instagram Ads Management — Meta Advertising Experts" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(236,72,153,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">Reels · Stories · Feed · Shop</span> <span class="text-xs">&nearr; UGC ready</span></div>
                                <div class="float-value">7.2x</div>
                                <div class="float-label">Avg ROAS</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-users text-orange"></i> Lookalikes <span class="text-xs">&nearr; 1-3%</span></div>
                                <div class="circle-progress"><span>$3M+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#4c1d95,#831843); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(131,24,67,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#fda4af); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">$3M+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Meta Ad Spend Managed</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#a78bfa,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">5-10x</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">E-com ROAS Achieved</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fb923c,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">-48%</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Avg Cost per Purchase</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">200+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Campaigns Optimized</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#fdf2f8 0%,#eff6ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(236,72,153,0.1); color:#ec4899; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY OUR META ADS WIN</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Facebook & Instagram Ads That Actually Sell</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">We combine scroll-stopping creative, precise targeting & server-side tracking to deliver profitable growth on Meta platforms.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-video', c:'#ec4899', t:'UGC & Video Ad Creative', d:'Scroll-stopping Reels, Stories & feed videos designed to convert cold traffic into buyers.'},
                        {ic:'fa-bullseye', c:'#8b5cf6', t:'Advantage+ & Custom Audiences', d:'Precise interest, lookalike (1-3%) & retargeting audiences trained on your best buyers.'},
                        {ic:'fa-shield-halved', c:'#4285f4', t:'CAPI Server-Side Tracking', d:'Meta Conversions API restores up to 95% of iOS-14+ attribution loss for accurate optimization.'},
                        {ic:'fa-flask', c:'#f59e0b', t:'Creative Testing Framework', d:'Systematic A/B testing of hooks, angles, thumbnails & offers — winners scale, losers get killed.'},
                        {ic:'fa-filter', c:'#10b981', t:'Full-Funnel Campaigns', d:'TOF awareness → MOF engagement → BOF retargeting — engineered for compounding ROAS.'},
                        {ic:'fa-chart-line', c:'#22d3ee', t:'Daily Optimization', d:'CBO/ABO budget shifts, bid tuning & audience refresh — managed by real humans, not just AI.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(236,72,153,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- CAMPAIGN TYPES / STACK -->
            <section style="margin:0; padding:60px 20px; background:#1e1b4b;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.15); color:#f9a8d4; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">META AD FORMATS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Every Facebook & Instagram Placement Covered</h2>
                    <p style="color:#f9a8d4;">Reels, Stories, Feed, Marketplace, Shop & Messenger — mastered.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-facebook',n:'Feed Ads',brand:true},{i:'fa-instagram',n:'Reels Ads',brand:true},{i:'fa-clock-rotate-left',n:'Stories Ads'},
                        {i:'fa-images',n:'Carousel'},{i:'fa-bag-shopping',n:'Shop Ads'},{i:'fa-comments',n:'Messenger Ads'},
                        {i:'fa-repeat',n:'Retargeting'},{i:'fa-users',n:'Lookalikes 1-3%'},{i:'fa-code',n:'CAPI Tracking'},{i:'fa-user-check',n:'Lead Ads'}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#f472b6;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fff7ed 0%,#fdf2f8 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Real Meta Ads. Real Revenue.</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Ayesha Khan', r:'Founder, GlowNest Skincare', a:'A', c:'#ec4899', t:'Went from 1.8x to 6.4x ROAS in 45 days. Their UGC video ads are on another level — our best-selling serum sold out twice.'},
                        {n:'Marco Rossi', r:'CEO, UrbanKick Sneakers', a:'M', c:'#8b5cf6', t:'Scaled us from $8k to $95k/month on Meta profitably. CAPI setup restored 40% of lost iOS conversions. Total pros.'},
                        {n:'Fatima Yusuf', r:'Owner, LumaHome Decor', a:'F', c:'#4285f4', t:'Cost per purchase dropped 52% while spend tripled. Our Instagram Shop is finally a real revenue channel.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#ec4899,#8b5cf6); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(236,72,153,0.3);">
                    <div>
                        <i class="fa-brands fa-meta" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Meta Business Partner</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Certified Facebook & Instagram media buyers.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-eye" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">You Own the Ad Account</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Ad spend goes directly to Meta.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-file-contract" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">No Long Contracts</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Month-to-month. Cancel anytime.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-video" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">UGC Video Included</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Ad creative production baked in.</p>
                    </div>
                </div>
            </div></section>

            <!-- INDUSTRIES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#1e1b4b; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.15); color:#f9a8d4; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">INDUSTRIES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Meta Ads That Scale Any Business</h2>
                    <p style="color:#f9a8d4; max-width:600px; margin:0 auto;">200+ campaigns across e-commerce, DTC, coaching, SaaS & local services.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'E-commerce / DTC', icon:'fa-cart-shopping'},
                        {t:'Fashion & Apparel', icon:'fa-shirt'},
                        {t:'Beauty & Skincare', icon:'fa-spray-can-sparkles'},
                        {t:'Fitness Coaches', icon:'fa-dumbbell'},
                        {t:'Info Products', icon:'fa-graduation-cap'},
                        {t:'SaaS / Apps', icon:'fa-microchip'},
                        {t:'Real Estate', icon:'fa-house'},
                        {t:'Restaurants', icon:'fa-utensils'},
                        {t:'Local Services', icon:'fa-location-dot'},
                        {t:'Jewelry & Luxury', icon:'fa-gem'},
                        {t:'Home Decor', icon:'fa-couch'},
                        {t:'Health & Wellness', icon:'fa-heart-pulse'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#f9a8d4; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'google_ads' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-brands fa-google"></i> GOOGLE ADS MANAGEMENT
                        </div>
                        <h1>Turn Ad Spend Into <span class="gradient-text">Predictable Revenue</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Google Ads Certified experts managing $2M+ in ad spend. Search, Shopping, Performance Max & YouTube — engineered for 3-5x ROAS from day one.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want expert Google Ads management for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Get Free Ads Audit</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">G</div>
                                <div class="avatar a2">A</div>
                                <div class="avatar a3">D</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>($2M+ ad spend managed)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-google-ads-hero.jpg" alt="Google Ads Management" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(66,133,244,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">Search · Shopping · PMax</span> <span class="text-xs">&nearr; Certified</span></div>
                                <div class="float-value">3-5x</div>
                                <div class="float-label">Avg ROAS</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-bullseye text-orange"></i> Conv Rate <span class="text-xs">&nearr; +156%</span></div>
                                <div class="circle-progress"><span>$2M+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#0b1a3a,#1e3a8a); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(30,58,138,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4285f4,#93c5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">$2M+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Ad Spend Managed</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#34a853,#a7f3d0); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">3-5x</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Avg Return on Ad Spend</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbc04,#fde68a); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">-42%</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Avg Cost per Lead Drop</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#ea4335,#fca5a5); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">150+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Campaigns Optimized</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#eff6ff 0%,#fef9c3 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(66,133,244,0.1); color:#4285f4; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY OUR ADS WIN</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Every Dollar. Tracked. Optimized.</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">We don't just spend your budget — we engineer profitable acquisition funnels.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-bullseye', c:'#ea4335', t:'Buyer-Intent Targeting', d:'Zero wasted clicks. We hunt only high-intent, ready-to-buy searches.'},
                        {ic:'fa-magnifying-glass-dollar', c:'#fbbc04', t:'Keyword & Negative Research', d:'Ruthless negative keyword lists that slash wasted spend by 30-50%.'},
                        {ic:'fa-flask', c:'#4285f4', t:'A/B Ad Copy Testing', d:'Continuous split-testing of headlines, descriptions & extensions.'},
                        {ic:'fa-code', c:'#34a853', t:'Conversion Tracking', d:'GA4, GTM, Enhanced Conversions & CAPI — full-funnel attribution.'},
                        {ic:'fa-rotate', c:'#8b5cf6', t:'Smart Bidding', d:'AI-powered Max Conv & tROAS bidding tuned weekly by real humans.'},
                        {ic:'fa-file-invoice-dollar', c:'#22d3ee', t:'Transparent Reporting', d:'Weekly reports with real revenue, ROAS & optimization actions taken.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(66,133,244,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- CAMPAIGN TYPES / STACK -->
            <section style="margin:0; padding:60px 20px; background:#0b1a3a;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(66,133,244,0.15); color:#93c5fd; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CAMPAIGN TYPES</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Every Google Ads Format Covered</h2>
                    <p style="color:#93c5fd;">Search, Shopping, YouTube, Display & Performance Max — mastered.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-magnifying-glass',n:'Search Ads'},{i:'fa-bag-shopping',n:'Shopping Ads'},{i:'fa-youtube',n:'YouTube Ads',brand:true},
                        {i:'fa-display',n:'Display Network'},{i:'fa-rocket',n:'Performance Max'},{i:'fa-mobile-screen',n:'App Campaigns'},
                        {i:'fa-repeat',n:'Remarketing'},{i:'fa-location-dot',n:'Local Ads'},{i:'fa-google',n:'GA4 & GTM',brand:true},{i:'fa-chart-line',n:'Looker Studio'}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#4285f4;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fef9c3 0%,#eff6ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Real Ads. Real ROAS.</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Hamza Sheikh', r:'CEO, AutoDeals PK', a:'H', c:'#4285f4', t:'They took our Google Ads from a money pit to 6.2x ROAS in 60 days. Cost per lead dropped 58%. Absolute pros.'},
                        {n:'Sofia Martins', r:'Marketing Head, BellaLuxe', a:'S', c:'#ea4335', t:'Shopping Ads managed by them scaled us from $10k to $80k/month in ad spend — profitably. Best decision ever.'},
                        {n:'Ravi Patel', r:'Founder, MediCareOne', a:'R', c:'#34a853', t:'Cost per patient acquisition down 62%. Our clinic is now booked 3 weeks in advance from Google Ads alone.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#4285f4,#8b5cf6); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(66,133,244,0.3);">
                    <div>
                        <i class="fa-brands fa-google" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Google Certified</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Official Google Ads Partner agency.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-eye" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">You Own the Account</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Ad spend goes to Google directly.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-file-contract" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">No Long Contracts</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Month-to-month. Cancel anytime.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-chart-column" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Live Dashboard</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">24/7 access to real-time metrics.</p>
                    </div>
                </div>
            </div></section>

            <!-- INDUSTRIES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#0b1a3a; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(66,133,244,0.15); color:#93c5fd; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">INDUSTRIES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Profitable Ads For Any Niche</h2>
                    <p style="color:#93c5fd; max-width:600px; margin:0 auto;">150+ campaigns across every major B2B & B2C industry.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'E-commerce', icon:'fa-cart-shopping'},
                        {t:'Real Estate', icon:'fa-house'},
                        {t:'Healthcare', icon:'fa-heart-pulse'},
                        {t:'Legal Firms', icon:'fa-scale-balanced'},
                        {t:'SaaS / Tech', icon:'fa-microchip'},
                        {t:'Home Services', icon:'fa-wrench'},
                        {t:'Automotive', icon:'fa-car'},
                        {t:'Education', icon:'fa-graduation-cap'},
                        {t:'Finance', icon:'fa-money-bill-trend-up'},
                        {t:'Travel', icon:'fa-plane'},
                        {t:'Fitness', icon:'fa-dumbbell'},
                        {t:'Local Services', icon:'fa-location-dot'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#93c5fd; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'seo' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-magnifying-glass-chart"></i> DOMINANT SEO SERVICES
                        </div>
                        <h1>Take Over <span class="gradient-text">Google Page 1</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Aggressive, data-backed SEO campaigns that monopolize your niche. 180+ ranked domains · 4x avg traffic growth in 6 months · 100+ Page-1 keywords per campaign.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want to rank #1 on Google with your SEO service.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Get Free SEO Audit</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">S</div>
                                <div class="avatar a2">E</div>
                                <div class="avatar a3">O</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(180+ domains ranked)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-seo-hero.jpg" alt="Dominant SEO Services" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(16,185,129,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">Ahrefs · SEMrush · GSC</span> <span class="text-xs">&nearr; White-hat</span></div>
                                <div class="float-value">4x</div>
                                <div class="float-label">Traffic in 6 Months</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-trophy text-orange"></i> Page-1 Keywords <span class="text-xs">&nearr; 100+</span></div>
                                <div class="circle-progress"><span>180+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#064e3b,#0f172a); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(6,78,59,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#34d399,#a7f3d0); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">180+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Domains Ranked</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4x</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Avg Traffic Growth</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbf24,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">100+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Page-1 Keywords / Campaign</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">7+ yrs</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">SEO Experience</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#ecfdf5 0%,#f0fdfa 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(16,185,129,0.1); color:#10b981; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY OUR SEO WORKS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Rankings That Actually Convert</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">We don't chase vanity keywords. We hunt buyer-intent traffic that turns into revenue.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-chart-line', c:'#10b981', t:'Buyer-Intent Keywords', d:'Hidden, high-converting keywords your competitors completely ignore.'},
                        {ic:'fa-file-lines', c:'#22d3ee', t:'Surgical On-Page SEO', d:'Every H1, meta tag, schema & URL aligned to Google\'s latest algorithm.'},
                        {ic:'fa-link', c:'#8b5cf6', t:'High-DR Backlinks', d:'Authoritative, contextual links from trusted industry publications.'},
                        {ic:'fa-gauge-high', c:'#f59e0b', t:'Technical SEO', d:'Crawl fixes, schema, Core Web Vitals & lightning server response times.'},
                        {ic:'fa-pen-nib', c:'#f472b6', t:'Pillar Content', d:'Massive authority guides that magnetize traffic and earn natural links.'},
                        {ic:'fa-chart-bar', c:'#6366f1', t:'ROI Reporting', d:'Transparent monthly breakdowns tying rankings directly to revenue.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(16,185,129,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- TECH STACK -->
            <section style="margin:0; padding:60px 20px; background:#064e3b;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(52,211,153,0.15); color:#6ee7b7; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">PRO SEO STACK</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Enterprise SEO Tools We Use</h2>
                    <p style="color:#a7f3d0;">$2,000+/mo worth of premium tools — included in every campaign.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-magnifying-glass',n:'Ahrefs'},{i:'fa-chart-line',n:'SEMrush'},{i:'fa-frog',n:'Screaming Frog'},
                        {i:'fa-google',n:'Search Console',brand:true},{i:'fa-wave-square',n:'Surfer SEO'},{i:'fa-lightbulb',n:'Clearscope'},
                        {i:'fa-gauge-high',n:'PageSpeed'},{i:'fa-google',n:'Analytics 4',brand:true},{i:'fa-globe',n:'Moz'},{i:'fa-link',n:'Majestic'}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#34d399;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fff7ed 0%,#ecfdf5 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT WINS</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Real Rankings, Real Revenue</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Bilal Ahmed', r:'Owner, UrbanFit Gym', a:'B', c:'#10b981', t:'From invisible to #1 for "gym near me" in 4 months. Our membership signups tripled. These guys are the real deal.'},
                        {n:'Laura Bennett', r:'CEO, HomeGlow Decor', a:'L', c:'#f472b6', t:'40+ Page-1 keywords in 5 months. Organic revenue overtook our paid ads. Best money we\'ve ever spent on marketing.'},
                        {n:'Omar Farooq', r:'Founder, LegalEase PK', a:'O', c:'#22d3ee', t:'Ranked for every high-value legal keyword in our city. Getting 15+ qualified leads per week purely from organic.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#10b981,#0891b2); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(16,185,129,0.3);">
                    <div>
                        <i class="fa-solid fa-shield-halved" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">100% White-Hat</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Zero risk of Google penalties — ever.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-chart-line" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Monthly Growth</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Measurable improvement every 30 days.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-file-invoice" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">No Long Contracts</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Month-to-month. Cancel any time.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-eye" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Full Transparency</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Live rank-tracking dashboard access.</p>
                    </div>
                </div>
            </div></section>

            <!-- INDUSTRIES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#064e3b; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(52,211,153,0.15); color:#6ee7b7; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">INDUSTRIES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">SEO That Dominates Your Niche</h2>
                    <p style="color:#a7f3d0; max-width:600px; margin:0 auto;">200+ industries ranked. If people search it, we rank you for it.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'E-commerce', icon:'fa-cart-shopping'},
                        {t:'Local Business', icon:'fa-location-dot'},
                        {t:'SaaS / Tech', icon:'fa-microchip'},
                        {t:'Real Estate', icon:'fa-house'},
                        {t:'Healthcare', icon:'fa-heart-pulse'},
                        {t:'Legal Firms', icon:'fa-scale-balanced'},
                        {t:'Education', icon:'fa-book-open'},
                        {t:'Fitness & Gym', icon:'fa-dumbbell'},
                        {t:'Restaurants', icon:'fa-utensils'},
                        {t:'Travel', icon:'fa-plane'},
                        {t:'Finance', icon:'fa-money-bill-trend-up'},
                        {t:'Automotive', icon:'fa-car'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#6ee7b7; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'ai' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-robot"></i> AI AUTOMATION & INTEGRATION
                        </div>
                        <h1>Deploy AI That <span class="gradient-text">Runs Your Business 24/7</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Autonomous AI agents, workflow automation & custom LLMs — cut manual work by 70%. 120+ workflows deployed · GPT-4o · Claude · private models.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want AI Automation for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Automate My Business</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">A</div>
                                <div class="avatar a2">I</div>
                                <div class="avatar a3">X</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(120+ AI workflows shipped)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-ai-hero.jpg" alt="AI Automation & Integration" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(139,92,246,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">GPT-4o · Claude · Gemini</span> <span class="text-xs">&nearr; Fine-tuned</span></div>
                                <div class="float-value">70%</div>
                                <div class="float-label">Manual Work Cut</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-brain text-orange"></i> Agents Live <span class="text-xs">&nearr; 24/7</span></div>
                                <div class="circle-progress"><span>120+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#1e1b4b,#3b0764); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(88,28,135,0.25);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#a78bfa,#f0abfc); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">120+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">AI Workflows Deployed</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">70%</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Manual Work Reduced</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">24/7</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Agents Monitored</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbf24,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">3-6mo</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Full ROI Payback</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#faf5ff 0%,#f0f9ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(139,92,246,0.1); color:#8b5cf6; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY AI WITH US</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">AI That Actually Delivers ROI</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">No hype, no hallucinations. Real automations that pay for themselves in months.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-comments', c:'#8b5cf6', t:'AI Support Agents', d:'24/7 chatbots that resolve real issues & escalate hot leads to humans.'},
                        {ic:'fa-brain', c:'#22d3ee', t:'Predictive ML', d:'Forecast sales, predict churn & optimize pricing from your own data.'},
                        {ic:'fa-wand-magic-sparkles', c:'#f59e0b', t:'Workflow Automation', d:'Zapier, Make & n8n pipelines that automate emails, reports & data entry.'},
                        {ic:'fa-magnifying-glass-chart', c:'#6366f1', t:'Data Extraction', d:'Extract & classify data from PDFs, invoices & emails with near-100% accuracy.'},
                        {ic:'fa-file-lines', c:'#f472b6', t:'Content at Scale', d:'Programmatic SEO — thousands of on-brand product & blog pages.'},
                        {ic:'fa-lock', c:'#4ade80', t:'Private LLMs', d:'Fine-tuned models on your data — nothing leaves your infrastructure.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(139,92,246,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- TECH STACK -->
            <section style="margin:0; padding:60px 20px; background:#1e1b4b;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(167,139,250,0.15); color:#c4b5fd; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">AI STACK</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Best-in-Class AI Tools</h2>
                    <p style="color:#c4b5fd;">GPT-4o, Claude, Gemini, LangChain & more — the top of the AI ecosystem.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${[
                        {i:'fa-robot',n:'GPT-4o'},{i:'fa-brain',n:'Claude 3.5'},{i:'fa-star',n:'Gemini'},
                        {i:'fa-link',n:'LangChain'},{i:'fa-database',n:'Pinecone'},{i:'fa-bolt',n:'Zapier'},
                        {i:'fa-diagram-project',n:'Make'},{i:'fa-code',n:'n8n'},{i:'fa-python',n:'Python',brand:true},{i:'fa-node-js',n:'Node.js',brand:true}
                    ].map(t=>`<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${t.brand?'fa-brands':'fa-solid'} ${t.i}" style="font-size:1.3rem; color:#a78bfa;"></i> ${t.n}</div>`).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fdf2f8 0%,#faf5ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT LOVE</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Real Results From Real Businesses</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Rehan Malik', r:'CEO, ShipFast Logistics', a:'R', c:'#8b5cf6', t:'Their AI support agent handles 82% of our WhatsApp tickets. We cut 3 support hires and improved response time by 10x.'},
                        {n:'Emma Rodriguez', r:'Marketing Lead, StyleHub', a:'E', c:'#f472b6', t:'Programmatic SEO with AI content generated 40k organic visits in 3 months. Insane ROI. Cannot recommend enough.'},
                        {n:'Kavya Nair', r:'COO, InvoiceOne', a:'K', c:'#22d3ee', t:'Their AI extracts data from 5000+ invoices/day with 99% accuracy. Replaced an entire back-office team.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#8b5cf6,#ec4899); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(139,92,246,0.3);">
                    <div>
                        <i class="fa-solid fa-lock" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Private & Secure</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">On-premise LLMs. Your data never leaves.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-chart-line" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">ROI in 90 Days</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Or we keep optimizing — free of charge.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-user-graduate" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Team Training</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Full staff onboarding & prompt library.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-rotate-right" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Ongoing Tuning</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Model performance monitored & optimized.</p>
                    </div>
                </div>
            </div></section>

            <!-- USE CASES -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#1e1b4b; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(167,139,250,0.15); color:#c4b5fd; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">USE CASES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Where AI Wins for You</h2>
                    <p style="color:#c4b5fd; max-width:600px; margin:0 auto;">12 proven ways businesses deploy AI with us.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'Support Chatbots', icon:'fa-comments'},
                        {t:'Lead Qualification', icon:'fa-filter'},
                        {t:'Content Generation', icon:'fa-pen-nib'},
                        {t:'Data Extraction', icon:'fa-file-invoice'},
                        {t:'Sales Forecasting', icon:'fa-chart-line'},
                        {t:'Email Automation', icon:'fa-envelope-open-text'},
                        {t:'Voice Agents', icon:'fa-microphone'},
                        {t:'Image Generation', icon:'fa-image'},
                        {t:'Doc Summarization', icon:'fa-file-lines'},
                        {t:'Recommendation AI', icon:'fa-thumbs-up'},
                        {t:'Fraud Detection', icon:'fa-shield-halved'},
                        {t:'Private LLMs', icon:'fa-brain'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#c4b5fd; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (serviceId === 'software' && heroWrap) {
        heroWrap.classList.add('service-detail-hero-homepage');
        heroWrap.innerHTML = `
            <a href="javascript:void(0)" onclick="showPage('servicesMain')" class="service-detail-back">
                <i class="fa-solid fa-arrow-left"></i> All Services
            </a>
            <section class="hero" style="padding-top: 20px;">
                <div class="hero-container">
                    <div class="hero-content">
                        <div class="badge">
                            <i class="fa-solid fa-code"></i> CUSTOM SOFTWARE & SAAS DEVELOPMENT
                        </div>
                        <h1>Enterprise Software That <span class="gradient-text">Scales With You</span></h1>
                        <p class="hero-desc" style="margin-bottom: 28px;">Cloud-native SaaS platforms, ERPs & business automation tools — engineered by senior engineers. 60+ platforms shipped · 99.9% uptime · GDPR/HIPAA/SOC2 compliant.</p>
                        <div class="hero-buttons" style="margin-top: 8px;">
                            <a href="https://wa.me/923281270900?text=${encodeURIComponent('Hi! I want a Custom Software / SaaS built for my business.')}" target="_blank" class="btn-primary"><i class="fa-brands fa-whatsapp"></i> Start My Project</a>
                            <a href="#servicePricingSection" class="btn-secondary" onclick="document.getElementById('servicePricingSection').scrollIntoView({behavior:'smooth'}); return false;">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="reviews">
                            <div class="avatars">
                                <div class="avatar a1">S</div>
                                <div class="avatar a2">A</div>
                                <div class="avatar a3">S</div>
                            </div>
                            <div class="rating">
                                <i class="fa-solid fa-star"></i> <strong>4.9</strong> <span>(60+ SaaS platforms shipped)</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="video-container" style="background: transparent;">
                            <img src="assets/service-software-hero.jpg" alt="Custom Software & SaaS Development" style="width:100%; height:auto; display:block; border-radius: 20px; box-shadow: 0 25px 60px rgba(99,102,241,0.35);">
                            <div class="float-card float-left">
                                <div class="float-header"><span class="text-green">&lt;/&gt; Node · Python · Go</span> <span class="text-xs">&nearr; Cloud-native</span></div>
                                <div class="float-value">99.9%</div>
                                <div class="float-label">Uptime SLA</div>
                            </div>
                            <div class="float-card float-right">
                                <div class="float-header"><i class="fa-solid fa-shield-halved text-orange"></i> Compliance <span class="text-xs">&nearr; SOC2</span></div>
                                <div class="circle-progress"><span>60+</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TRUST / STATS BAR -->
            <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b); border-radius:20px; padding:32px 24px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:24px; box-shadow:0 20px 50px rgba(15,23,42,0.15);">
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">60+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">SaaS Platforms Shipped</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#22d3ee,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">99.9%</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Uptime SLA</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#f472b6,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">10+</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Yrs Senior Engineers</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">4.9★</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">Client Rating</div>
                    </div>
                    <div style="text-align:center; color:#fff;">
                        <div style="font-size:2.2rem; font-weight:800; background:linear-gradient(135deg,#fbbf24,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">SOC2</div>
                        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">GDPR · HIPAA Ready</div>
                    </div>
                </div>
            </section>

            <!-- WHY CHOOSE US -->
            <section style="margin:70px 0 0; padding:60px 20px; background:linear-gradient(180deg,#f0f5ff 0%,#faf5ff 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(99,102,241,0.1); color:#6366f1; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">WHY BUSINESSES CHOOSE US</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Software Built to Scale</h2>
                    <p style="color:#64748b; max-width:640px; margin:0 auto;">From your first 100 users to millions — we engineer software that never breaks under pressure.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px;">
                    ${[
                        {ic:'fa-server', c:'#6366f1', t:'Cloud-Native', d:'AWS, GCP, Kubernetes & microservices — auto-scale to millions of users.'},
                        {ic:'fa-shield-halved', c:'#4ade80', t:'Enterprise Security', d:'End-to-end encryption, JWT, penetration tested — GDPR/HIPAA compliant.'},
                        {ic:'fa-gears', c:'#f59e0b', t:'Full Automation', d:'Eliminate manual work. Automate workflows, reporting & inventory.'},
                        {ic:'fa-chart-pie', c:'#22d3ee', t:'Real-Time Analytics', d:'Custom admin panels with live data, exports & deep business metrics.'},
                        {ic:'fa-plug', c:'#c084fc', t:'API-First', d:'REST & GraphQL APIs. Connect mobile apps, CRMs, ERPs — anything.'},
                        {ic:'fa-code-branch', c:'#f472b6', t:'Clean, Testable Code', d:'DRY/SOLID, unit tested, Git-versioned — future updates stay cheap & fast.'}
                    ].map(x=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:26px; transition:all 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.03);" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(99,102,241,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.03)';">
                            <div style="width:52px; height:52px; border-radius:14px; background:${x.c}20; color:${x.c}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:16px;"><i class="fa-solid ${x.ic}"></i></div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0 0 8px;">${x.t}</h3>
                            <p style="color:#64748b; font-size:0.92rem; line-height:1.55; margin:0;">${x.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- TECH STACK -->
            <section style="margin:0; padding:60px 20px; background:#0f172a;"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:34px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(34,211,238,0.15); color:#22d3ee; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">ENTERPRISE STACK</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#fff; font-weight:800;">Battle-Tested Technologies</h2>
                    <p style="color:#94a3b8;">The same stack that powers Stripe, Netflix & Shopify.</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center;">
                    ${['fa-node-js|Node.js','fa-python|Python','fa-react|React','fa-docker|Docker','fa-aws|AWS','fa-google|GCP','fa-github|GitHub','fa-linux|Linux','fa-stripe|Stripe','fa-database|PostgreSQL'].map(t=>{const[i,n]=t.split('|');const isDb=i==='fa-database';return `<div style="display:flex; align-items:center; gap:10px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; font-weight:600; color:#e2e8f0; backdrop-filter:blur(10px);"><i class="${isDb?'fa-solid':'fa-brands'} ${i}" style="font-size:1.3rem; color:#818cf8;"></i> ${n}</div>`}).join('')}
                </div>
            </div></section>

            <!-- CLIENT TESTIMONIALS -->
            <section style="margin:0; padding:60px 20px; background:linear-gradient(180deg,#fdf2f8 0%,#fff7ed 100%);"><div style="max-width:1200px; margin:0 auto;">
                <div style="text-align:center; margin-bottom:40px;">
                    <div style="display:inline-block; padding:6px 14px; background:rgba(244,114,182,0.1); color:#db2777; border-radius:20px; font-size:0.8rem; font-weight:600; letter-spacing:1px;">CLIENT LOVE</div>
                    <h2 style="font-size:2.2rem; margin:14px 0 10px; color:#0f172a; font-weight:800;">Trusted by Founders & CTOs</h2>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px;">
                    ${[
                        {n:'Daniel Okafor', r:'CTO, LedgerPay', a:'D', c:'#6366f1', t:'They shipped our multi-tenant SaaS MVP in 8 weeks. Clean architecture, zero downtime since launch. Absolute pros.'},
                        {n:'Sana Iqbal', r:'Founder, ClinicOS', a:'S', c:'#f472b6', t:'HIPAA-compliant patient portal delivered on time. Their code is so clean our new devs onboarded in 2 days.'},
                        {n:'James Whitaker', r:'COO, FleetGrid', a:'J', c:'#22d3ee', t:'Custom ERP that replaced 4 SaaS subscriptions. ROI in 6 months. These guys understand real business problems.'}
                    ].map(t=>`
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                            <div style="color:#fbbf24; margin-bottom:12px; letter-spacing:2px;"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                            <p style="color:#334155; font-size:0.98rem; line-height:1.65; margin:0 0 20px; font-style:italic;">"${t.t}"</p>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:50%; background:${t.c}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${t.a}</div>
                                <div>
                                    <div style="font-weight:700; color:#0f172a;">${t.n}</div>
                                    <div style="font-size:0.82rem; color:#64748b;">${t.r}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div></section>

            <!-- GUARANTEE BANNER -->
            <section style="margin:0; padding:60px 20px 80px; background:#fafbfc;"><div style="max-width:1200px; margin:0 auto;">
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:24px; padding:44px 32px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; text-align:center; box-shadow:0 25px 60px rgba(99,102,241,0.3);">
                    <div>
                        <i class="fa-solid fa-code" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Full Source Code</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">You own 100% of the code, schema & IP.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-shield-halved" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">NDA Protected</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Your idea & data stay strictly confidential.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-money-bill-transfer" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">Milestone Payments</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Pay only after each sprint is approved.</p>
                    </div>
                    <div>
                        <i class="fa-solid fa-rotate-right" style="font-size:2.2rem; margin-bottom:10px; color:#fff;"></i>
                        <h3 style="font-size:1.1rem; margin:6px 0; font-weight:700; color:#fff;">60-Day Support</h3>
                        <p style="font-size:0.88rem; margin:0; color:rgba(255,255,255,0.9);">Post-launch bug fixes — completely free.</p>
                    </div>
                </div>
            </div></section>

            <!-- INDUSTRIES WE SERVE -->
            <section style="max-width:1200px; margin:60px auto 0; padding:60px 20px; background:#0f172a; border-radius:24px;">
                <div style="text-align:center; margin-bottom:40px;">
                    <span style="display:inline-block; padding:6px 14px; background:rgba(129,140,248,0.15); color:#a5b4fc; border-radius:999px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px;">USE CASES</span>
                    <h2 style="font-size:2rem; margin:12px 0 8px; color:#fff; font-weight:800;">Software We Build</h2>
                    <p style="color:#94a3b8; max-width:600px; margin:0 auto;">From MVPs to enterprise platforms — any domain, any complexity.</p>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px;">
                    ${[
                        {t:'SaaS Platforms', icon:'fa-cloud'},
                        {t:'ERP Systems', icon:'fa-building'},
                        {t:'CRM Software', icon:'fa-users-gear'},
                        {t:'Admin Dashboards', icon:'fa-gauge-high'},
                        {t:'Booking Systems', icon:'fa-calendar-check'},
                        {t:'HR & Payroll', icon:'fa-user-tie'},
                        {t:'Inventory Tools', icon:'fa-warehouse'},
                        {t:'Fintech Apps', icon:'fa-money-check-dollar'},
                        {t:'Healthcare EMR', icon:'fa-notes-medical'},
                        {t:'Marketplaces', icon:'fa-store'},
                        {t:'LMS Platforms', icon:'fa-graduation-cap'},
                        {t:'Internal Tools', icon:'fa-screwdriver-wrench'}
                    ].map(i => `
                        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 12px; text-align:center;">
                            <div style="font-size:1.8rem; color:#a5b4fc; margin-bottom:10px;"><i class="fa-solid ${i.icon}"></i></div>
                            <div style="font-size:0.85rem; color:#e2e8f0; font-weight:600;">${i.t}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else if (heroWrap) {
        heroWrap.classList.remove('service-detail-hero-homepage');
        heroWrap.innerHTML = heroWrap.dataset.defaultHtml;
        const iconEl = document.getElementById('serviceHeroIcon');
        const prefix = service.iconPrefix || 'fa-solid';
        if (iconEl) iconEl.className = `${prefix} ${service.icon}`;
        const titleEl = document.getElementById('serviceHeroTitle');
        const descEl = document.getElementById('serviceHeroDesc');
        if (titleEl) titleEl.innerHTML = service.title;
        if (descEl) descEl.textContent = service.desc;
    }

    // Update Features Section Title
    const featTitle = document.getElementById('serviceFeaturesTitle');
    if (featTitle) featTitle.textContent = `What's Included in ${service.title}`;

    // Render feature cards
    const grid = document.getElementById('serviceContentGrid');
    if (grid) {
        grid.innerHTML = '';
        service.features.forEach(feat => {
            grid.innerHTML += `
                <div class="service-feat-card">
                    <div class="service-feat-icon"><i class="fa-solid ${feat.icon}"></i></div>
                    <h3>${feat.title}</h3>
                    <p>${feat.desc}</p>
                </div>
            `;
        });
    }

    // Render process steps
    const stepsEl = document.getElementById('serviceProcessSteps');
    if (stepsEl && service.process) {
        stepsEl.innerHTML = '';
        service.process.forEach((step, i) => {
            stepsEl.innerHTML += `
                <div class="service-process-step">
                    <div class="step-number">${i + 1}</div>
                    <h4>${step.title}</h4>
                    <p>${step.desc}</p>
                </div>
            `;
        });
    }

    // --- PRICING PACKAGES DATA ---
    const pricingPackages = {
        web: [
            { name: 'Starter', price: '$99', desc: 'Perfect for small businesses & startups', features: ['5-Page Responsive Website', 'Mobile-First Design', 'Basic SEO Setup', 'Contact Form Integration', '1 Month Free Support', 'Free Domain Advice'] },
            { name: 'Professional', price: '$179', desc: 'For growing businesses that demand results', features: ['Up to 15 Pages', 'Custom UI/UX Design', 'Full On-Page SEO', 'Blog / CMS Integration', 'Google Analytics Setup', '3 Months Support', 'Speed Optimization'], highlight: true },
            { name: 'Enterprise', price: 'Custom', desc: 'Full-scale web applications & e-commerce', features: ['Unlimited Pages', 'E-Commerce / Client Portal', 'Custom API Integrations', 'Admin Dashboard', 'Advanced Security Layer', '6 Months Priority Support', 'Dedicated Project Manager'] }
        ],
        software: [
            { name: 'MVP Build', price: '$799', desc: 'Launch your idea fast with a solid foundation', features: ['Core Feature Set', 'User Auth & Dashboard', 'Basic Admin Panel', 'REST API', '1 Month Support'] },
            { name: 'SaaS Pro', price: '$1,999', desc: 'A complete, market-ready SaaS product', features: ['Multi-Tenant Architecture', 'Stripe Billing Integration', 'Role-Based Permissions', 'Analytics Dashboard', 'CI/CD Deployment Pipeline', '3 Months Support'], highlight: true },
            { name: 'Enterprise', price: 'Custom', desc: 'Mission-critical enterprise software', features: ['Full Custom Architecture', 'ERP / CRM Integration', 'HIPAA / GDPR Compliance', 'Load Testing & Scaling', 'Dedicated DevOps Engineer', 'SLA Guarantee'] }
        ],
        ai: [
            { name: 'AI Starter', price: '$499', desc: 'Your first step into AI automation', features: ['1 AI Chatbot Deployment', 'WhatsApp / Web Integration', 'Basic Intent Recognition', 'CRM Handoff Logic', '1 Month Monitoring'] },
            { name: 'Automation Pro', price: '$1,499', desc: 'Automate your entire core workflow', features: ['Custom LLM Integration', 'Multi-Platform Bot Deployment', 'Data Pipeline Automation', 'API & Zapier Connections', 'Model Fine-Tuning', '3 Months Support'], highlight: true },
            { name: 'AI Enterprise', price: 'Custom', desc: 'Full AI transformation for your business', features: ['Private LLM Deployment', 'RPA Implementation', 'Predictive Analytics Models', 'Dedicated AI Engineer', 'Staff Training Sessions', 'Ongoing Model Optimization'] }
        ],
        seo: [
            { name: 'Local SEO', price: '$199/mo', desc: 'Dominate your city\'s search results', features: ['10 Target Keywords', 'Google Business Optimization', 'On-Page SEO Fixes', 'Monthly Ranking Report', 'Citation Building'] },
            { name: 'Growth SEO', price: '$499/mo', desc: 'Aggressive growth for competitive niches', features: ['30 Target Keywords', 'Technical SEO Audits', 'Weekly Content Publishing', 'Link Building (10 links/mo)', 'Competitor Tracking', 'Bi-Weekly Reporting'], highlight: true },
            { name: 'Domination', price: '$999/mo', desc: 'Total search market monopolization', features: ['Unlimited Keywords Targeted', 'Daily Content Production', 'Premium Link Building (30/mo)', 'Core Web Vitals Optimization', 'Video & Image SEO', 'Dedicated SEO Strategist'] }
        ],
        google_ads: [
            { name: 'Launch', price: '$299/mo', desc: 'Start capturing high-intent leads today', features: ['Up to $1k Ad Spend Managed', '2 Search Campaign Setups', 'Keyword Research & Negatives', 'Basic Conversion Tracking', 'Monthly Performance Report'] },
            { name: 'Scale', price: '$599/mo', desc: 'Serious growth for established businesses', features: ['Up to $5k Ad Spend Managed', 'Search + Display Campaigns', 'A/B Ad Copy Testing', 'Retargeting Campaign Setup', 'Conversion Rate Optimization', 'Weekly Reporting'], highlight: true },
            { name: 'Dominate', price: 'Custom', desc: 'Full-service management for high ad spend', features: ['Unlimited Ad Spend Managed', 'All Campaign Types', 'Performance Max & Shopping Ads', 'Full Funnel Optimization', 'Dedicated Account Manager', 'Daily Bid Optimization'] }
        ],
        fb_ads: [
            { name: 'Starter', price: '$299/mo', desc: 'Build brand awareness and generate leads', features: ['Up to $1k Ad Spend Managed', '1-2 Campaign Setups', 'Audience Research & Targeting', 'Facebook Pixel Installation', 'Monthly Performance Report'] },
            { name: 'Growth', price: '$599/mo', desc: 'Scale your sales with proven funnels', features: ['Up to $5k Ad Spend Managed', 'Full Funnel Campaign Structure', 'Retargeting Audience Setups', '5 Ad Creatives Designed', 'CAPI Server-Side Tracking', 'Weekly Reporting'], highlight: true },
            { name: 'ROAS Machine', price: 'Custom', desc: 'Maximum ROAS for e-commerce & high-ticket', features: ['Unlimited Spend Management', 'Catalog & Shopping Ads', 'Lookalike Scaling Strategy', 'UGC Video Ad Production', 'Daily Bid Optimization', 'Dedicated Media Buyer'] }
        ],
        social: [
            { name: 'Essentials', price: '$199/mo', desc: 'Keep your profiles active and professional', features: ['2 Platforms Managed', '12 Posts Per Month', 'Custom Graphic Design', 'Caption Copywriting', 'Monthly Analytics Report'] },
            { name: 'Growth', price: '$499/mo', desc: 'Build a real, engaged following fast', features: ['4 Platforms Managed', '30 Posts + 15 Stories/mo', 'Premium Design & Video Reels', 'Community Management', 'Data-Driven Hashtag Strategy', 'Proactive Growth Outreach'], highlight: true },
            { name: 'Brand Authority', price: '$999/mo', desc: 'Complete brand domination across all channels', features: ['All Platforms Managed', 'Unlimited Content Creation', 'Influencer Outreach Program', 'LinkedIn Executive Ghostwriting', 'Paid Ad Coordination', 'Reputation & Crisis Management'] }
        ],
        graphic: [
            { name: 'Brand Starter', price: '$79', desc: 'A solid visual foundation for your business', features: ['Logo Design (3 Concepts)', '2 Revision Rounds', 'Brand Color Palette', 'Typography Selection', 'All Source Files Delivered'] },
            { name: 'Brand Pro', price: '$199', desc: 'A complete, professional brand identity', features: ['Logo + Full Brand Style Guide', 'Business Card Design', 'Social Media Kit (10 Templates)', 'Brand Guidelines PDF', 'Stationery Design', '5 Revision Rounds'], highlight: true },
            { name: 'Brand Empire', price: '$449', desc: 'Enterprise-level identity & full asset suite', features: ['Everything in Brand Pro', 'Figma UI/UX Design', 'Investor Pitch Deck', 'Product Packaging Design', 'Animated / Motion Logo', 'Dedicated Art Director'] }
        ]
    };

    // --- FAQ DATA ---
    const faqs = {
        web: [
            { q: 'How long does it take to build a website?', a: 'A standard 5-10 page website typically takes 2-3 weeks. E-commerce and complex web applications can take 4-8 weeks depending on the scope and number of features.' },
            { q: 'Will my website work perfectly on mobile?', a: 'Absolutely. Every website we build is Mobile-First. We meticulously test on dozens of device sizes to ensure a flawless user experience for every single visitor.' },
            { q: 'Do you provide website hosting?', a: 'We don\'t sell hosting directly, but we provide expert guidance on the best hosting solutions (SiteGround, Cloudways, AWS) for your traffic level and budget, and handle the full deployment process.' },
            { q: 'What if I need changes after the site launches?', a: 'All packages include a post-launch support period. After that, we offer affordable monthly maintenance retainers to keep your site updated, secure, and running perfectly.' },
            { q: 'Do I fully own my website after it\'s built?', a: '100%. You own every single asset — the code, images, domain, and hosting account. We hand over full credentials and all source files upon final payment.' }
        ],
        software: [
            { q: 'How do you handle project communication?', a: 'We use Slack or WhatsApp for daily updates, weekly video calls for milestone reviews, and a shared project board (Trello/Notion) for complete transparency at every stage.' },
            { q: 'What tech stack do you use?', a: 'We are tech-stack agnostic. Common choices: React/Next.js (Frontend), Node.js/Python (Backend), PostgreSQL/MongoDB (Database), AWS/GCP (Hosting). We always choose the best tool for your specific requirements.' },
            { q: 'Can you work on an existing codebase?', a: 'Yes. Our senior engineers are highly experienced at auditing, refactoring, and extending legacy codebases without breaking existing functionality or creating technical debt.' },
            { q: 'How do you handle data security?', a: 'Security is non-negotiable. We implement JWT auth, input sanitization, rate limiting, HTTPS enforcement, and conduct penetration testing before every major release to market.' },
            { q: 'What happens after the software is launched?', a: 'We offer dedicated post-launch monitoring and support packages. We track uptime 24/7, fix bugs, and deploy new features on an ongoing sprint basis as your business evolves.' }
        ],
        ai: [
            { q: 'Is my company data safe with AI integrations?', a: 'Completely. We can deploy private, on-premise LLMs that never send your data to third-party servers. Your sensitive business data never leaves your own secure infrastructure.' },
            { q: 'How much can AI automation actually save my business?', a: 'Our clients consistently see a 40-80% reduction in time spent on manual, repetitive tasks within the first 90 days of AI implementation, translating directly to cost savings.' },
            { q: 'Do I need a huge dataset to get started with AI?', a: 'Not at all. We leverage powerful pre-trained models (GPT-4, Claude) that work brilliantly out of the box and can be fine-tuned with as few as a few hundred of your own data examples.' },
            { q: 'Will an AI chatbot actually understand my customers properly?', a: 'Modern LLMs understand nuance, industry-specific jargon, and complex multi-turn conversations with remarkable accuracy. We extensively test your bot on real customer queries before going live.' },
            { q: 'What\'s the typical ROI on an AI automation project?', a: 'Most clients see a full return on their investment within 3-6 months. After that, the automation is pure profit — operating 24/7, 365 days a year, without salary, benefits, or human error.' }
        ],
        seo: [
            { q: 'How long does SEO actually take to show results?', a: 'SEO is a long-term investment. Initial ranking movements are typically visible in months 2-3, and significant, revenue-generating traffic increases appear by month 4-6. We report every movement monthly.' },
            { q: 'Do you guarantee a #1 Google ranking?', a: 'No ethical SEO agency can guarantee #1 rankings — and you should run from any agency that does. We guarantee a relentless, data-backed strategy and measurable improvement every single month.' },
            { q: 'Will SEO actually work for my specific industry?', a: 'If people are searching for your product or service on Google (and they are), SEO will work. We have driven results across hundreds of industries including local services, e-commerce, SaaS, and B2B.' },
            { q: 'Do you use only safe, white-hat SEO tactics?', a: '100%. We never use black-hat techniques that could get your site penalized or de-indexed. Our strategies strictly align with Google\'s Webmaster Guidelines for permanent, sustainable rankings.' },
            { q: 'What exactly is in the monthly SEO report?', a: 'A fully transparent report: keyword ranking position changes, organic traffic growth, new backlinks acquired, technical issues fixed, and a detailed action plan for the upcoming month.' }
        ],
        google_ads: [
            { q: 'What is the minimum budget I should start with?', a: 'We recommend a minimum monthly ad spend of $500 to gather meaningful data. The ideal budget depends on your industry\'s average Cost Per Click (CPC), which we research thoroughly before launch.' },
            { q: 'How quickly will I start seeing leads and sales?', a: 'Google Ads can drive traffic within hours of launching. The first 2-4 weeks is a critical data-gathering phase. Expect peak, fully-optimized performance after 4-6 weeks of expert management.' },
            { q: 'Is your management fee separate from what goes to Google?', a: 'Yes, always. Your ad spend goes directly to Google in your own account (we never hold your money), and our management fee is paid separately. You have 100% transparency and control.' },
            { q: 'Can you improve an existing underperforming Google Ads account?', a: 'Absolutely. We conduct a ruthless audit of your existing account first, immediately identify the wasteful spending and missed opportunities, and then take over to dramatically improve performance.' },
            { q: 'What types of Google Ads campaigns do you manage?', a: 'We expertly manage all campaign types: Search, Display, YouTube, Shopping, Performance Max, and App campaigns. Our strategy is always tailored to your specific conversion goals.' }
        ],
        fb_ads: [
            { q: 'How do you work around iOS 14+ tracking limitations?', a: 'We fully compensate for iOS 14+ tracking losses by implementing Meta\'s Conversions API (server-side tracking), which restores up to 95% of previously lost attribution data and signals.' },
            { q: 'What kind of ad creatives do you produce for us?', a: 'We produce static image ads, multi-product carousel ads, video scripts and editing, and high-performing UGC (User Generated Content) style videos — all proven to maximize engagement and CTR.' },
            { q: 'How long before my campaigns become profitable?', a: 'The first 2-3 weeks is a structured testing phase — we call it "buying data." After identifying winning audiences and creatives, we scale aggressively, and most clients are profitable by week 4-6.' },
            { q: 'Do you manage Instagram Ads as well?', a: 'Yes, absolutely. Facebook and Instagram Ads are both managed from the Meta Ads Manager platform. We optimize placements across both channels, including Reels, Stories, and Feed ads.' },
            { q: 'What Return on Ad Spend (ROAS) can I realistically expect?', a: 'ROAS varies by industry and your product\'s profit margins. We set data-driven benchmarks during onboarding. E-commerce clients typically target 3-5x ROAS initially, scaling toward 5-10x.' }
        ],
        social: [
            { q: 'Which social media platforms do you manage?', a: 'We manage Instagram, Facebook, LinkedIn, TikTok, X (Twitter), YouTube Shorts, and Pinterest. We recommend focusing intensely on 2-3 platforms first for maximum compounding impact.' },
            { q: 'Do I need to provide content ideas or briefs?', a: 'Never. We handle everything from strategy to design to publishing. You simply review and approve the monthly content calendar before we post. It\'s a 100% done-for-you service.' },
            { q: 'Will the content actually sound like our brand voice?', a: 'In our onboarding, we conduct a deep brand voice discovery session. After the first 2-3 weeks, most clients say the content feels completely authentic — as if they wrote it themselves.' },
            { q: 'How do you actually grow followers organically without bots?', a: 'Through targeted hashtag optimization, strategic peak-time posting, proactive engagement with target accounts, platform collaborations, and relentless exploitation of trending content formats like Reels.' },
            { q: 'How long before I see genuinely significant growth?', a: 'Initial improvements in engagement quality are visible within weeks 2-4. Significant, compounding follower growth and genuine community building solidifies over 3-6 months of consistent execution.' }
        ],
        graphic: [
            { q: 'How many initial logo concepts will I receive?', a: 'In our Professional and Enterprise packages, you receive 3-5 distinct logo concepts, each built around a completely different visual strategy. You choose one direction and we perfect it.' },
            { q: 'What specific file formats will I receive upon delivery?', a: 'You receive all formats for any use: SVG, PDF (vector), PNG (transparent background), JPG, EPS, and the full AI (Adobe Illustrator) source file — covering both print and digital applications.' },
            { q: 'How many design revision rounds are included?', a: 'Packages include generous revision rounds (clearly specified in your scope). Our thorough briefing process means clients rarely need more than 2-3 focused rounds to achieve the perfect result.' },
            { q: 'What if I don\'t like any of the initial logo concepts?', a: 'This is extremely rare because our discovery briefing is so thorough. However, if it occurs, we provide one complimentary additional set of completely new concepts at no extra charge.' },
            { q: 'Can you redesign and modernize our existing logo?', a: 'Absolutely. A great logo redesign strategically retains the existing brand equity and recognition while modernizing the mark and elevating it to a premium level. This is one of our specialties.' }
        ]
    };

    // --- Render Pricing Section ---
    const pricingContainer = document.getElementById('servicePricingContainer');
    const pricingSection = document.getElementById('servicePricingSection');
    const pkgs = pricingPackages[serviceId];
    if (pricingContainer && pkgs) {
        if (pricingSection) pricingSection.style.display = 'block';
        pricingContainer.innerHTML = '';
        pkgs.forEach(pkg => {
            pricingContainer.innerHTML += `
                <div class="pricing-card ${pkg.highlight ? 'pricing-highlighted' : ''}">
                    ${pkg.highlight ? '<div class="pricing-badge"><i class="fa-solid fa-star"></i> Most Popular</div>' : ''}
                    <h3 class="pricing-plan-name">${pkg.name}</h3>
                    <div class="pricing-price">${pkg.price}</div>
                    <p class="pricing-plan-desc">${pkg.desc}</p>
                    <ul class="pricing-features-list">
                        ${pkg.features.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('')}
                    </ul>
                    <button class="pricing-cta-btn ${pkg.highlight ? 'pricing-cta-primary' : 'pricing-cta-secondary'}" onclick="showPage('contact')">
                        Get Started <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            `;
        });
    }

    // --- Render FAQ Section ---
    const faqContainer = document.getElementById('serviceFaqContainer');
    const faqSection = document.getElementById('serviceFaqSection');
    const faqItems = faqs[serviceId];
    if (faqContainer && faqItems) {
        if (faqSection) faqSection.style.display = 'block';
        faqContainer.innerHTML = '';
        faqItems.forEach((item, i) => {
            faqContainer.innerHTML += `
                <div class="service-faq-item" id="sfaq-${serviceId}-${i}">
                    <button class="service-faq-question" onclick="toggleServiceFaq('sfaq-${serviceId}-${i}')">
                        <span>${item.q}</span>
                        <i class="fa-solid fa-chevron-down faq-chevron"></i>
                    </button>
                    <div class="service-faq-answer">
                        <p>${item.a}</p>
                    </div>
                </div>
            `;
        });
    }

    // Hide all pages directly (bypass showPage override)
    document.querySelectorAll('#mainContent > div').forEach(el => el.style.display = 'none');

    // Show services detail page
    const sp = document.getElementById('servicesPage');
    if (sp) sp.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleServiceFaq = function(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;
    const answer = item.querySelector('.service-faq-answer');
    const chevron = item.querySelector('.faq-chevron');
    const isOpen = item.classList.contains('faq-open');
    document.querySelectorAll('.service-faq-item.faq-open').forEach(el => {
        el.classList.remove('faq-open');
        el.querySelector('.service-faq-answer').style.maxHeight = '0';
        el.querySelector('.faq-chevron').style.transform = 'rotate(0deg)';
    });
    if (!isOpen) {
        item.classList.add('faq-open');
        answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
        chevron.style.transform = 'rotate(180deg)';
    }
};

window.toggleMobileServices = function() {
    const dropdown = document.getElementById('mobileServicesDropdown');
    const icon = document.getElementById('mobileServicesIcon');
    if (dropdown.style.maxHeight === '0px' || !dropdown.style.maxHeight) {
        dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    } else {
        dropdown.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
    }
};

window.renderMainServices = function() {
    const grid = document.getElementById('mainServicesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const key in servicesData) {
        const service = servicesData[key];
        const prefix = service.iconPrefix || 'fa-solid';

        let featuresHtml = '';
        if (service.features && service.features.length > 0) {
            featuresHtml = '<ul class="service-card-feature-list">';
            for(let i=0; i<Math.min(3, service.features.length); i++){
                featuresHtml += `<li><i class="fa-solid fa-check"></i> ${service.features[i].title}</li>`;
            }
            featuresHtml += '</ul>';
        }

        grid.innerHTML += `
            <div class="service-main-card" onclick="showService('${key}')">
                <div class="service-card-icon-wrap">
                    <i class="${prefix} ${service.icon}"></i>
                </div>
                <h3>${service.title}</h3>
                <p>${service.shortDesc}</p>
                ${featuresHtml}
                <span class="service-card-cta">View Details <i class="fa-solid fa-arrow-right"></i></span>
            </div>
        `;
    }
};

// Ensure it renders on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.renderMainServices) window.renderMainServices();
});
// Fallback if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.renderMainServices) window.renderMainServices();
}



// Floating Cookie Popup Logic
window.acceptFloatingCookies = function() {
    localStorage.setItem('vextro_cookie_consent', 'accepted');
    const popup = document.getElementById('floatingCookiePopup');
    if (popup) {
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => popup.style.display = 'none', 400);
    }
};

window.rejectFloatingCookies = function() {
    localStorage.setItem('vextro_cookie_consent', 'rejected');
    const popup = document.getElementById('floatingCookiePopup');
    if (popup) {
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => popup.style.display = 'none', 400);
    }
};

function initFloatingCookiePopup() {
    const cookieConsent = localStorage.getItem('vextro_cookie_consent');
    if (!cookieConsent) {
        setTimeout(() => {
            const popup = document.getElementById('floatingCookiePopup');
            if (popup) {
                popup.style.display = 'block';
                setTimeout(() => {
                    popup.style.opacity = '1';
                    popup.style.transform = 'translateY(0)';
                }, 50);
            }
        }, 1500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingCookiePopup);
} else {
    initFloatingCookiePopup();
}

