const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', (req, res) => {
    const blogs = db.getBlogs();
    res.json(blogs);
  });

  router.get('/all', (req, res) => {
    const blogs = db.getAllBlogs();
    res.json(blogs);
  });

  router.get('/:id', (req, res) => {
    const blog = db.getBlog(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  });

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const blog = db.createBlog(data);
    res.status(201).json(blog);
  });

  router.put('/:id', (req, res) => {
    const blog = db.updateBlog(req.params.id, req.body);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  });

  router.delete('/:id', (req, res) => {
    db.deleteBlog(req.params.id);
    res.json({ success: true });
  });

  return router;
};
