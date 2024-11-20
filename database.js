const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./ItemStoreDB.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user', -- Role: 'user' or 'admin'
    is_locked INTEGER DEFAULT 0, -- Account lock status: 0 (unlocked), 1 (locked)
    failed_attempts INTEGER DEFAULT 0 -- Number of failed login attempts
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    quantity INTEGER,
    user_id INTEGER,  -- Associate items with a user
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
