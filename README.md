# Camera Mobile Zone — Admin Panel

React (JavaScript, no TypeScript) + Tailwind CSS admin panel for the
Camera Mobile Zone backend. Covers every admin-facing feature the backend
exposes.

## Stack

- **Vite** + **React 18** (plain JS/JSX, no TypeScript)
- **Tailwind CSS** — color palette centralized in `src/colors.js` and
  wired into `tailwind.config.js` (`bg-accent`, `text-ink`, `border-line`,
  `bg-panel`, `bg-verify`, etc.)
- **React Router v6** for routing
- **axios** for API calls, with automatic access-token refresh via httpOnly
  cookies (no tokens stored in localStorage/JS)
- **lucide-react** for icons
- No UI kit — every component (Modal, DataTable, Badge, ImageUploader,
  Toast, etc.) is hand-built in `src/components/common/`

## Quick start

```bash
cp .env.example .env
# set VITE_API_BASE_URL to your backend's /api/v1 URL

npm install
npm run dev      # http://localhost:5178
```

Log in with the seeded backend admin:

```
email:    work.abhishek031@gmail.com
password: Abhishek@123
```

## Backend requirement

This admin panel expects the Camera Mobile Zone backend (separate
project/zip) to be running and reachable at `VITE_API_BASE_URL`. The
backend's `ADMIN_FRONTEND_URL` env var must match wherever this panel is
served from (default `http://localhost:5178`) for CORS + cookies to work.
This was verified end-to-end: preflight requests, credentialed cookies, and
login all confirmed working against a live backend instance during
development.

## What's covered

Every backend admin resource has a full page:

- **Dashboard** — revenue, order counts, orders-by-status, attention items
- **Orders** — list + filters, detail page with items/payments/status
  history/delivery editing, guided status updates enforcing the "payment
  must be verified before fulfillment" rule
- **Payments** — verification queue, screenshot preview, verify/reject with
  reason
- **Deliveries** — courier/tracking overview
- **Products** — full catalog CRUD, tabbed editor (Details / Images /
  Specs / Inspection Report), drag-free reordering via arrow buttons,
  multi-image upload
- **Categories** — the 4 fixed top-level categories + Accessories-only
  sub-categories, with icon/banner image upload
- **Brands** — full CRUD with logo upload
- **Reviews** — approve/hide/delete
- **Curated Lists** — Trending, Deals of the Week (with countdown
  settings), Recently Added — each with a searchable product picker and
  reorder controls
- **Users** — list/search, detail page with recent orders,
  activate/deactivate
- **Deliverable Pincodes** — single add, bulk add (CSV-style textarea),
  toggle deliverability
- **Contact Messages** — filter by reason/resolved, mark resolved
- **Newsletter** — subscriber list
- **Site Content** — Testimonials, FAQs, Hero Banners (image + active
  toggle only, per the final schema)
- **Settings** — admin profile, change password (logs out all sessions)

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```
# admin-panel-camermobilezone
