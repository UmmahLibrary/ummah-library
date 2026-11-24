# Manual E2E QA — Round 89 (2026-11-24)

Iteration 21/100. Area: the public API's OpenAPI document against the routes
that actually exist.

## Findings

### 1. Two public endpoints were missing from `/api/v1/openapi.json` — FIXED

- **Where:** [`openapi.json/route.ts`](../../apps/web/src/app/api/v1/openapi.json/route.ts)
- **Symptom:** `GET /places/nearby` (used by the mobile app, and fixed in round 70)
  and `GET /search/corpus` had no entry; a client generated from the spec
  couldn't call them.
- **Fix:** documented both — nearby with required `lat`/`lng`, `radius`
  (200–20000, default 5000) and its 400/502 responses.
- **Regression test:** new `openapi.json/route.test.ts` walks `app/api/v1` and
  fails if any `route.ts` has no path in the document (fails on the old spec).

## Investigated, no bug found

The other 17 routes are documented with their path parameters.

## Verification

Test passes (and failed before the fix); ESLint clean.

## Verdict

One real bug, fixed.
