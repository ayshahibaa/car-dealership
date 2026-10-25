# Autoza: used-car marketplace

Autoza is a full-stack used-car marketplace: a **React 19 / Vite 7 / Tailwind CSS 4 /
React Router 7** frontend backed by a real **Node.js / Express / Prisma / PostgreSQL**
API (in `backend/`). Browsing reads a curated local dataset (686 cars); listing a car,
buying one, authentication, favourites/cart persistence, and admin moderation are all
real, backend-backed features.

> This is a portfolio project. Vehicle images are illustrations rather than photos, and
> the inventory browse/search/filter pages read a fixed sample dataset by design — real
> listings submitted through "Sell your car" show up in the homepage's "Newly listed by
> our community" section once an admin approves them (see below).

## How the marketplace works

- **Buying is a request, not an instant purchase.** "Request to buy" files a
  `PurchaseRequest`; an admin approving it is what actually decrements stock. Buyers
  track every request's outcome on `/orders` and `/orders/:id`.
- **Selling needs approval.** A submitted listing starts `pending` and is invisible to
  the public until an admin approves it from `/admin`.
- **Admin is a separate sign-in.** `/admin/login` uses the same accounts but verifies
  the `ADMIN` role (there's no self-serve admin signup — promote a user's `role` to
  `ADMIN` directly in the database). The admin dashboard approves/rejects listings,
  approves/rejects purchase requests, and can restock or delete any vehicle.
- **Favourites and cart** are per-account (and work for signed-out visitors too),
  persisted in the browser.

## Run it

You need **Node.js 20.19 or newer**. Check your version with `node -v`. The frontend and
backend run as two separate processes.

```bash
npm install        # frontend deps — first time only
npm run dev        # starts the frontend at http://localhost:5173
```

In a second terminal, for the API:

```bash
cd backend
npm install                          # also runs `prisma generate`
cp .env.example .env                 # fill in DATABASE_URL and JWT_SECRET
npx prisma db push                   # creates/syncs the schema
npm run prisma:seed                  # loads the 686-car dataset
npm run dev                          # starts the API at http://localhost:4000
```

See [`backend/README.md`](backend/README.md) for backend-specific details, and
[`docs/tdd-git-workflow.md`](docs/tdd-git-workflow.md) for how this repo's commit
history is structured.

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run check:data` | Validates every record in `src/data/cars.json` |

## Project structure

```
public/
  brand/                  Autoza logo files (SVG)
  images/cars/illustrations/   vehicle illustrations (body type × colour)
src/
  config/appConfig.js     brand + regional settings (currency, units, locale)
  data/cars.json          cleaned inventory (686 cars)
  data/loadInventory.js   the only module that reads cars.json
  services/carService.js  data API — reads cars.json for browsing, calls the
                           real backend for auth, listing, buying and admin actions
  services/filterCars.js  search / filter / sort / paginate rules
  services/apiClient.js   the one place that talks to the backend
  hooks/useAsync.js       loading / error / data state for async calls
  context/                AuthContext, FavoritesContext, CartContext, CompareContext
  utils/                  formatCurrency, formatMileage, validateCar
  components/admin/       admin dashboard sections (pending listings/requests)
  components/auth/        RequireAuth / RequireAdmin route guards
  components/brand/       Logo
  components/layout/      AppLayout, Navbar, Footer, PageContainer
  components/common/      Loader, ErrorMessage, SuccessMessage, EmptyState, ...
  components/cars/        CarCard, PurchaseButton, ...
  pages/                  Home, Inventory, CarDetails, Favorites, Cart, Orders,
                           SellCar, Login/Register, AdminLogin, AdminDashboard, ...
  styles/global.css       Tailwind import + Autoza design tokens
backend/
  prisma/schema.prisma    User, Vehicle, PurchaseRequest models
  src/auth/               registration, login, password hashing, JWT
  src/vehicles/           vehicle CRUD, search, stock, approval workflow
  src/purchaseRequests/   buyer requests + admin approve/reject
  src/routes/             one Express router per resource
  test/                   Vitest + Supertest, one spec file per slice
data/
  cleaning/               scripts that produced cars.json and the illustrations
  dataset/                raw source CSV (never modified)
  reports/                data quality report, change log, excluded records
docs/
  data-schema.md          field-by-field schema and validation rules
  tdd-git-workflow.md     how this repo's commit history is structured
```

## Regional settings

All regional settings live in `src/config/appConfig.js`:

- **Currency:** set `region.currency` (e.g. `'EUR'`) and `region.exchangeRateFromData` (the rate from the stored USD prices).
- **Distance unit:** set `region.distanceUnit` to `'km'`. Mileage is converted for display.
- **Number and date formatting:** set `region.locale` (e.g. `'en-GB'`, `'de-DE'`).

## Features

- [x] Inventory browsing: search, filters, sort, pagination, comparison
- [x] Vehicle details, favourites, cart (per-account, persisted)
- [x] Authentication (register/login), JWT-based
- [x] Sell your car → pending admin approval → public once approved
- [x] Request to buy → pending admin approval → stock decrements only on approval
- [x] My orders / order receipt pages
- [x] Admin dashboard: approve/reject listings, approve/reject purchase requests, restock, delete
- [x] Separate admin sign-in (`/admin/login`)

## My AI Usage

I used **Claude Code** (Anthropic's agentic CLI, running on the Claude Sonnet 5 model)
as my primary AI pair-programmer for this project, across the full stack. Specifically:

- **Scaffolding both halves of the app.** I asked Claude Code to set up the React/Vite/
  Tailwind frontend and, separately, the Express/Prisma/PostgreSQL backend (app factory
  pattern, `prisma/schema.prisma`, the `User`/`Vehicle` models, the seed script that
  migrates the cleaned dataset into Postgres).
- **Designing and implementing backend features test-first.** For each backend slice
  (auth, vehicle CRUD, purchase/restock, the vehicle-approval workflow, the
  purchase-request workflow) I had Claude Code write the Vitest/Supertest specs against
  an in-memory fake repository first, then the service/repository/router implementation
  to make them pass — the same pattern already established in `backend/README.md`'s
  Red→Green→Refactor description, which Claude Code continued rather than reinvented.
- **Designing the data model changes.** I asked Claude Code to figure out how to add
  seller-approval and buyer-request-approval to the existing schema without breaking the
  686 already-seeded vehicles — it chose a `approvalStatus` column defaulting to
  `"approved"` (so the migration auto-backfills existing inventory) and a new
  `PurchaseRequest` model, explaining the tradeoff before implementing it.
- **Debugging.** I asked Claude Code to diagnose why "Buy now" looked like it always
  failed with "sold out" (it was actually succeeding, but showing the same disabled
  label as a genuinely sold-out car) and why favourites/cart leaked between accounts on
  the same browser (a fixed localStorage key instead of one scoped per signed-in user).
  Both were root-caused and fixed, not just patched around.
- **Building and wiring the frontend features**: the cart/favourites/compare contexts,
  the expanded "sell your car" form (to cover the Vehicle table's columns), the admin
  dashboard's pending-listings and pending-purchase-requests sections, the separate
  admin login page, and the "My orders" / order-receipt pages.
- **End-to-end verification.** Claude Code used its own browser-automation tool to
  register test accounts, submit listings, approve/reject them as an admin, send and
  approve/reject purchase requests, and confirm the UI reflected each state correctly —
  catching real bugs (like the account-leakage one above) that static review wouldn't have.
- **This documentation** — the "My AI Usage" section you're reading, and
  [`docs/tdd-git-workflow.md`](docs/tdd-git-workflow.md) — was also drafted by Claude Code,
  describing the process it had just used.

Every commit where Claude Code generated or materially shaped the content (code, tests,
docs, or commit messages) credits it as a co-author via a `Co-Authored-By` trailer — see
`docs/tdd-git-workflow.md` for the exact convention.
