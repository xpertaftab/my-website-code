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
    const res = await fetch(`${FB_BASE}/${collectionName}?key=${FB_API_KEY}`);
    if (!res.ok) {
      if (res.status === 404) console.warn('FS: Firestore database not found - enable it in Firebase Console');
      return null;
    }
    const data = await res.json();
    if (!data.documents || data.documents.length === 0) return null;
    const map = {};
    const seenInnerIds = {};
    data.documents.forEach(doc => {
      const obj = docToObj(doc);
      // Firestore doc key = last URL segment of doc.name
      const docKey = (doc.name || '').split('/').pop();
      // Dedupe: if the same logical id appears under multiple doc keys
      // (legacy bug wrote numeric-keyed duplicates), keep the one whose
      // doc key matches obj.id and delete the stray.
      const innerId = obj.id || docKey;
      if (seenInnerIds[innerId]) {
        const prev = seenInnerIds[innerId];
        const stray = prev.docKey === innerId ? docKey : prev.docKey;
        if (window.fsDeleteDoc && stray && stray !== innerId) {
          try { window.fsDeleteDoc(collectionName, stray); } catch(e) {}
        }
        if (prev.docKey !== innerId && docKey === innerId) {
          delete map[prev.docKey];
          map[docKey] = obj;
          seenInnerIds[innerId] = { docKey };
        }
        return;
      }
      seenInnerIds[innerId] = { docKey };
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
  if (!collectionName || !id || !data) return false;
  try {
    const clean = { ...data };
    delete clean.id;
    const res = await fetch(`${FB_BASE}/${collectionName}/${id}?key=${FB_API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: objToFields(clean) })
    });
    if (!res.ok && res.status === 404) {
      await fetch(`${FB_BASE}/${collectionName}?documentId=${id}&key=${FB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: objToFields(clean) })
      });
    }
    return true;
  } catch(e) {
    console.warn('FS: set', collectionName, id, 'failed', e.message);
    return false;
  }
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

console.log('Firestore REST API ready');
