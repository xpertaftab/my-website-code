const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.post('/sync', (req, res) => {
    const user = req.body;
    if (!user || !user.firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }
    const synced = db.upsertUser(user);
    res.json(synced);
  });

  router.get('/:uid', (req, res) => {
    const user = db.getUser(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  router.get('/', (req, res) => {
    const users = db.getAllUsers();
    res.json(users);
  });

  return router;
};
