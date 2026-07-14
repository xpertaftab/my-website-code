const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', (req, res) => {
    const stats = db.getStats();
    res.json(stats);
  });

  return router;
};
