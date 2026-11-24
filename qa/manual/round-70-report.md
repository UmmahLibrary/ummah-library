# Manual E2E QA — Round 70 (2026-11-24)

Iteration 2/100. Area: the public REST API (`/api/v1/*`) with edge and missing
inputs — 41 requests across every route, by `curl` against the dev server.

## Findings

### 1. Missing coordinates were read as 0,0 and a missing radius as 200 m — FIXED

- **Where:** [`places/nearby/route.ts`](../../apps/web/src/app/api/v1/places/nearby/route.ts),
  [`prayer-times/route.ts`](../../apps/web/src/app/api/v1/prayer-times/route.ts)
- **Symptom:** `GET /api/v1/places/nearby` with no query returned **200** for
  "0,0" (the Gulf of Guinea) after calling Overpass; `?lat=21.4` alone searched at
  longitude 0; `prayer-times?date=…` without `lat/lng` returned times for 0,0.
  Without `radius`, nearby used **200 m**, not the 5 km default in the route.
- **Root cause:** `Number(searchParams.get(x))` — `Number(null)` and
  `Number("")` are `0`, which passes the range checks.
- **Fix:** new [`lib/query-number.ts`](../../apps/web/src/lib/query-number.ts)
  `numberParam()` returns `NaN` for absent/blank values; both routes use it. A
  real `lat=0` still works.
- **Verification:** curl — missing coords → 400 `bad_coordinates`; Makkah with no
  radius → `radiusMeters: 5000`; `lat=0&lng=0` still 200.
- **Regression tests:** `lib/query-number.test.ts`, `places/nearby/route.test.ts`.

## Investigated, no bug found

- Surah/āyah/hadith/section/tafsir/translation/timings 404 and 400 paths all
  correct; bad dates rejected; Related hadith 2:286 and 1:7 return links.
- Both apps always send `radius`, so only third-party API callers hit the 200 m bug.
- `surahs/01` and `1e0` resolve to surah 1 — lenient but harmless.

## Verification

New tests pass; web `tsc` and ESLint clean.

## Verdict

One real bug (two routes), fixed.
