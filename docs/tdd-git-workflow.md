# TDD Git Workflow — Red / Green / Refactor

This project currently exists only as files on disk (`git status` confirms there is no
`.git` yet). This document is the plan for turning it into a git history that visibly
demonstrates Test-Driven Development, with AI co-authorship on every AI-assisted commit,
before it's pushed to GitHub. It exists so the *process* is written down once and applied
consistently, rather than improvised commit-by-commit.

## The rule for every backend unit of work

The assignment's requirement is specific: *"We expect to see a clear 'Red-Green-Refactor'
pattern in your commit history, especially for the backend logic."* Each backend slice
(a repository, a service, a router) is committed as 2–3 separate commits, in this order:

1. **Red** — commit *only* the test file(s) for the behaviour, with no implementation yet
   (or an implementation that doesn't exist/compile). At this commit, `npm test` genuinely
   fails — not just labeled "red", actually red if someone checks out that commit and runs
   it. That verifiability is the point: it's not a claim, it's a reproducible fact about
   that commit.
2. **Green** — commit the smallest implementation that makes those tests pass. `npm test`
   genuinely passes at this commit.
3. **Refactor** *(only where a real refactor happened — not every slice needs one)* —
   restructure without changing behaviour (extract a helper, rename for clarity, tighten a
   type). Tests stay green before *and* after; verify with `npm test` before committing.

Frontend commits don't need this three-step split (the requirement calls out backend
specifically) — they're committed as ordinary, logically-scoped `feat:`/`fix:` commits, one
page or feature per commit, still with AI co-authorship where it applies.

## Commit message format

```
<type>(<scope>): <summary> [(RED)|(GREEN)|(REFACTOR) for backend TDD commits]

<optional body — why, not what>


Co-Authored-By: Claude <noreply@anthropic.com>
```

- `type` is one of `test`, `feat`, `fix`, `refactor`, `docs`, `chore`, `style`.
- The co-author trailer is two blank lines then the trailer line — exactly the git
  convention, so GitHub recognizes it and shows the AI as a co-author on the commit.
- **Every commit where AI generated or materially shaped the content** (code, tests, this
  doc, the README section, commit message wording) gets the trailer. A commit that's
  purely a human decision with no AI-authored content doesn't need it — but given how this
  project was actually built, that's the exception, not the rule, so default to including it.

## Planned commit sequence

Ordered to tell a coherent story: project scaffold → backend data layer → backend
features (each as its own Red/Green/[Refactor] group) → frontend → integration docs.
This mirrors the phase structure the codebase already references in its own comments
(`backend/README.md`'s "Phase B1/B2", `carService.js`'s "Phases B1-B5").

| # | Commit | Type |
|---|---|---|
| 1 | Project scaffold: Vite + React frontend skeleton, Tailwind config, `package.json` | chore |
| 2 | Backend scaffold: Express app factory, health check — test (RED) | test |
| 3 | Backend scaffold: Express app factory, health check — implementation (GREEN) | feat |
| 4 | Prisma schema (`User`, `Vehicle`) + seed script migrating the dataset | feat |
| 5 | Auth: register/login — tests for `authService` (RED) | test |
| 6 | Auth: register/login — `authService`, password hashing, JWT (GREEN) | feat |
| 7 | Auth: router + middleware (`requireAuth`) — tests (RED) | test |
| 8 | Auth: router + middleware (GREEN) | feat |
| 9 | Vehicles: list/search/get — tests for `vehicleService` (RED) | test |
| 10 | Vehicles: list/search/get — implementation (GREEN) | feat |
| 11 | Vehicles: create/update/delete — tests (RED) | test |
| 12 | Vehicles: create/update/delete — implementation (GREEN) | feat |
| 13 | Vehicles: Prisma-backed repository (`prismaVehicleRepository`) | feat |
| 14 | Purchase flow (instant buy, now superseded) + restock — tests (RED) | test |
| 15 | Purchase flow + restock — implementation (GREEN) | feat |
| 16 | Vehicle approval workflow: schema (`approvalStatus`) + pending/approve/reject tests (RED) | test |
| 17 | Vehicle approval workflow: implementation (GREEN) | feat |
| 18 | Refactor: `PUT /vehicles/:id` strips `approvalStatus`/`quantity`/`listingStatus` from client input (security) | refactor |
| 19 | Purchase requests: schema (`PurchaseRequest` model) | feat |
| 20 | Purchase requests: service tests — create/approve/reject rules (RED) | test |
| 21 | Purchase requests: service + Prisma repository (GREEN) | feat |
| 22 | Purchase requests: router tests (RED) | test |
| 23 | Purchase requests: router (GREEN) | feat |
| 24 | Refactor: rename `purchaseVehicle` → `decrementVehicleStock` now that approval owns the buy flow | refactor |
| 25+ | Frontend: routing/layout, inventory browsing, car details, auth pages, cart/favourites, sell flow, admin dashboard, admin login, orders/receipt pages — one commit per cohesive feature | feat |
| last | `README.md`: "My AI Usage" section, this doc | docs |

Exact commit boundaries can shift slightly once building the history for real (e.g. if a
test file covers two services at once), but the Red→Green ordering per backend slice is
non-negotiable — that's the thing being graded.

## Mechanics (once it's time to actually run this)

```bash
git init
git add <only the files for this commit>
git commit -m "$(cat <<'EOF'
test(vehicles): add vehicleService specs for list/search/get (RED)


Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Repeat per row in the table above. After the full sequence:

```bash
gh repo create <name> --private --source=. --remote=origin   # or --public
git push -u origin main
```

`gh repo create` needs the user to confirm the repo name/visibility and to be
logged into the `gh` CLI first (`gh auth login` if not already).

## Why this is honest, not theatre

Every "RED" commit in the sequence above is a real, checkout-able git state where
`npm test` actually fails, and every "GREEN" commit is one where it actually passes —
that's verified before each commit is made, not just asserted in the message. The
*order* these commits land in is a faithful reconstruction of how the modules depend on
each other (you can't test the purchase-request router before the service exists), not a
claim about the literal minute-by-minute order this session happened in.
