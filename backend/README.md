# Autoza backend — car dealership inventory API

Node.js + TypeScript + Express + Prisma + PostgreSQL, built test-first (Vitest + Supertest).
This folder is separate from the frontend (`../src`) — the two deploy as separate pieces on Vercel.

## Status

Phase B1 only so far: an app factory (`src/app.ts`) with a health check and a shared
JSON error shape, built with a visible Red → Green → Refactor commit history. No database,
auth, or vehicle endpoints yet — those are the next phases.

## Run it

```bash
npm install
npm run dev     # starts http://localhost:4000, restarts on save
npm test        # runs the Vitest suite once
npm run build   # type-checks and compiles to dist/
```

## Project structure

```
src/
  app.ts              Express app factory (no listener) — what tests exercise
  server.ts            real entrypoint; the only file that calls app.listen()
  config/env.ts         the one place process.env is read
  routes/               one router per resource (health.router.ts so far)
  middleware/
    errorHandler.ts      ApiError, notFoundHandler, errorHandler — the whole
                         API's single error-response shape: { error: { message, details? } }
test/
  health.test.ts        GET /api/health
  notFound.test.ts      unknown routes return a consistent 404
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
