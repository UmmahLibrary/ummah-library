# Manual E2E QA — Round 93 (2026-11-24)

Iteration 25/100. Area: what keeps working offline — the service worker's
caching rules, checked against the new Related-hadith panel and offline audio.

## Findings

### 1. A service-worker update would delete every downloaded recitation — FIXED

- **Where:** [`public/sw.js`](../../apps/web/public/sw.js)
- **Symptom (from source, then test):** `activate` ran
  `caches.keys().filter(k => !CURRENT.includes(k)).map(caches.delete)`. The
  offline audio store `ul-audio-v1` (round 74) is on the same origin and not in
  `CURRENT`, so the next time `sw.js` changes, every saved surah is erased.
- **Fix:** only caches matching `^ul-(pages|static|api)-v\d+$` are pruned.
  ADR 0039 amended.

### 2. Tafsir, translations and Related hadith never worked offline — FIXED

- **Symptom:** API requests bypassed the worker entirely; once the browser's
  1-hour HTTP cache lapsed, an offline reader's Tafsir/Related panels failed —
  ADR 0044 says Related "works offline, like the rest of the reader".
- **Fix:** network-first with cache fallback for public reader-content APIs in
  a capped `ul-api-v1` (120 entries). Excluded: prayer-times/places (carry
  coordinates), sync, and whole hadith collections (~12 MB each).

**Regression tests:** `lib/service-worker.test.ts` — "never deletes the offline
recitations cache (or any cache it doesn't own)"; "serves a reader content API
from cache when offline, but never caches location APIs" (also not whole
collections). 6/6 pass.

## Verification

Service-worker tests pass; Prettier/ESLint clean. (The worker only runs on a
production build; a prod smoke test is queued for the final verification.)

## Verdict

Two real bugs (one data-loss), fixed.
