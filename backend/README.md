# Autoza backend — car dealership inventory API

Node.js + TypeScript + Express + Prisma + PostgreSQL, built test-first (Vitest + Supertest).
This folder is separate from the frontend (`../src`) — the two deploy as separate pieces on Vercel.

## Status

Complete: auth (register/login, JWT), vehicle CRUD and search, the
"sell your car" approval workflow (a listing stays `pending` until an admin
approves it), and the "buy" approval workflow (a `PurchaseRequest` only
decrements stock once an admin approves it — see `src/purchaseRequests/`).
See [`../docs/tdd-git-workflow.md`](../docs/tdd-git-workflow.md) for how the
commit history demonstrates Red→Green→Refactor for each slice.

## Run it

```bash
npm install          # also runs `prisma generate` automatically (postinstall)
cp .env.example .env # then fill in DATABASE_URL (any local/hosted Postgres) and JWT_SECRET
npx prisma db push                   # creates/syncs the tables from prisma/schema.prisma
npm run prisma:seed                  # migrates prisma/seed-data/cars.json into Postgres
npm run dev          # starts http://localhost:4000, restarts on save
npm test             # runs the Vitest suite once
npm run build         # type-checks and compiles to dist/
```

## Project structure

```
prisma/
  schema.prisma          User, Vehicle, PurchaseRequest models
  seed.ts                 migrates prisma/seed-data/cars.json into Postgres, upsert by stockNumber
  seed-data/cars.json      a copied-in snapshot of the frontend's dataset (../src/data/cars.json)
src/
  app.ts               Express app factory (no listener) — what tests exercise
  server.ts             real entrypoint; the only file that calls app.listen()
  config/env.ts          the one place process.env is read
  db/prismaClient.ts      the one PrismaClient instance, shared everywhere
  data/mapLegacyVehicle.ts   pure transform: one legacy car record -> one Vehicle row
  types/legacyCar.ts        shape of a record in the legacy dataset
  types/express.d.ts        augments Express's Request with `user` (set by requireAuth)
  auth/                  registration, login, password hashing, JWT, user repository
  vehicles/              vehicle business rules, repository interface, Prisma-backed repository
  purchaseRequests/      buyer requests + admin approve/reject; approving decrements the vehicle's stock
  routes/                one router per resource
  middleware/
    auth.ts               requireAuth / requireAdmin
    errorHandler.ts        ApiError, notFoundHandler, errorHandler — the whole
                           API's single error-response shape: { error: { message, details? } }
test/                   one spec file per slice — services/repositories tested against an
                         in-memory fake, routers tested end to end with Supertest
```

## Why an app factory

`createApp()` builds the Express app and returns it without binding a port.
Tests call it directly with Supertest, so every test gets a fresh, isolated
app instance and nothing ever listens on a real socket during `npm test`.
`server.ts` is the only place `app.listen()` is called.

## Environment

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a Postgres connection
string — Neon, local, or any host) and `JWT_SECRET` (any long random string).

## TDD workflow used here

Every backend slice was added the same way, and the commit history says so
explicitly:

1. **Red** — write a Vitest/Supertest spec for behaviour that doesn't exist yet; it fails.
2. **Green** — write the smallest implementation that makes it pass.
3. **Refactor** — clean up (extract a helper, harden an endpoint) with the test suite staying green throughout.

See [`../docs/tdd-git-workflow.md`](../docs/tdd-git-workflow.md) for the full
commit-by-commit breakdown and the AI co-authorship convention used throughout.
