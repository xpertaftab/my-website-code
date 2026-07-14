const admin = require('firebase-admin');

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'vextro-lyntra';
  
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized with service account');
  } else {
    admin.initializeApp({ projectId });
    console.log('Firebase Admin initialized with default credentials (no token verification)');
  }
  return admin;
}

module.exports = { initFirebase, admin };
