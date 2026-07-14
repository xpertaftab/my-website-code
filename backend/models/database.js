const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.db.run('PRAGMA foreign_keys = ON');
    this.createTables();
    this.save();
    return this.db;
  }

  save() {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Code Scripts',
        image TEXT,
        price REAL NOT NULL DEFAULT 15,
        oldPrice REAL DEFAULT 30,
        discount TEXT DEFAULT '-50%',
        badge TEXT DEFAULT '',
        badgeColor TEXT DEFAULT '',
        rating REAL DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        sold INTEGER DEFAULT 0,
        whatsappMsg TEXT,
        demoUrl TEXT DEFAULT '#',
        shortDesc TEXT,
        fullDesc TEXT,
        features TEXT,
        included TEXT,
        reviewsList TEXT,
        gallery TEXT,
        createdAt DATETIME DEFAULT (datetime('now')),
        updatedAt DATETIME DEFAULT (datetime('now'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        price REAL NOT NULL,
        location TEXT DEFAULT 'Pakistan',
        views INTEGER DEFAULT 0,
        image TEXT,
        stats TEXT,
        info TEXT,
        description TEXT,
        whatsapp TEXT,
        negotiable TEXT DEFAULT 'Yes',
        userId TEXT,
        createdAt DATETIME DEFAULT (datetime('now')),
        updatedAt DATETIME DEFAULT (datetime('now'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        excerpt TEXT,
        image TEXT,
        readTime TEXT DEFAULT '5 min read',
        date TEXT,
        content TEXT,
        status TEXT DEFAULT 'Published',
        authorName TEXT DEFAULT 'Aftab Malik',
        authorAvatar TEXT DEFAULT 'A',
        metaTitle TEXT,
        metaDesc TEXT,
        keywords TEXT,
        userId TEXT,
        createdAt DATETIME DEFAULT (datetime('now')),
        updatedAt DATETIME DEFAULT (datetime('now'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        listingId INTEGER,
        userId TEXT,
        buyerName TEXT,
        buyerEmail TEXT,
        buyerPhone TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        paymentMethod TEXT,
        paymentId TEXT,
        createdAt DATETIME DEFAULT (datetime('now'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        priority TEXT DEFAULT 'NORMAL',
        department TEXT DEFAULT 'GENERAL',
        whatsappCallback INTEGER DEFAULT 0,
        ndaRequested INTEGER DEFAULT 0,
        userId TEXT,
        read INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT (datetime('now'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        firebaseUid TEXT PRIMARY KEY,
        email TEXT,
        displayName TEXT,
        phone TEXT,
        photoURL TEXT,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT (datetime('now')),
        updatedAt DATETIME DEFAULT (datetime('now'))
      )
    `);
    this.save();
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
           }
      stmt.free();
      return results;
    } else {
      stmt.run(params);
      stmt.free();
      const lastId = this.db.exec("SELECT last_insert_rowid() as id");
      const changes = this.db.exec("SELECT changes() as changes");
      this.save();
      return {
        lastInsertRowid: lastId.length > 0 ? lastId[0].values[0][0] : null,
        changes: changes.length > 0 ? changes[0].values[0][0] : 0
      };
    }
  }

  get(sql, params = []) {
    const results = this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  run(sql, params = []) {
    return this.query(sql, params);
  }

  // Products
  getProducts() {
    return this.query('SELECT * FROM products ORDER BY sold DESC, rating DESC');
  }

  getProduct(id) {
    return this.get('SELECT * FROM products WHERE id = ?', [id]);
  }

  createProduct(data) {
    const result = this.run(`
      INSERT INTO products (title, category, image, price, oldPrice, discount, badge, badgeColor, rating, reviews, sold, whatsappMsg, demoUrl, shortDesc, fullDesc, features, included, reviewsList, gallery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title, data.category || 'Code Scripts', data.image || null, data.price, data.oldPrice || null,
      data.discount || null, data.badge || '', data.badgeColor || '', data.rating || 0,
      data.reviews || 0, data.sold || 0, data.whatsappMsg || null, data.demoUrl || '#',
      data.shortDesc || null, data.fullDesc || null,
      JSON.stringify(data.features || []), JSON.stringify(data.included || []),
      JSON.stringify(data.reviewsList || []), JSON.stringify(data.gallery || [])
    ]);
    return this.getProduct(result.lastInsertRowid);
  }

  updateProduct(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }
    if (fields.length === 0) return null;
    fields.push("updatedAt = datetime('now')");
    values.push(id);
    this.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getProduct(id);
  }

  deleteProduct(id) {
    this.run('DELETE FROM products WHERE id = ?', [id]);
  }

  // Listings
  getListings() {
    return this.query('SELECT * FROM listings ORDER BY createdAt DESC');
  }

  getListing(id) {
    return this.get('SELECT * FROM listings WHERE id = ?', [id]);
  }

  createListing(data) {
    const result = this.run(`
      INSERT INTO listings (title, category, status, price, location, image, stats, info, description, whatsapp, negotiable, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title, data.category, data.status || 'Active', data.price,
      data.location || 'Pakistan', data.image || null,
      JSON.stringify(data.stats || []), JSON.stringify(data.info || []),
      data.description || null, data.whatsapp || null, data.negotiable || 'Yes', data.userId || null
    ]);
    return this.getListing(result.lastInsertRowid);
  }

  deleteListing(id) {
    this.run('DELETE FROM listings WHERE id = ?', [id]);
  }

  // Blogs
  getBlogs() {
    return this.query("SELECT * FROM blogs WHERE status = 'Published' ORDER BY createdAt DESC");
  }

  getAllBlogs() {
    return this.query('SELECT * FROM blogs ORDER BY createdAt DESC');
  }

  getBlog(id) {
    return this.get('SELECT * FROM blogs WHERE id = ?', [id]);
  }

  createBlog(data) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const result = this.run(`
      INSERT INTO blogs (title, category, excerpt, image, readTime, date, content, status, authorName, authorAvatar, metaTitle, metaDesc, keywords, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title, data.category || 'General', data.excerpt || data.title,
      data.image || null, data.readTime || '5 min read', data.date || now,
      data.content || '', data.status || 'Published',
      data.authorName || 'Aftab Malik', data.authorAvatar || 'A',
      data.metaTitle || null, data.metaDesc || null, data.keywords || null,
      data.userId || null
    ]);
    return this.getBlog(result.lastInsertRowid);
  }

  updateBlog(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;
    fields.push("updatedAt = datetime('now')");
    values.push(id);
    this.run(`UPDATE blogs SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getBlog(id);
  }

  deleteBlog(id) {
    this.run('DELETE FROM blogs WHERE id = ?', [id]);
  }

  // Contacts
  createContact(data) {
    const result = this.run(`
      INSERT INTO contacts (name, email, subject, message, priority, department, whatsappCallback, ndaRequested, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name, data.email, data.subject || null, data.message,
      data.priority || 'NORMAL', data.department || 'GENERAL',
      data.whatsappCallback ? 1 : 0, data.ndaRequested ? 1 : 0,
      data.userId || null
    ]);
    return { id: result.lastInsertRowid, ...data };
  }

  getContacts() {
    return this.query('SELECT * FROM contacts ORDER BY createdAt DESC');
  }

  // Orders
  createOrder(data) {
    const result = this.run(`
      INSERT INTO orders (productId, listingId, userId, buyerName, buyerEmail, buyerPhone, amount, currency, status, paymentMethod, paymentId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.productId || null, data.listingId || null, data.userId || null,
      data.buyerName || null, data.buyerEmail || null, data.buyerPhone || null,
      data.amount, data.currency || 'USD', data.status || 'pending',
      data.paymentMethod || null, data.paymentId || null
    ]);
    return { id: result.lastInsertRowid, ...data };
  }

  getOrders() {
    return this.query('SELECT * FROM orders ORDER BY createdAt DESC');
  }

  getUserOrders(userId) {
    return this.query('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  }

  // Users
  upsertUser(user) {
    const existing = this.get('SELECT * FROM users WHERE firebaseUid = ?', [user.firebaseUid]);
    if (existing) {
      this.run("UPDATE users SET email = ?, displayName = ?, phone = ?, photoURL = ?, updatedAt = datetime('now') WHERE firebaseUid = ?",
        [user.email, user.displayName, user.phone, user.photoURL, user.firebaseUid]);
      return this.get('SELECT * FROM users WHERE firebaseUid = ?', [user.firebaseUid]);
    }
    this.run('INSERT INTO users (firebaseUid, email, displayName, phone, photoURL) VALUES (?, ?, ?, ?, ?)',
      [user.firebaseUid, user.email, user.displayName, user.phone, user.photoURL]);
    return this.get('SELECT * FROM users WHERE firebaseUid = ?', [user.firebaseUid]);
  }

  getUser(firebaseUid) {
    return this.get('SELECT * FROM users WHERE firebaseUid = ?', [firebaseUid]);
  }

  getAllUsers() {
    return this.query('SELECT * FROM users ORDER BY createdAt DESC');
  }

  getStats() {
    const productCount = this.get('SELECT COUNT(*) as count FROM products').count;
    const listingCount = this.get('SELECT COUNT(*) as count FROM listings').count;
    const blogCount = this.get('SELECT COUNT(*) as count FROM blogs').count;
    const orderCount = this.get('SELECT COUNT(*) as count FROM orders').count;
    const userCount = this.get('SELECT COUNT(*) as count FROM users').count;
    const contactCount = this.get('SELECT COUNT(*) as count FROM contacts').count;
    const totalRevenue = this.get("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'completed'").total;
    return { productCount, listingCount, blogCount, orderCount, userCount, contactCount, totalRevenue };
  }
}

module.exports = Database;
