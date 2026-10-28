import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { SERVICES, VEHICLE_TYPES, STATUSES, quote } from './pricing.js';

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';
const auth = (req, res, next) =>
  req.get('x-admin-key') === ADMIN_KEY ? next() : res.status(401).json({ error: 'Wrong password.' });

const parse = (b) => ({ ...b, services: JSON.parse(b.services) });

// ---------- Public ----------
app.get('/api/catalog', (_req, res) => res.json({ services: SERVICES, vehicleTypes: VEHICLE_TYPES }));

app.post('/api/quote', (req, res) => {
  const { services = [], vehicleType = 'sedan' } = req.body;
  res.json({ total: quote(services.filter((s) => SERVICES[s]), vehicleType) });
});

function createBooking(body, source) {
  const { name, phone, email, services, vehicleType, vehicle, plate, slot, notes } = body;
  const keys = (services || []).filter((s) => SERVICES[s]);
  if (!name?.trim() || !phone?.trim() || !keys.length || !(vehicleType in VEHICLE_TYPES))
    return { error: 'Name, phone, vehicle type and at least one service are required.' };
  db.prepare(`INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET name = excluded.name, email = COALESCE(excluded.email, email)`)
    .run(name.trim(), phone.trim(), email || null);
  const customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone.trim());
  const info = db.prepare(`INSERT INTO bookings (customer_id, services, vehicle_type, vehicle, plate, slot, total, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(customer.id, JSON.stringify(keys), vehicleType, vehicle || '', plate || '', slot || null,
      quote(keys, vehicleType), notes || '', source);
  return { id: Number(info.lastInsertRowid), total: quote(keys, vehicleType) };
}

app.post('/api/bookings', (req, res) => {
  const r = createBooking(req.body, 'online');
  r.error ? res.status(400).json(r) : res.status(201).json(r);
});

app.post('/api/login', auth, (_req, res) => res.json({ ok: true }));

// ---------- Staff ----------
const BOOKING_SQL = `SELECT b.*, c.name customer_name, c.phone customer_phone, s.name staff_name
  FROM bookings b JOIN customers c ON c.id = b.customer_id LEFT JOIN staff s ON s.id = b.staff_id`;

app.get('/api/admin/meta', auth, (_req, res) =>
  res.json({ statuses: STATUSES, staff: db.prepare('SELECT * FROM staff WHERE active = 1').all(), services: SERVICES, vehicleTypes: VEHICLE_TYPES }));

app.get('/api/admin/bookings', auth, (_req, res) =>
  res.json(db.prepare(`${BOOKING_SQL} ORDER BY b.created_at DESC`).all().map(parse)));

app.post('/api/admin/bookings', auth, (req, res) => {
  const r = createBooking(req.body, 'walk-in');
  r.error ? res.status(400).json(r) : res.status(201).json(r);
});

app.patch('/api/admin/bookings/:id', auth, (req, res) => {
  const { status, staffId } = req.body;
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
  let next = status ?? b.status;
  const staff = staffId === undefined ? b.staff_id : staffId || null;
  if (staffId && next === 'Pending') next = 'Assigned';
  db.prepare('UPDATE bookings SET status = ?, staff_id = ?, completed_at = ? WHERE id = ?')
    .run(next, staff, next === 'Completed' ? new Date().toISOString() : null, b.id);
  res.json(parse(db.prepare(`${BOOKING_SQL} WHERE b.id = ?`).get(b.id)));
});

app.get('/api/admin/customers', auth, (_req, res) => {
  const customers = db.prepare(`SELECT c.*, COUNT(b.id) visits, COALESCE(SUM(b.total), 0) spent
    FROM customers c LEFT JOIN bookings b ON b.customer_id = c.id GROUP BY c.id ORDER BY spent DESC`).all();
  const history = db.prepare('SELECT customer_id, vehicle, plate, services, status, total, slot, created_at FROM bookings ORDER BY created_at DESC').all();
  res.json(customers.map((c) => ({ ...c, bookings: history.filter((h) => h.customer_id === c.id).map(parse) })));
});

app.get('/api/admin/stats', auth, (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  res.json({
    bookingsToday: one('SELECT COUNT(*) n FROM bookings WHERE date(created_at) = ?', today).n,
    openJobs: one("SELECT COUNT(*) n FROM bookings WHERE status != 'Completed'").n,
    completedToday: one('SELECT COUNT(*) n FROM bookings WHERE date(completed_at) = ?', today).n,
    revenueToday: one('SELECT COALESCE(SUM(total), 0) n FROM bookings WHERE date(completed_at) = ?', today).n,
    revenueWeek: one("SELECT COALESCE(SUM(total), 0) n FROM bookings WHERE date(completed_at) >= date('now', '-6 days')").n,
    staffLoad: db.prepare(`SELECT s.name, COUNT(b.id) jobs FROM staff s
      LEFT JOIN bookings b ON b.staff_id = s.id AND b.status NOT IN ('Completed', 'Pending')
      WHERE s.active = 1 GROUP BY s.id`).all(),
  });
});

const dist = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Redline API on http://localhost:${port}`));
