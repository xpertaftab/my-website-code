const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', (req, res) => {
    const listings = db.getListings();
    const parsed = listings.map(l => ({
      ...l,
      stats: safeParse(l.stats, []),
      info: safeParse(l.info, [])
    }));
    res.json(parsed);
  });

  router.get('/:id', (req, res) => {
    const l = db.getListing(req.params.id);
    if (!l) return res.status(404).json({ error: 'Listing not found' });
    l.stats = safeParse(l.stats, []);
    l.info = safeParse(l.info, []);
    res.json(l);
  });

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.title || !data.price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }
    const listing = db.createListing(data);
    res.status(201).json(listing);
  });

  router.delete('/:id', (req, res) => {
    db.deleteListing(req.params.id);
    res.json({ success: true });
  });

  return router;
};

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
