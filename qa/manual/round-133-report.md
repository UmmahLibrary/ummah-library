# Manual E2E QA — Round 133 (2026-11-24)

Iteration 65/100. Area: the Related-hadith panel at phone width (375px), on the
āyah with the most links (33:21, 34 hadith).

## Findings

### 1. Opening Related could push the next āyah 29,000px away — FIXED

- **Where:** [`RelatedHadith.tsx`](../../apps/web/src/components/RelatedHadith.tsx)
- **Symptom:** all 34 hadith — each with full Arabic, translation and matched
  span — rendered inline under 33:21: a 28,977px panel (~36 phone screens)
  between āyah 21 and 22. A reader who peeked lost their place.
- **Fix:** the first three, then "Show all 34 hadith" (translated in all six
  languages: `related.showAll`). Now 5,101px — still long because these
  narrations are long, but a 6× cut, and the count headline is unchanged.
- **Regression test:** `RelatedHadith.test.tsx` "shows three hadith first and the
  rest on request".

## Investigated, no bug found

No element crosses the 375px viewport with the panel open (`scrollWidth` 375);
the first-run setup dialog (fresh state after round 130's erase) doesn't block
the reader behind it.

## Verification

Tests 2/2; `tsc`, ESLint clean; live re-check.

## Verdict

One real UX bug, fixed.
