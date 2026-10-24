# Autoza backend — car dealership inventory API

Node.js + TypeScript + Express + Prisma + PostgreSQL, built test-first (Vitest + Supertest).
This folder is separate from the frontend (`../src`) — the two deploy as separate pieces on Vercel.

## Status

- **Phase B1** — an app factory (`src/app.ts`) with a health check and a shared
  JSON error shape, built with a visible Red → Green → Refactor commit history.
- **Phase B2** — Prisma schema (`prisma/schema.prisma`: `User`, `Vehicle`) and a
  seed script that migrates the frontend's existing `cars.json` dataset into
  Postgres. No auth or vehicle *endpoints* yet — those are next.

## Run it

```bash
npm install          # also runs `prisma generate` automatically (postinstall)
cp .env.example .env # then fill in DATABASE_URL (any local/hosted Postgres) and JWT_SECRET
npx prisma migrate dev --name init   # creates the tables from prisma/schema.prisma
npm run prisma:seed                  # migrates prisma/seed-data/cars.json into Postgres
npm run dev          # starts http://localhost:4000, restarts on save
npm test             # runs the Vitest suite once
npm run build         # type-checks and compiles to dist/
```

**Note on this session:** the Prisma schema, DB client, and seed script were written and
their logic fully verified (all 686 real dataset records migrated with zero errors,
checked field-by-field), but `npx prisma generate`/`migrate` could not be *run* from the
cloud sandbox this was built in — the sandbox's network policy blocks the host Prisma's
CLI downloads its engine binary from. That's specific to that sandbox, not a problem with
the code: running `npm install` here, on any machine with normal internet access, triggers
`prisma generate` automatically, and `npx prisma migrate dev --name init` will work the
first time you run it.

## Project structure

```
prisma/
  schema.prisma         User + Vehicle models (see field-by-field notes in the file)
  seed.ts                migrates prisma/seed-data/cars.json into Postgres, upsert by stockNumber
  seed-data/cars.json     a copied-in snapshot of the frontend's dataset (../src/data/cars.json)
src/
  app.ts              Express app factory (no listener) — what tests exercise
  server.ts            real entrypoint; the only file that calls app.listen()
  config/env.ts         the one place process.env is read
  db/prismaClient.ts     the one PrismaClient instance, shared everywhere
  data/mapLegacyVehicle.ts  pure transform: one legacy car record -> one Vehicle row
  types/legacyCar.ts       shape of a record in the legacy dataset
  routes/               one router per resource (health.router.ts so far)
  middleware/
    errorHandler.ts      ApiError, notFoundHandler, errorHandler — the whole
                         API's single error-response shape: { error: { message, details? } }
test/
  health.test.ts        GET /api/health
  notFound.test.ts      unknown routes return a consistent 404
  mapLegacyVehicle.test.ts  the dataset-migration logic, fully unit tested (no DB needed)
```

## Why an app factory

`createApp()` builds the Express app and returns it without binding a port.
Tests call it directly with Supertest, so every test gets a fresh, isolated
app instance and nothing ever listens on a real socket during `npm test`.
`server.ts` is the only place `app.listen()` is called.

## Environment

Copy `.env.example` to `.env`. `DATABASE_URL` and `JWT_SECRET` aren't used yet —
they're wired up in the data-model and auth phases, but are documented now so
the eventual `.env` only needs filling in once.

## TDD workflow used here (and going forward)

Every endpoint is added the same way, and the commit history says so explicitly:

1. **Red** — write a Supertest spec for behaviour that doesn't exist yet; run it, watch it fail.
2. **Green** — write the smallest implementation that makes it pass.
3. **Refactor** — clean up (extract a router, share logic) with the test suite staying green throughout.
