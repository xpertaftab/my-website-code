const { admin } = require('../config/firebase');

function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  if (!admin.apps.length) {
    req.user = null;
    return next();
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      next();
    })
    .catch(error => {
      console.error('Token verification failed:', error.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  if (!admin.apps.length) {
    req.user = null;
    return next();
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      next();
    })
    .catch(() => {
      req.user = null;
      next();
    });
}

module.exports = { verifyFirebaseToken, optionalAuth };
