#!/usr/bin/env node
/**
 * Firestore se users download karke data/users.json bana deta hai.
 *
 * Usage (CMD / Terminal, project folder ke andar):
 *   node scripts/export-users.mjs admin@email.com yourPassword
 *
 * Output: data/users.json  (wahi format jo admin panel ka "Import JSON" leta hai)
 */

const API_KEY = 'AIzaSyAvlaKbCKqv1Z_sYAFhmmn-un2hYiWXEPc';
const PROJECT_ID = 'vextro-lyntra';
const COLLECTION = process.env.COLLECTION || 'users';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/export-users.mjs <admin-email> <password>');
  process.exit(1);
}

function unwrap(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(unwrap);
  if ('mapValue' in v) return unwrapFields(v.mapValue.fields || {});
  return null;
}
function unwrapFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = unwrap(v);
  return out;
}

const signIn = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  }
);
const auth = await signIn.json();
if (!auth.idToken) {
  console.error('Login failed:', auth.error?.message || JSON.stringify(auth));
  process.exit(1);
}

const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;
let pageToken = '';
const users = [];

do {
  const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.idToken}` } });
  const json = await res.json();
  if (json.error) {
    console.error('Firestore error:', json.error.message);
    process.exit(1);
  }
  for (const doc of json.documents || []) {
    const rec = unwrapFields(doc.fields || {});
    rec.uid = rec.uid || doc.name.split('/').pop();
    users.push(rec);
  }
  pageToken = json.nextPageToken || '';
} while (pageToken);

const fs = await import('node:fs/promises');
await fs.mkdir('data', { recursive: true });
await fs.writeFile('data/users.json', JSON.stringify(users, null, 2));
console.log(`${users.length} users saved to data/users.json`);
