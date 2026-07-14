const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.name || !data.email || !data.message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const contact = db.createContact(data);
    res.status(201).json(contact);
  });

  router.get('/', (req, res) => {
    const contacts = db.getContacts();
    res.json(contacts);
  });

  return router;
};
