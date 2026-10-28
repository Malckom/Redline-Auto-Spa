import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

export const db = new DatabaseSync(process.env.DB_PATH || fileURLToPath(new URL('../redline.db', import.meta.url)));db.exec('PRAGMA journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id),
  services TEXT NOT NULL, vehicle_type TEXT NOT NULL, vehicle TEXT, plate TEXT,
  slot TEXT, status TEXT NOT NULL DEFAULT 'Pending', staff_id INTEGER REFERENCES staff(id),
  total INTEGER NOT NULL, notes TEXT, source TEXT DEFAULT 'online',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, completed_at TEXT);
`);
if (!db.prepare('SELECT COUNT(*) c FROM staff').get().c) {
  const ins = db.prepare('INSERT INTO staff (name) VALUES (?)');
  ['Staff 1', 'Staff 2', 'Staff 3'].forEach((n) => ins.run(n));
}
