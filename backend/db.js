const Database = require('better-sqlite3');
const db = new Database('transitops.db');

db.pragma('foreign_keys = ON');

// ---- USERS ----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Fleet Manager','Dispatcher','Safety Officer','Financial Analyst'))
);
`);

// ---- VEHICLES ----
db.exec(`
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reg_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  max_load REAL NOT NULL,
  odometer REAL DEFAULT 0,
  acquisition_cost REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','In Shop','Retired'))
);
`);

// ---- DRIVERS ----
db.exec(`
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_category TEXT,
  license_expiry TEXT NOT NULL,
  contact TEXT,
  safety_score REAL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','Off Duty','Suspended'))
);
`);

// ---- TRIPS (schema owned jointly; Person B writes the route logic) ----
db.exec(`
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  cargo_weight REAL NOT NULL,
  planned_distance REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
  final_odometer REAL,
  fuel_consumed REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ---- MAINTENANCE ----
db.exec(`
CREATE TABLE IF NOT EXISTS maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Closed')),
  cost REAL DEFAULT 0,
  date TEXT NOT NULL
);
`);

// ---- FUEL LOGS ----
db.exec(`
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  liters REAL NOT NULL,
  cost REAL NOT NULL,
  date TEXT NOT NULL
);
`);

// ---- EXPENSES ----
db.exec(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL
);
`);

module.exports = db;
