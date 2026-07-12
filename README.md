# TransitOps — Smart Transport Operations Platform

Two independent, separately-deployable projects:

```
TransitOps/
├── backend/     Node/Express + SQLite API — http://localhost:5000
└── frontend/    React (Vite) SPA — http://localhost:3000
```

They talk to each other only over HTTP (`fetch`), per the API contract in
`backend/BACKEND_HANDOFF.md`. The frontend also runs fully standalone against mock data if the
backend isn't running.

## Quick start

**Backend**
```bash
cd backend
npm install
cp .env.example .env    # set JWT_SECRET etc.
npm run dev              # http://localhost:5000
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

Open `http://localhost:3000`. Demo login: `raven.k@transitops.in` / `demo1234` (works in
mock mode even without the backend running).

## What's implemented against the spec PDF

- Email/password auth with RBAC (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
- Dashboard KPIs (active/available/in-maintenance vehicles, active/pending trips, drivers on
  duty, fleet utilization %) with type/status/region filters
- Vehicle Registry: unique reg. number, CRUD, status lifecycle
- Driver Management: profiles, license expiry tracking, safety score, status lifecycle
- Trip Management: Draft → Dispatched → Completed → Cancelled, with capacity and
  availability validation mirrored client-side and enforced server-side
- Maintenance: opening a record moves a vehicle to In Shop immediately; closing restores it
  unless Retired
- Fuel & Expense logging with automatic per-vehicle operational cost roll-up
- Reports & Analytics: fuel efficiency, fleet utilization, operational cost, ROI, CSV export
- Settings & RBAC matrix view

## Known gaps flagged in the original handoff (not blockers, just disclosed)

- `revenue` isn't captured per trip/vehicle anywhere in the schema, so ROI currently assumes
  revenue = 0 until that's added — see `backend/BACKEND_HANDOFF.md` §9.
- `GET /api/reports/monthly-revenue` isn't a contracted endpoint yet; the frontend calls it and
  falls back to a derived mock series if the backend 404s.
- PDF export, email reminders for expiring licenses, and vehicle document management are the
  spec's bonus items and are not built — CSV export, in-app expiry warnings, and dark sidebar
  console are the equivalents that are shipped.

## About the mockup link

The Excalidraw board referenced in the PDF (`app.excalidraw.com/l/...`) is an interactive canvas
that can't be rendered by a fetch — so the UI here is an original design pass against the written
spec (see `frontend/README.md` for the design rationale) rather than a literal trace of that
board. Export it as an image/PDF and it can be matched more precisely on a follow-up pass.
