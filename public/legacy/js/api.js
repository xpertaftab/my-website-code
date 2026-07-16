// API Integration Layer for Vextro Lyntra
// Connects frontend to Express backend

const API_BASE = window.location.origin;

const API = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}/api/${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async post(endpoint, data) {
    const headers = { 'Content-Type': 'application/json' };
    const user = window.auth && window.auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch(e) {}
    }
    const res = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async put(endpoint, data) {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async del(endpoint) {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
};

// Load from local JSON file
async function loadLocalJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

// Initialize: Load data from Firestore first, then API/JSON fallback
document.addEventListener('DOMContentLoaded', async () => {
  let productsLoaded = false;

  // Check if main.js already populated PRODUCTS_DATA (from localStorage)
  const hasLocalData = window.PRODUCTS_DATA && Object.keys(window.PRODUCTS_DATA).length > 0;

  // 1. Try Firestore first (cross-browser sync) only if no local data
  if (!hasLocalData && window.fsLoadMap) {
    try {
      const fsData = await window.fsLoadMap('products');
      if (fsData && Object.keys(fsData).length > 0) {
        window.PRODUCTS_DATA = fsData;
        productsLoaded = true;
        console.log('Firestore: Loaded', Object.keys(fsData).length, 'products');
      }
    } catch(e) {
      console.warn('Firestore: Could not load products', e.message);
    }
  }

  // 2. Try API if Firestore empty AND no local data
  if (!productsLoaded && !hasLocalData) {
    try {
      const products = await API.get('products');
      if (products && products.length > 0) {
        products.forEach(p => {
          const id = p.id;
          if (!window.PRODUCTS_DATA) window.PRODUCTS_DATA = {};
          window.PRODUCTS_DATA[id] = { id, title: p.title, category: p.category || 'Code Scripts',
            image: p.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
            price: p.price, oldPrice: p.oldPrice || p.price * 2, discount: p.discount || '-50%',
            badge: p.badge||'', badgeColor: p.badgeColor||'', rating: p.rating||0, reviews: p.reviews||0, sold: p.sold||0,
            whatsappMsg: p.whatsappMsg || `Hi! I want to buy ${p.title} for USD ${p.price}. Please guide me.`,
            demoUrl: p.demoUrl||'#', shortDesc: p.shortDesc||'', fullDesc: p.fullDesc||'',
            included: (typeof p.included === 'string' ? JSON.parse(p.included) : p.included) || [],
            features: (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) || [],
            reviewsList: (typeof p.reviewsList === 'string' ? JSON.parse(p.reviewsList) : p.reviewsList) || [],
            gallery: (typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery) || (p.image ? [p.image] : [])
          };
        });
        productsLoaded = true;
        console.log(`API: Loaded ${products.length} products`);
      }
    } catch(e) {
      console.warn('API: Could not load products', e.message);
    }
  }

  // 3. Try local JSON only if still empty
  if (!productsLoaded && (!window.PRODUCTS_DATA || Object.keys(window.PRODUCTS_DATA).length === 0)) {
    try {
      const products = await loadLocalJSON('data/products.json');
      if (products && products.length > 0) {
        window.PRODUCTS_DATA = {};
        products.forEach((p, idx) => {
          const id = p.id || 'prod_' + (idx + 1);
          window.PRODUCTS_DATA[id] = { id, title: p.title, category: p.category || 'Code Scripts',
            image: p.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
            price: p.price, oldPrice: p.oldPrice || p.price * 2, discount: p.discount || '-50%',
            badge: p.badge||'', badgeColor: p.badgeColor||'', rating: p.rating||4.5,
            reviews: p.reviews||Math.floor(Math.random()*500)+50, sold: p.sold||Math.floor(Math.random()*2000)+100,
            whatsappMsg: p.whatsappMsg||`Hi! I want to buy ${p.title} for USD ${p.price}. Please guide me.`,
            demoUrl: p.demoUrl||'#', shortDesc: p.shortDesc||'', fullDesc: p.fullDesc||p.shortDesc||'',
            included: p.included||[], features: p.features||[], reviewsList: p.reviewsList||[], gallery: p.gallery||[p.image]
          };
        });
        console.log(`Local: Loaded ${products.length} products`);
      }
    } catch(e2) {
      console.warn('Local: Could not load products.json', e2.message);
    }
  } else if (!productsLoaded && window.PRODUCTS_DATA && Object.keys(window.PRODUCTS_DATA).length > 0) {
    console.log('API: Using existing PRODUCTS_DATA from localStorage, count:', Object.keys(window.PRODUCTS_DATA).length);
  }

  // Re-render shop products after data loads
  if (window.renderShopProducts) {
    window.renderShopProducts();
    window.applyShopFiltersAndSort();
  }

  let listingsLoaded = false;

  // 1. Try Firestore first
  if (window.fsLoadMap) {
    try {
      const fsData = await window.fsLoadMap('listings');
      if (fsData && Object.keys(fsData).length > 0) {
        if (!window.MARKETPLACE_DATA) window.MARKETPLACE_DATA = {};
        Object.assign(window.MARKETPLACE_DATA, fsData);
        listingsLoaded = true;
        console.log(`Firestore: Loaded ${Object.keys(fsData).length} listings`);
      }
    } catch(e) {
      console.warn('Firestore: Could not load listings', e.message);
    }
  }

  // 2. Try API
  if (!listingsLoaded) {
    try {
      const listings = await API.get('listings');
      if (listings && listings.length > 0) {
        if (!window.MARKETPLACE_DATA) window.MARKETPLACE_DATA = {};
        listings.forEach(l => {
          window.MARKETPLACE_DATA[l.id] = { id: l.id, title: l.title, category: l.category, status: l.status || 'Active',
            price: l.price.toString(), location: l.location || 'Pakistan', views: l.views || 0,
            image: l.image || 'assets/images/product1.jpg',
            stats: (typeof l.stats === 'string' ? JSON.parse(l.stats) : l.stats) || [],
            info: (typeof l.info === 'string' ? JSON.parse(l.info) : l.info) || [],
            description: l.description || '<p>No description available.</p>'
          };
        });
        listingsLoaded = true;
        console.log(`API: Loaded ${listings.length} listings`);
      }
    } catch(e) {
      console.warn('API: Could not load listings', e.message);
    }
  }

  // 3. Try local JSON
  if (!listingsLoaded && (!window.MARKETPLACE_DATA || Object.keys(window.MARKETPLACE_DATA).length === 0)) {
    try {
      const listings = await loadLocalJSON('data/listings.json');
      if (listings && listings.length > 0) {
        window.MARKETPLACE_DATA = {};
        listings.forEach(l => {
          const id = l.id || 'list_' + Date.now();
          window.MARKETPLACE_DATA[id] = { id, title: l.title, category: l.category, status: l.status || 'Active',
            price: l.price.toString(), location: l.location || 'Pakistan', views: l.views || 0,
            image: l.image || 'assets/images/product1.jpg',
            stats: l.stats || [{ label: "Traffic/Mo", value: "15,000" }],
            info: l.info || [{ label: "Listed", value: "June 2026" }],
            description: l.description || '<p>No description available.</p>'
          };
        });
        console.log(`Local: Loaded ${listings.length} listings`);
      }
    } catch(e2) {
      console.warn('Local: Could not load listings.json', e2.message);
    }
  }

  // Sync user with backend when logged in
  if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await API.post('users/sync', {
            firebaseUid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null
          });
        } catch(e) {
          console.warn('API: Could not sync user', e.message);
        }
      }
    });
  }
});

// Reload frontend data after admin changes
window.reloadFrontendData = async function() {
  // Don't overwrite existing data - admin changes are saved to localStorage
  if (window.PRODUCTS_DATA && Object.keys(window.PRODUCTS_DATA).length > 0) {
    console.log('reloadFrontendData: Using existing PRODUCTS_DATA, count:', Object.keys(window.PRODUCTS_DATA).length);
    return;
  }
  let loaded = false;
  if (window.fsLoadMap) {
    try {
      const fsData = await window.fsLoadMap('products');
      if (fsData && Object.keys(fsData).length > 0) { window.PRODUCTS_DATA = fsData; loaded = true; }
    } catch(e) {}
  }
  if (!loaded) {
    try {
      const products = await API.get('products');
      if (products && products.length > 0) {
        window.PRODUCTS_DATA = {};
        products.forEach(p => { window.PRODUCTS_DATA[p.id] = { id: p.id, title: p.title, category: p.category, image: p.image,
          price: p.price, oldPrice: p.oldPrice || p.price*2, discount: p.discount || '-50%',
          badge: p.badge||'', badgeColor: p.badgeColor||'', rating: p.rating||0, reviews: p.reviews||0, sold: p.sold||0,
          shortDesc: p.shortDesc||'', fullDesc: p.fullDesc||'', included: p.included||[], features: p.features||[], reviewsList: p.reviewsList||[]
        }; });
        loaded = true;
      }
    } catch(e) {
      try {
        const products = await loadLocalJSON('data/products.json');
        if (products && products.length > 0) {
          window.PRODUCTS_DATA = {};
          products.forEach(p => { const id = p.id || 'prod_'+Date.now(); window.PRODUCTS_DATA[id] = { id, title: p.title, category: p.category, image: p.image,
            price: p.price, oldPrice: p.oldPrice, discount: p.discount, badge: p.badge||'', badgeColor: p.badgeColor||'',
            rating: p.rating||4.5, reviews: p.reviews||0, sold: p.sold||0, shortDesc: p.shortDesc||'', fullDesc: p.fullDesc||'',
            included: p.included||[], features: p.features||[], reviewsList: p.reviewsList||[]
          }; });
        }
      } catch(e2) {}
    }
  }
  let listLoaded = false;
  if (window.fsLoadMap) {
    try { const fsData = await window.fsLoadMap('listings'); if (fsData && Object.keys(fsData).length > 0) { window.MARKETPLACE_DATA = fsData; listLoaded = true; } } catch(e) {}
  }
  if (!listLoaded) {
    try {
      const listings = await API.get('listings');
      if (listings && listings.length > 0) {
        window.MARKETPLACE_DATA = {};
        listings.forEach(l => { window.MARKETPLACE_DATA[l.id] = { id: l.id, title: l.title, category: l.category, status: l.status||'Active',
          price: l.price.toString(), location: l.location||'Pakistan', views: l.views||0, image: l.image||'assets/images/product1.jpg',
          stats: (typeof l.stats === 'string' ? JSON.parse(l.stats) : l.stats) || [],
          info: (typeof l.info === 'string' ? JSON.parse(l.info) : l.info) || [],
          description: l.description||'<p>No description available.</p>'
        }; });
      }
    } catch(e) {
      try {
        const listings = await loadLocalJSON('data/listings.json');
        if (listings && listings.length > 0) {
          window.MARKETPLACE_DATA = {};
          listings.forEach(l => { const id = l.id || 'list_'+Date.now(); window.MARKETPLACE_DATA[id] = { id, title: l.title, category: l.category, status: l.status||'Active',
            price: l.price.toString(), location: l.location||'Pakistan', views: l.views||0, image: l.image||'assets/images/product1.jpg',
            stats: l.stats||[], info: l.info||[], description: l.description||''
          }; });
        }
      } catch(e2) {}
    }
  }
  // Force refresh blog data on next visit
  window.allBlogs = [];
};

// Override fetchBlogs — priority: localStorage (admin) > Firestore > API > JSON > hardcoded
// Deleted blog IDs in `blogs_deleted` are filtered from every source so removed blogs never reappear.
const originalFetchBlogs = window.fetchBlogs;
window.fetchBlogs = async function() {
  // One-time reset: clear all previously cached blogs (localStorage + Firestore)
  try {
    const RESET_KEY = 'blogs_reset_v4';
    if (window.vextroLoad && !window.vextroLoad(RESET_KEY)) {
      if (window.vextroSave) {
        window.vextroSave('blogs', []);
        window.vextroSave('blogs_deleted', []);
        window.vextroSave(RESET_KEY, true);
      }
      window.allBlogs = [];
      try { if (typeof allBlogs !== 'undefined') allBlogs = []; } catch(e) {}
      if (typeof window.renderBlogs === 'function') window.renderBlogs([]);
      return;
    }
  } catch(e) {}

  const deletedIds = (window.vextroLoad && window.vextroLoad('blogs_deleted')) || [];
  const isDeleted = id => deletedIds.map(String).includes(String(id));
  const applyList = (list, label) => {
    const filtered = list.filter(b => !isDeleted(b.id));
    window.allBlogs = filtered;
    try { if (typeof allBlogs !== 'undefined') allBlogs = filtered; } catch(e) {}
    if (typeof window.renderBlogs === 'function') window.renderBlogs(filtered);
    console.log(`${label}: Loaded ${filtered.length} blogs`);
  };


  // 1. localStorage first — admin panel writes go here (adds/edits/deletes)
  const savedLocal = window.vextroLoad ? window.vextroLoad('blogs') : null;
  if (Array.isArray(savedLocal)) {
    applyList(savedLocal, 'Local storage');
    return;
  }

  // 2. Firestore
  if (window.fsLoadMap) {
    try {
      const fsData = await window.fsLoadMap('blogs');
      if (fsData && Object.keys(fsData).length > 0) {
        const list = Object.values(fsData);
        applyList(list, 'Firestore');
        if (window.vextroSave) window.vextroSave('blogs', window.allBlogs);
        return;
      }
    } catch(e) {
      console.warn('Firestore: Could not load blogs', e.message);
    }
  }
  // 3. API
  try {
    const blogs = await API.get('blogs');
    if (blogs && blogs.length > 0) {
      applyList(blogs, 'API');
      if (window.vextroSave) window.vextroSave('blogs', window.allBlogs);
      return;
    }
  } catch(e) {
    console.warn('API: Could not load blogs', e.message);
  }
  // 4. Local JSON seed
  try {
    const blogs = await loadLocalJSON('data/blogs.json');
    if (blogs && blogs.length > 0) {
      applyList(blogs, 'Local');
      if (window.vextroSave) window.vextroSave('blogs', window.allBlogs);
      return;
    }
  } catch(e2) {
    console.warn('Local: Could not load blogs.json', e2.message);
  }
  // 5. No hardcoded fallback — empty means no blogs until admin adds new ones
  applyList([], 'Empty blogs');
};

// Override submitBlog to save to API
const originalSubmitBlog = window.submitBlog;
window.submitBlog = async function() {
  const title = document.getElementById('cbTitle')?.value;
  const category = document.getElementById('cbCategory')?.value;
  const content = document.getElementById('cbContent')?.innerHTML;
  const metaDesc = document.getElementById('cbMetaDesc')?.value;

  if (!title || !title.trim()) {
    alert('Please enter a blog title.');
    return;
  }

  const imgEl = document.getElementById('cbImagePreview');
  const imgSrc = (imgEl && imgEl.src && imgEl.src.length > 50) ? imgEl.src : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop';

  const blogData = {
    title: title,
    category: category || 'General',
    excerpt: metaDesc || title,
    content: content || '',
    image: imgSrc,
    status: 'Published',
    authorName: 'Aftab Malik',
    authorAvatar: 'A'
  };

  try {
    const saved = await API.post('blogs', blogData);
    console.log('API: Blog saved', saved);

    // Add to local state
    if (!window.allBlogs) window.allBlogs = [];
    window.allBlogs.unshift(saved);
    if (typeof window.renderBlogs === 'function') {
      window.renderBlogs(window.allBlogs);
    }

    // Add to dashboard
    if (window.addBlogToDashboard) {
      window.addBlogToDashboard(saved);
    }

    // Reset form
    document.getElementById('cbTitle').value = '';
    document.getElementById('cbSlug').value = '';
    document.getElementById('cbContent').innerHTML = '';
    document.getElementById('cbMetaTitle').value = '';
    document.getElementById('cbMetaDesc').value = '';
    document.getElementById('cbKeywords').value = '';

    showPage('dashboard');
    setTimeout(() => { switchDashView('blogs'); }, 150);
  } catch(e) {
    console.error('API: Blog save failed, using local only', e);
    // Fallback to original
    if (originalSubmitBlog) originalSubmitBlog();
  }
};

// Override submitContactForm to use API
const originalSubmitContact = window.submitContactForm;
window.submitContactForm = async function(event, form) {
  event.preventDefault();
  const nameInput = form.querySelector('input[type="text"][placeholder="Aftab"]');
  const emailInput = form.querySelector('input[type="email"]');
  const subjectInput = document.getElementById('contactSubjectInput');
  const messageInput = document.getElementById('contactMessageInput');

  const name = nameInput?.value || '';
  const email = emailInput?.value || '';
  const subject = subjectInput?.value || 'General Inquiry';
  const message = messageInput?.value || '';

  if (!name || !email || !message) {
    alert('Please fill in all required fields.');
    return false;
  }

  try {
    await API.post('contact', { name, email, subject, message, priority: 'NORMAL', department: 'GENERAL' });
    console.log('API: Contact saved');
  } catch(e) {
    console.warn('API: Contact save failed, using EmailJS fallback', e.message);
  }

  // Also send via EmailJS as backup (original behavior)
  if (originalSubmitContact) {
    return originalSubmitContact(event, form);
  }
};

// Override createListing to use API
const originalSubmitListing = window.submitListing;
window.submitListing = async function() {
  const listingData = {
    title: window.clData?.title || '',
    category: window.clData?.category || '',
    status: window.clData?.status || 'Active',
    price: parseFloat(window.clData?.price) || 0,
    location: window.clData?.location || 'Pakistan',
    description: window.clData?.desc || '',
    whatsapp: window.clData?.whatsapp || '',
    negotiable: window.clData?.negotiable || 'Yes'
  };

  try {
    const saved = await API.post('listings', listingData);
    console.log('API: Listing created', saved);
  } catch(e) {
    console.warn('API: Listing save failed, using WhatsApp fallback', e.message);
  }

  // Also send via WhatsApp as backup (original behavior)
  if (originalSubmitListing) {
    originalSubmitListing();
  }
};

// Override deleteDashBlog to use API
const originalDeleteBlog = window.deleteDashBlog;
window.deleteDashBlog = async function(idx) {
  const blog = window.dashBlogsList?.[idx];
  if (!blog) return;
  if (!confirm('Are you sure you want to delete this blog?')) return;

  if (blog.id) {
    try {
      await API.del(`blogs/${blog.id}`);
      console.log('API: Blog deleted');
    } catch(e) {
      console.warn('API: Blog delete failed', e.message);
    }
  }

  if (originalDeleteBlog) originalDeleteBlog(idx);
};

// Override updateBlog to use API
const originalChangeStatus = window.changeBlogStatus;
window.changeBlogStatus = async function(idx, value) {
  const blog = window.dashBlogsList?.[idx];
  if (!blog) return;

  const statusMap = { 'Set as Published': 'Published', 'Draft': 'Draft', 'Pending': 'Pending' };
  const newStatus = statusMap[value] || value;

  if (blog.id) {
    try {
      await API.put(`blogs/${blog.id}`, { status: newStatus });
      console.log('API: Blog status updated');
    } catch(e) {
      console.warn('API: Blog update failed', e.message);
    }
  }

  if (originalChangeStatus) originalChangeStatus(idx, value);
};
