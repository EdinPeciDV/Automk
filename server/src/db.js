const { open } = require('sqlite');
const sqlite3  = require('sqlite3');
const path     = require('path');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || './automk.db');

let _db = null;

async function getDb() {
  if (_db) return _db;
  _db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await _db.exec('PRAGMA journal_mode = WAL');
  await _db.exec('PRAGMA foreign_keys = ON');
  await _db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      logo TEXT NOT NULL,
      country TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cars (
      id           TEXT PRIMARY KEY,
      brand_slug   TEXT NOT NULL,
      brand        TEXT NOT NULL,
      model        TEXT NOT NULL,
      type         TEXT NOT NULL,
      year         INTEGER NOT NULL,
      km           INTEGER NOT NULL,
      price        REAL NOT NULL,
      currency     TEXT DEFAULT 'EUR',
      fuel         TEXT NOT NULL,
      transmission TEXT NOT NULL,
      hp           INTEGER,
      acceleration TEXT,
      top_speed    TEXT,
      colour       TEXT,
      status       TEXT NOT NULL DEFAULT 'available',
      arrival_date TEXT,
      featured     INTEGER DEFAULT 0,
      description  TEXT,
      images       TEXT DEFAULT '[]',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS model_brand_map (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      model_pattern TEXT NOT NULL,
      brand_slug    TEXT NOT NULL,
      brand_name    TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT,
      phone        TEXT,
      email        TEXT,
      car_id       TEXT,
      preferred_car TEXT,
      date         TEXT,
      brands       TEXT,
      types        TEXT,
      budget_min   REAL,
      budget_max   REAL,
      max_km       INTEGER,
      year_from    INTEGER,
      year_to      INTEGER,
      transmission TEXT,
      fuel         TEXT,
      notes        TEXT,
      whatsapp     INTEGER DEFAULT 0,
      source       TEXT DEFAULT 'website',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return _db;
}

module.exports = { getDb };
