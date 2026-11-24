# Manual E2E QA — Round 77 (2026-11-24)

Iteration 9/100. Area: the Ramaḍān page's "Khatm progress", left open by round 76.

## Findings

### 1. Khatm progress counted the wrong pages, differently on web and mobile — FIXED

- **Where:** [`RamadanView.tsx`](../../apps/web/src/components/RamadanView.tsx),
  [`RamadanScreen.tsx`](../../apps/mobile/src/screens/RamadanScreen.tsx)
- **Symptom:** web summed **every page ever logged** (a reader with 300 pages
  in November saw "50% Khatm progress" for Ramaḍān). Mobile summed everything
  from 1 Ramaḍān of the *current* Hijri year onward — so after Eid it kept
  adding Shawwāl's reading, and before Ramaḍān it showed 0 for the one just gone.
- **Fix:** core `ramadanDateRange(year, adjust)` and `pagesReadBetween(log, range)`
  in [`ramadan-fasts.ts`](../../packages/core/src/ramadan-fasts.ts); both apps
  count pages read from the first to the last day of the same Ramaḍān the fast
  grid shows (round 76), honouring the sighting adjustment.
- **Verification:** live — log `{2026-03-01: 60, 2026-11-20: 300}` shows 10%
  (60/604) for Ramaḍān 1447, not 59%.
- **Regression tests:** `core/ramadan-fasts.test.ts` "counts only the pages read
  during that Ramaḍān", "moves with the sighting adjustment".

## Verification

core tests 5/5; typecheck core/web/mobile clean; ESLint 0 errors.

## Verdict

One real bug (both apps), fixed.
