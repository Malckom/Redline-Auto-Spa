# Redline Auto Spa

Driven by Perfection. Booking site and staff dashboard for a manual car care business.

- `frontend/` React, Vite, Tailwind. Landing page at `/`, staff dashboard at `/staff`.
- `backend/` Express and SQLite (`better-sqlite3`). The database file is created on first run.

## Run locally
Requires Node 20+.
```bash
npm run install:all
cp backend/.env.example backend/.env   # set ADMIN_KEY (the staff password)
npm run dev
```
Site: http://localhost:5173 and API: http://localhost:4000

## Production
```bash
npm run build && npm start   # serve frontend/dist behind nginx, proxy /api to port 4000
```
Edit prices in `backend/src/pricing.js`.
