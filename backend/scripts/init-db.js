require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('../models/database');

async function initDb() {
  const db = new Database(path.join(__dirname, '..', 'data', 'database.sqlite'));
  await db.init();
  console.log('Database initialized');

  // Seed blogs
  const blogsPath = path.join(__dirname, '..', '..', 'data', 'blogs.json');
  if (fs.existsSync(blogsPath)) {
    const seedData = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
    for (const b of seedData) {
      const existing = db.get('SELECT id FROM blogs WHERE id = ?', [b.id]);
      if (!existing) {
        db.run(`INSERT INTO blogs (id, title, category, excerpt, image, readTime, date, status, authorName, authorAvatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.title, b.category, b.excerpt, b.image, b.readTime, b.date, 'Published', 'Aftab Malik', 'A']);
      }
    }
    console.log(`Seeded ${seedData.length} blogs`);
  }

  // Seed products
  const products = [
    { id: 1, title: 'Pattern Generator Tool Script - Ready to Deploy | AdSense Approval Code Script', category: 'Code Scripts', price: 15, oldPrice: 30, discount: '-50%', badge: 'Featured', badgeColor: '#6366f1', rating: 0, reviews: 0, sold: 0, whatsappMsg: 'Hi! I want to buy Pattern Generator Tool Script for USD 15. Please guide me.', shortDesc: 'A powerful, ready-to-deploy Pattern Generator Tool Script perfect for getting AdSense approval.', features: ['100% AdSense Approved Structure', 'Mobile Responsive', 'Fast Loading', 'Easy Customization', 'Clean Code', 'Premium UI Design'], included: ['Full Source Code (HTML, CSS, JS)', 'Installation Guide (PDF)', '1 Year Free Updates', '30-Day WhatsApp Support', 'Commercial License', 'SEO Optimized Structure'] },
    { id: 2, title: 'Unit-Converter Tool - Ready to Deploy Tool Script | AdSense Ready', category: 'Code Scripts', price: 15, oldPrice: 30, discount: '-50%', badge: 'Bestseller', badgeColor: '#f97316', rating: 5, reviews: 1, sold: 1, whatsappMsg: 'Hi! I want to buy Unit-Converter Tool Script for USD 15. Please guide me.', shortDesc: 'The #1 bestselling Unit Converter Tool Script. AdSense-ready, lightning fast.', features: ['50+ Unit Conversion Categories', '100% AdSense Approved', 'Mobile Responsive', 'Blazing Fast', 'Real-time Conversion', 'Premium Dark & Light Mode'], included: ['Full Source Code', 'Installation Guide', '1 Year Updates', '30-Day Support', 'Commercial License', 'SEO Structure'] },
    { id: 3, title: 'Finance Calculator - AdSense Approval Code Script (18+ Tools Inside)', category: 'AdSense', price: 15, oldPrice: 35, discount: '-57%', badge: '', badgeColor: '', rating: 5, reviews: 1, sold: 2, whatsappMsg: 'Hi! I want to buy Finance Calculator Script for USD 15.', shortDesc: '18+ finance calculator tools in ONE script! EMI, loan, profit, tax calculator.', features: ['18+ Tools: EMI, Loan, Profit, Tax, SIP', 'High CPC Keywords', '100% AdSense Compliant', 'Mobile First Design', 'Fast Loading', 'Clean UI Design'], included: ['18+ Finance Calculator Tools', 'Full Source Code', 'Installation Guide', '1 Year Free Updates', '30-Day WhatsApp Support', 'Commercial License'] },
    { id: 4, title: 'All In One Downloader Tool Code Script | Ready to Live Deploy', category: 'Tools & Software', price: 15, oldPrice: 30, discount: '-50%', badge: '', badgeColor: '', rating: 0, reviews: 0, sold: 3, whatsappMsg: 'Hi! I want to buy All In One Downloader Tool Script for USD 15.', shortDesc: 'Ultimate All-In-One Downloader Tool. Download from 100+ platforms.', features: ['100+ Platform Support', 'Massive Traffic Potential', 'Mobile Responsive', 'AdSense Ready', 'Easy API Integration', 'Clean Modern UI'], included: ['All-In-One Downloader Script', 'Full Source Code', 'Backend API Integration Guide', 'Installation Guide', '30-Day WhatsApp Support', 'Commercial License'] }
  ];

  for (const p of products) {
    const existing = db.get('SELECT id FROM products WHERE id = ?', [p.id]);
    if (!existing) {
      db.run(`INSERT INTO products (id, title, category, price, oldPrice, discount, badge, badgeColor, rating, reviews, sold, whatsappMsg, shortDesc, features, included) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.title, p.category, p.price, p.oldPrice, p.discount, p.badge, p.badgeColor, p.rating, p.reviews, p.sold, p.whatsappMsg, p.shortDesc, JSON.stringify(p.features), JSON.stringify(p.included)]);
    }
  }
  console.log(`Seeded ${products.length} products`);

  // Seed listings
  const listings = [
    { id: 1, title: 'Movies Downloading Portal - AdSense Active', category: 'Website', status: 'Active', price: 99, location: 'Pakistan' },
    { id: 2, title: '2023 Old Non Verified Play Console Account', category: 'Play Console', status: 'Sold', price: 2000, location: 'India' },
    { id: 3, title: '2019 Organization Google Play Console Account', category: 'Play Console', status: 'Active', price: 2200, location: 'India' },
    { id: 4, title: '2019 Old Age Google AdSense Account', category: 'Other', status: 'Active', price: 1200, location: 'India' },
    { id: 5, title: '2025 Organization Play Console - 2 Apps', category: 'Play Console', status: 'Active', price: 600, location: 'India' },
    { id: 6, title: '2026 Personal Google Play Console - 1 App', category: 'Play Console', status: 'Active', price: 500, location: 'India' }
  ];

  for (const l of listings) {
    const existing = db.get('SELECT id FROM listings WHERE id = ?', [l.id]);
    if (!existing) {
      db.run('INSERT INTO listings (id, title, category, status, price, location) VALUES (?, ?, ?, ?, ?, ?)',
        [l.id, l.title, l.category, l.status, l.price, l.location]);
    }
  }
  console.log(`Seeded ${listings.length} listings`);

  console.log('Database seed completed!');
  process.exit(0);
}

initDb().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
