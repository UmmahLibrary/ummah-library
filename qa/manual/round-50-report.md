# Manual E2E QA — Round 50 (2026-11-23)

The production build — what's actually deployed: `next build`, `next start`,
a route and API smoke test against it, and the service worker that only runs
in production.

## Findings

### 1. Service worker: unbounded static cache, and error pages kept as offline copies — FIXED

- **Where:** [public/sw.js](../../apps/web/public/sw.js)
- **Symptom / root cause:**
  - The static cache (`ul-static-v1`) used stale-while-revalidate with no
    eviction, and its name never changed — so every deploy's new hashed
    chunks were added and none ever removed. Over months of deploys the
    origin's storage keeps growing; under storage pressure the browser evicts
    an origin's storage as a whole, which would also take offline audio
    downloads with it.
  - Both caches stored responses without checking `response.ok`, so a 404/500
    page (e.g. during a bad deploy) became the page's offline copy and was
    replayed when offline.
- **Fix:** only `ok` responses are cached; the static cache is capped at the
  300 most recent entries (`trim` after each write — Cache keys are in
  insertion order); the static cache moves to `ul-static-v2` so the old
  unbounded one is deleted on activation, while `ul-pages-v1` (readers'
  offline copies of surahs) is kept.
- **Verification:** live on the production build: after `registration.update()`
  the caches are `ul-pages-v1` (kept) and `ul-static-v2`; the old
  `ul-static-v1` is gone.
- **Regression test:** [service-worker.test.ts](../../apps/web/src/lib/service-worker.test.ts)
  runs `sw.js` against an in-memory Cache API: error pages aren't kept, good
  pages are, the static cache stops at 300 keeping the newest, and activation
  drops the old static cache but keeps pages (3 of 4 fail on the old worker).

## Investigated, no bug found

- `next build` compiles and prerenders all 2,544 pages. (Locally it needs the
  React resolver hook from round 34 — without it, `/500` fails with
  "Cannot read properties of null (reading 'useRef')", the known two-React
  issue of this machine's hoisted `node_modules`; CI is unaffected.)
- `next start`: 39 routes return 200, `/surah/115` 404, and the āyah, names,
  adhkār and prayer-times APIs return 200.
- Page navigations are network-first, so a deploy is visible on the next load;
  hashed `_next/static` chunks are immutable, so serving them from cache first
  is safe.
- Repo-wide `pnpm typecheck` passes (8/8). `pnpm lint` reports one error, in
  the git-ignored private `.local/` folder (not part of the repository or CI).

## Verification

- New service-worker tests pass; web `tsc` clean; eslint clean on `sw.js`.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
