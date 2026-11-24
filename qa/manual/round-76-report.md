# Manual E2E QA — Round 76 (2026-11-24)

Iteration 8/100. Area: the Ramaḍān page (`/ramadan`, and the mobile Ramadan
screen) outside Ramaḍān (today is 13 Jumādā II 1448).

## Findings

### 1. Kept fasts had no year, so last Ramaḍān's fasts carried into the next — FIXED

- **Where:** web [`lib/ramadan.ts`](../../apps/web/src/lib/ramadan.ts),
  [`RamadanView.tsx`](../../apps/web/src/components/RamadanView.tsx); mobile
  [`RamadanScreen.tsx`](../../apps/mobile/src/screens/RamadanScreen.tsx)
- **Symptom:** `ul.ramadanFasts` stored `{ "1": true, … }` — day numbers only.
  Fasts ticked in Ramaḍān 1447 would show as already kept on 1 Ramaḍān 1448
  ("20/30 Fasts kept" on day one), on web and mobile alike.
- **Fix:** new pure [`core/ramadan-fasts.ts`](../../packages/core/src/ramadan-fasts.ts):
  entries are keyed `"<hijriYear>:<day>"`; the grid shows one Ramaḍān —
  this year's from Ramaḍān on, otherwise the one just gone — and is labelled
  ("Fasting · Ramaḍān 1447"). Year-less legacy entries are read as that most
  recent Ramaḍān's. The stored value is still a flat record, so the synced shape
  (`recordShape`) and merge are unchanged. Today's highlight only shows during
  Ramaḍān.
- **Verification:** live — legacy `{1,2,3}` shows "3/30 Fasts kept" under
  "Ramaḍān 1447"; ticking 10 stores `1447:1…3, 1447:10`. Mobile typechecks.
- **Regression tests:** `core/ramadan-fasts.test.ts` (3), `web lib/ramadan.test.ts`
  "keeps each year's fasts apart…".

## Open (next iteration)

"Khatm progress" sums every page ever logged, not this Ramaḍān's reading.

## Verification

core + web tests pass; typecheck core/web/mobile clean; ESLint 0 errors (one
pre-existing hooks warning in RamadanScreen).

## Verdict

One real data bug, fixed on web and mobile.
