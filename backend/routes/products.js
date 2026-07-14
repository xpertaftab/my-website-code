const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', (req, res) => {
    const products = db.getProducts();
    const parsed = products.map(p => ({
      ...p,
      features: safeParse(p.features, []),
      included: safeParse(p.included, []),
      reviewsList: safeParse(p.reviewsList, [])
    }));
    res.json(parsed);
  });

  router.get('/:id', (req, res) => {
    const p = db.getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    p.features = safeParse(p.features, []);
    p.included = safeParse(p.included, []);
    p.reviewsList = safeParse(p.reviewsList, []);
    res.json(p);
  });

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.title || !data.price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }
    const product = db.createProduct(data);
    res.status(201).json(product);
  });

  router.put('/:id', (req, res) => {
    const product = db.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  router.delete('/:id', (req, res) => {
    db.deleteProduct(req.params.id);
    res.json({ success: true });
  });

  return router;
};

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
