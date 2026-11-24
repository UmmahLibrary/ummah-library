# Manual E2E QA — Round 105 (2026-11-24)

Iteration 37/100. Area: the single-āyah API and its `?edition=` parameter.

## Findings

### 1. An unknown edition returned 200 with `translation: null` — FIXED

- **Where:** [`surahs/[number]/ayahs/[aya]/route.ts`](../../apps/web/src/app/api/v1/surahs/[number]/ayahs/[aya]/route.ts)
- **Symptom:** `?edition=bogus` — and `?edition=eng-mustafakhattaba`, the reader's
  runtime default, which this server doesn't bundle — both answered 200 with
  `"translation": null`, indistinguishable from an āyah with no translation.
  The per-surah route already answers 404 `translation_not_found`.
- **Fix:** same 404 here when an edition was asked for and isn't available. No
  app calls this endpoint with an edition, so only API clients see the change.
- **Regression test:** new `ayahs/[aya]/route.test.ts` (bundled edition works;
  unknown edition 404s).

## Investigated, no bug found

`/editions` (6 bundled), `/translations` (492 catalogue), `/tafsirs` (6) respond.

## Verification

Tests 2/2; `tsc`, ESLint clean.

## Verdict

One real API bug, fixed.
