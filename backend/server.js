require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./models/database');
const { initFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// Initialize Firebase
initFirebase();

// Initialize Database
const db = new Database(path.join(__dirname, 'data', 'database.sqlite'));

async function startServer() {
  await db.init();
  console.log('Database initialized');

  // Mount Routes
  app.use('/api/products', require('./routes/products')(db));
  app.use('/api/listings', require('./routes/listings')(db));
  app.use('/api/blogs', require('./routes/blogs')(db));
  app.use('/api/contact', require('./routes/contact')(db));
  app.use('/api/orders', require('./routes/orders')(db));
  app.use('/api/users', require('./routes/users')(db));
  app.use('/api/dashboard', require('./routes/dashboard')(db));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  app.listen(PORT, () => {
    console.log(`Vextro Lyntra API server running on http://localhost:${PORT}`);
    console.log(`Frontend served at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
