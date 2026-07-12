# TransitOps — Frontend

A React (Vite) single-page app for the TransitOps fleet operations platform. Fully demoable
standalone against in-memory mock data — every API call tries the live backend first
(`http://localhost:5000/api`) and transparently falls back to a mock store on a network error.

## Design direction

A "fleet dispatch console" aesthetic rather than a generic admin-panel template:

- **Sidebar** is a dark control-tower console (`#171A20`) with an orange dispatch-signal accent.
- **Content area** sits on a warm paper background with a fine dot-grid, evoking a planning table.
- **Manifest rows** — the signature element — are perforated ticket-style cards with a colored
  left rail that mirrors real cargo manifest slips, used for trips and maintenance records.
- **Status colors are semantic and consistent everywhere**: green = Available/Completed,
  amber = On Trip/hold, blue = In Shop/Dispatched-in-transit, red = Retired/Suspended/Cancelled.
- **Type**: Space Grotesk (display), Inter (body), JetBrains Mono (registration numbers,
  license numbers, IDs, timestamps — anything that reads like a data field).

> Note: the Excalidraw mockup link in the brief renders on an interactive canvas that can't be
> fetched by an automated tool, so this UI is an original interpretation of the spec rather than
> a pixel copy of that board. If you can export the board as PNG/PDF, share it and the layout can
> be tightened to match it exactly.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Works immediately with **no backend** running (mock mode). Demo login is pre-filled on the
login screen: `raven.k@transitops.in` / `demo1234`, any role.

To use the real API, start `../backend` on port 5000 — every request will start hitting it
automatically, no frontend code changes needed.

## Structure

```
src/
├── api/            fetch wrapper + one module per resource, each with a mock fallback
├── context/         AuthContext (session), ToastContext (notifications)
├── permissions.js   RBAC matrix (mirrors backend's role checks — UI-only, not a security boundary)
├── components/      Layout (sidebar/topbar), StatusBadge, RouteGuards, shared ui.jsx primitives
└── pages/           one file per route: Login, Dashboard, VehicleRegistry, Drivers, Trips,
                      Maintenance, FuelExpenses, Analytics, Settings
```

## Contract compliance

This frontend matches `../backend`'s API & Data Contract exactly: snake_case JSON, the
`/available` endpoints for Trip dropdowns (never `/vehicles` or `/drivers` directly), and
client-side capacity/status checks that mirror — but never replace — server-side validation.
