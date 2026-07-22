// Firestore Data Sync Layer (REST API - no gRPC dependency)
// Replaces backend API for data persistence across devices

const FB_PROJECT = 'vextro-lyntra';
const FB_API_KEY = 'AIzaSyAvlaKbCKqv1Z_sYAFhmmn-un2hYiWXEPc';
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

// Helper: convert Firestore document to plain object
function docToObj(doc) {
  const obj = { id: doc.name.split('/').pop() };
  if (!doc.fields) return obj;
  Object.entries(doc.fields).forEach(([key, val]) => {
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = Number(val.integerValue);
    else if (val.doubleValue !== undefined) obj[key] = Number(val.doubleValue);
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.arrayValue && val.arrayValue.values) {
      obj[key] = val.arrayValue.values.map(v => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return Number(v.integerValue);
        if (v.doubleValue !== undefined) return Number(v.doubleValue);
        if (v.mapValue) {
          const inner = {};
          Object.entries(v.mapValue.fields || {}).forEach(([ik, iv]) => {
            if (iv.stringValue !== undefined) inner[ik] = iv.stringValue;
            if (iv.integerValue !== undefined) inner[ik] = Number(iv.integerValue);
            if (iv.doubleValue !== undefined) inner[ik] = Number(iv.doubleValue);
          });
          return inner;
        }
        return v;
      });
    } else if (val.mapValue && val.mapValue.fields) {
      const inner = {};
      Object.entries(val.mapValue.fields).forEach(([ik, iv]) => {
        if (iv.stringValue !== undefined) inner[ik] = iv.stringValue;
        if (iv.integerValue !== undefined) inner[ik] = Number(iv.integerValue);
        if (iv.doubleValue !== undefined) inner[ik] = Number(iv.doubleValue);
        if (iv.arrayValue && iv.arrayValue.values) inner[ik] = iv.arrayValue.values.map(v => v.stringValue || '');
      });
      obj[key] = inner;
    }
  });
  return obj;
}

// Helper: convert plain object to Firestore fields
function objToFields(obj) {
  const fields = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (key === 'id') return;
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (Array.isArray(val)) {
      fields[key] = { arrayValue: { values: val.map(v => {
        if (typeof v === 'string') return { stringValue: v };
        if (typeof v === 'number') return { integerValue: String(v) };
        if (typeof v === 'object') return { mapValue: { fields: objToFields(v) } };
        return { stringValue: String(v) };
      }) } };
    } else if (typeof val === 'object' && val !== null) {
      fields[key] = { mapValue: { fields: objToFields(val) } };
    }
  });
  return fields;
}

// Load collection from Firestore via REST API
window.fsLoadMap = async function(collectionName) {
  try {
    const allDocs = [];
    let pageToken = '';
    let guard = 0;

    // Firestore REST can paginate a collection even when it only returns
    // a couple of large documents. If we read only the first response, new
    // products saved by admin appear to “not save” because they sit on the
    // next page. Always walk every page.
    do {
      const tokenPart = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const res = await fetch(`${FB_BASE}/${collectionName}?pageSize=100&key=${FB_API_KEY}${tokenPart}`);
      if (!res.ok) {
        if (res.status === 404) console.warn('FS: Firestore database not found - enable it in Firebase Console');
        return allDocs.length ? allDocs : null;
      }
      const data = await res.json();
      if (Array.isArray(data.documents)) allDocs.push(...data.documents);
      pageToken = data.nextPageToken || '';
      guard++;
    } while (pageToken && guard < 50);

    if (allDocs.length === 0) return null;
    const map = {};
    // First pass: prefer real id-keyed docs (non purely-numeric keys).
    // A prior bug called fsSaveMap with an array, which created stray
    // numeric-keyed duplicates ("0","1",...) alongside the real docs.
    // Drop and delete those legacy numeric-keyed docs on load.
    const idKeyed = [];
    const numericKeyed = [];
    allDocs.forEach(doc => {
      const docKey = (doc.name || '').split('/').pop();
      (/^\d+$/.test(docKey) ? numericKeyed : idKeyed).push({ doc, docKey });
    });
    const hasIdKeyed = idKeyed.length > 0;
    idKeyed.forEach(({ doc, docKey }) => {
      const obj = docToObj(doc);
      obj.id = docKey;
      map[docKey] = obj;
    });
    numericKeyed.forEach(({ doc, docKey }) => {
      if (hasIdKeyed) {
        if (window.fsDeleteDoc) { try { window.fsDeleteDoc(collectionName, docKey); } catch(e) {} }
        return;
      }
      const obj = docToObj(doc);
      map[docKey] = obj;
    });
    return map;
  } catch(e) {
    console.warn('FS: load', collectionName, 'failed', e.message);
    return null;
  }
};

// Save entire data map to Firestore via REST API
window.fsSaveMap = async function(collectionName, dataMap) {
  if (!dataMap) return;
  // If an array is passed, key it by each item's id. Without this,
  // Object.entries(array) yields numeric keys ("0","1",...) and creates
  // duplicate Firestore docs alongside the real id-keyed docs — which
  // caused blogs to appear multiple times on next load.
  if (Array.isArray(dataMap)) {
    const map = {};
    dataMap.forEach((item, idx) => {
      if (!item) return;
      const id = item.id || item._id || `${collectionName}_${idx}`;
      map[id] = item;
    });
    dataMap = map;
  }
  const entries = Object.entries(dataMap);
  if (entries.length === 0) return;
  try {
    const promises = entries.map(([id, data]) => {
      const clean = { ...data };
      delete clean.id;
      // Try PATCH (update existing) first, fallback to POST (create new)
      return fetch(`${FB_BASE}/${collectionName}/${id}?key=${FB_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: objToFields(clean) })
      }).then(r => {
        if (!r.ok && r.status === 404) {
          // Document doesn't exist, create it
          return fetch(`${FB_BASE}/${collectionName}?documentId=${id}&key=${FB_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: objToFields(clean) })
          });
        }
        return r;
      });
    });
    await Promise.all(promises);
    return true;
  } catch(e) {
    console.warn('FS: save', collectionName, 'failed', e.message);
    return false;
  }
};

// Save one document to Firestore via REST API
window.fsSetDoc = async function(collectionName, id, data) {
  if (!collectionName || !id || !data) throw new Error('fsSetDoc: missing args');
  const clean = { ...data };
  delete clean.id;
  const body = JSON.stringify({ fields: objToFields(clean) });
  if (body.length > 1000000) {
    const err = new Error(`Document too large (${(body.length/1024/1024).toFixed(2)} MB). Firestore limit is 1 MB. Remove embedded base64 images from the description — add them to the product Gallery instead.`);
    err.code = 'DOC_TOO_LARGE';
    throw err;
  }
  const res = await fetch(`${FB_BASE}/${collectionName}/${id}?key=${FB_API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) {
    if (res.status === 404) {
      const res2 = await fetch(`${FB_BASE}/${collectionName}?documentId=${id}&key=${FB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!res2.ok) {
        const txt = await res2.text().catch(()=>'');
        throw new Error(`Firestore create failed (${res2.status}): ${txt.slice(0,200)}`);
      }
      return true;
    }
    const txt = await res.text().catch(()=>'');
    throw new Error(`Firestore save failed (${res.status}): ${txt.slice(0,200)}`);
  }
  return true;
};

// Delete a document from Firestore via REST API
window.fsDeleteDoc = async function(collectionName, id) {
  try {
    await fetch(`${FB_BASE}/${collectionName}/${id}?key=${FB_API_KEY}`, { method: 'DELETE' });
    return true;
  } catch(e) {
    console.warn('FS: delete', id, 'failed', e.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// Product media splitter — lets a single product carry MANY
// images without hitting Firestore's 1 MB per-document limit.
// Heavy base64 images are stored as their own docs in the
// `product_media` collection; the main product doc keeps only
// small "media://ID" references, so total media budget ~5 MB.
// ─────────────────────────────────────────────────────────────

const MEDIA_REF_PREFIX = 'media://';
function isDataUri(s) { return typeof s === 'string' && s.startsWith('data:'); }

window.splitProductForSave = function(productId, data) {
  const mediaDocs = {};
  const clone = { ...data };
  const gallery = Array.isArray(clone.gallery) ? clone.gallery.slice() : [];
  const newGallery = gallery.map((src, i) => {
    if (!isDataUri(src)) return src;
    const mid = `${productId}__g${i}`;
    mediaDocs[mid] = { data: src };
    return MEDIA_REF_PREFIX + mid;
  });
  clone.gallery = newGallery;
  if (isDataUri(clone.image)) {
    if (newGallery[0] && typeof newGallery[0] === 'string' && newGallery[0].startsWith(MEDIA_REF_PREFIX)) {
      clone.image = newGallery[0];
    } else {
      const mid = `${productId}__main`;
      mediaDocs[mid] = { data: clone.image };
      clone.image = MEDIA_REF_PREFIX + mid;
    }
  }
  if (typeof clone.longDesc === 'string' && clone.longDesc.indexOf('data:') !== -1) {
    let idx = 0;
    clone.longDesc = clone.longDesc.replace(/src=(["'])(data:[^"']+)\1/g, (m, q, uri) => {
      const mid = `${productId}__d${idx++}`;
      mediaDocs[mid] = { data: uri };
      return `src=${q}${MEDIA_REF_PREFIX}${mid}${q}`;
    });
  }
  let totalBytes = new Blob([JSON.stringify(clone)]).size;
  Object.values(mediaDocs).forEach(d => { totalBytes += new Blob([d.data]).size; });
  return { mainDoc: clone, mediaDocs, totalBytes };
};

window.fsSaveProductWithMedia = async function(productId, data) {
  const { mainDoc, mediaDocs } = window.splitProductForSave(productId, data);
  const mainBytes = new Blob([JSON.stringify(mainDoc)]).size;
  if (mainBytes > 950 * 1024) {
    const err = new Error(`Product info is too large (${(mainBytes/1024/1024).toFixed(2)} MB). Shorten the description text.`);
    err.code = 'DOC_TOO_LARGE'; throw err;
  }
  for (const [mid, doc] of Object.entries(mediaDocs)) {
    const b = new Blob([doc.data]).size;
    if (b > 950 * 1024) {
      const err = new Error(`One image is too large (${(b/1024/1024).toFixed(2)} MB). Please choose a smaller image.`);
      err.code = 'DOC_TOO_LARGE'; throw err;
    }
  }
  await window.fsSetDoc('products', productId, mainDoc);
  await Promise.all(Object.entries(mediaDocs).map(([mid, doc]) =>
    window.fsSetDoc('product_media', mid, doc)
  ));
  try {
    const existing = await window.fsLoadMap('product_media');
    if (existing) {
      const keep = new Set(Object.keys(mediaDocs));
      await Promise.all(Object.keys(existing)
        .filter(k => k.startsWith(productId + '__') && !keep.has(k))
        .map(k => window.fsDeleteDoc('product_media', k)));
    }
  } catch(e) {}
  return true;
};

window.fsDeleteProductWithMedia = async function(productId) {
  await window.fsDeleteDoc('products', productId);
  try {
    const existing = await window.fsLoadMap('product_media');
    if (existing) {
      await Promise.all(Object.keys(existing)
        .filter(k => k.startsWith(productId + '__'))
        .map(k => window.fsDeleteDoc('product_media', k)));
    }
  } catch(e) {}
};

window.hydrateProductsWithMedia = function(productsMap, mediaMap) {
  if (!productsMap) return productsMap;
  const m = mediaMap || {};
  const resolve = ref => {
    if (typeof ref !== 'string' || !ref.startsWith(MEDIA_REF_PREFIX)) return ref;
    const mid = ref.slice(MEDIA_REF_PREFIX.length);
    const doc = m[mid];
    return (doc && doc.data) ? doc.data : ref;
  };
  Object.values(productsMap).forEach(p => {
    if (!p) return;
    if (Array.isArray(p.gallery)) p.gallery = p.gallery.map(resolve);
    if (p.image) p.image = resolve(p.image);
    if (typeof p.longDesc === 'string' && p.longDesc.indexOf(MEDIA_REF_PREFIX) !== -1) {
      p.longDesc = p.longDesc.replace(/(["'])media:\/\/([^"']+)\1/g, (mtch, q, mid) => {
        const doc = m[mid];
        return doc && doc.data ? `${q}${doc.data}${q}` : mtch;
      });
    }
  });
  return productsMap;
};

window.fsLoadProductsHydrated = async function() {
  const [products, media] = await Promise.all([
    window.fsLoadMap('products'),
    window.fsLoadMap('product_media').catch(() => null)
  ]);
  if (!products) return null;
  return window.hydrateProductsWithMedia(products, media || {});
};

// ─────────────────────────────────────────────────────────────
// Listing media splitter — same idea as products. Base64 images
// in a listing (images[] or embedded in description HTML) are
// stored as their own docs in the `listing_media` collection so
// a single listing can carry many images without hitting the
// 1 MB per-document Firestore limit.
// ─────────────────────────────────────────────────────────────
window.splitListingForSave = function(listingId, data) {
  const mediaDocs = {};
  const clone = { ...data };
  const imgs = Array.isArray(clone.images) ? clone.images.slice() : [];
  const newImgs = imgs.map((src, i) => {
    if (!isDataUri(src)) return src;
    const mid = `${listingId}__i${i}`;
    mediaDocs[mid] = { data: src };
    return MEDIA_REF_PREFIX + mid;
  });
  clone.images = newImgs;
  if (isDataUri(clone.image)) {
    if (newImgs[0] && typeof newImgs[0] === 'string' && newImgs[0].startsWith(MEDIA_REF_PREFIX)) {
      clone.image = newImgs[0];
    } else {
      const mid = `${listingId}__main`;
      mediaDocs[mid] = { data: clone.image };
      clone.image = MEDIA_REF_PREFIX + mid;
    }
  }
  if (typeof clone.description === 'string' && clone.description.indexOf('data:') !== -1) {
    let idx = 0;
    clone.description = clone.description.replace(/src=(["'])(data:[^"']+)\1/g, (m, q, uri) => {
      const mid = `${listingId}__d${idx++}`;
      mediaDocs[mid] = { data: uri };
      return `src=${q}${MEDIA_REF_PREFIX}${mid}${q}`;
    });
  }
  return { mainDoc: clone, mediaDocs };
};

window.fsSaveListingWithMedia = async function(listingId, data) {
  const { mainDoc, mediaDocs } = window.splitListingForSave(listingId, data);
  const mainBytes = new Blob([JSON.stringify(mainDoc)]).size;
  if (mainBytes > 950 * 1024) {
    const err = new Error(`Listing info is too large (${(mainBytes/1024/1024).toFixed(2)} MB). Shorten the description text.`);
    err.code = 'DOC_TOO_LARGE'; throw err;
  }
  for (const [mid, doc] of Object.entries(mediaDocs)) {
    const b = new Blob([doc.data]).size;
    if (b > 950 * 1024) {
      const err = new Error(`One image is too large (${(b/1024/1024).toFixed(2)} MB). Please choose a smaller image.`);
      err.code = 'DOC_TOO_LARGE'; throw err;
    }
  }
  await window.fsSetDoc('listings', listingId, mainDoc);
  await Promise.all(Object.entries(mediaDocs).map(([mid, doc]) =>
    window.fsSetDoc('listing_media', mid, doc)
  ));
  try {
    const existing = await window.fsLoadMap('listing_media');
    if (existing) {
      const keep = new Set(Object.keys(mediaDocs));
      await Promise.all(Object.keys(existing)
        .filter(k => k.startsWith(listingId + '__') && !keep.has(k))
        .map(k => window.fsDeleteDoc('listing_media', k)));
    }
  } catch(e) {}
  return true;
};

window.fsDeleteListingWithMedia = async function(listingId) {
  await window.fsDeleteDoc('listings', listingId);
  try {
    const existing = await window.fsLoadMap('listing_media');
    if (existing) {
      await Promise.all(Object.keys(existing)
        .filter(k => k.startsWith(listingId + '__'))
        .map(k => window.fsDeleteDoc('listing_media', k)));
    }
  } catch(e) {}
};

window.hydrateListingsWithMedia = function(listingsMap, mediaMap) {
  if (!listingsMap) return listingsMap;
  const m = mediaMap || {};
  const resolve = ref => {
    if (typeof ref !== 'string' || !ref.startsWith(MEDIA_REF_PREFIX)) return ref;
    const mid = ref.slice(MEDIA_REF_PREFIX.length);
    const doc = m[mid];
    return (doc && doc.data) ? doc.data : ref;
  };
  Object.values(listingsMap).forEach(l => {
    if (!l) return;
    if (Array.isArray(l.images)) l.images = l.images.map(resolve);
    if (l.image) l.image = resolve(l.image);
    if (typeof l.description === 'string' && l.description.indexOf(MEDIA_REF_PREFIX) !== -1) {
      l.description = l.description.replace(/(["'])media:\/\/([^"']+)\1/g, (mtch, q, mid) => {
        const doc = m[mid];
        return doc && doc.data ? `${q}${doc.data}${q}` : mtch;
      });
    }
  });
  return listingsMap;
};

window.fsLoadListingsHydrated = async function() {
  const [listings, media] = await Promise.all([
    window.fsLoadMap('listings'),
    window.fsLoadMap('listing_media').catch(() => null)
  ]);
  if (!listings) return null;
  return window.hydrateListingsWithMedia(listings, media || {});
};

console.log('Firestore REST API ready');
