const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const order = db.createOrder(data);
    res.status(201).json(order);
  });

  router.get('/', (req, res) => {
    const orders = db.getOrders();
    res.json(orders);
  });

  router.get('/user/:userId', (req, res) => {
    const orders = db.getUserOrders(req.params.userId);
    res.json(orders);
  });

  return router;
};
