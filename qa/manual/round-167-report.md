# Manual E2E QA — Round 167 (2026-11-24)

Iteration 99/100. Area: the remaining two findings of the independent review.

## Findings

### 1. "500.000" was read as 500 in the zakat calculators — FIXED (review)

- **Where:** [`core/amount-input.ts`](../../packages/core/src/amount-input.ts)
- A lone dot was always a decimal point, so the way Indonesian and Turkish write
  thousands ("Rp 500.000", "1.250") counted 1000× too little — enough to drop
  someone below niṣāb. A lone dot before exactly three digits now groups
  thousands, mirroring the existing comma rule; "12.5", "0.85" and "1234.567"
  stay decimals. Trade-off documented: three-decimal currencies (KWD 1.250) read
  as thousands.
- **Regression test:** `amount-input.test.ts` (20 cases, five new).

### 2. Imsāk and the night markers ignored round 125's blanked times — FIXED (review)

- **Where:** [`adapters/prayer-times.ts`](../../packages/adapters/src/prayer-times.ts)
- Imsāk came from the raw Fajr and midnight/last-third from the raw schedule,
  *before* `withoutImpossibleTimes`, so a blanked Fajr could still sit beside an
  Imsāk. They're now derived from the checked times (no Fajr → no Imsāk; no
  Fajr or Maghrib → no midnight/last third).
- **Regression test:** `adapters/prayer-times.test.ts` checks the invariant at six
  polar latitudes × five dates. (None of those samples hit the gap on the old
  code — the fix is the reviewer's reasoning, guarded going forward.)

## Verification

core amount 20/20, adapters 9/9; typecheck 8/8; ESLint 0 errors.

## Verdict

Two real bugs fixed.
