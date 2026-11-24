# Manual E2E QA — Round 88 (2026-11-24)

Iteration 20/100. Area: Profile ("Your journey") — numbers against their
sources, the one-time badge toast.

## Findings

### 1. "1 Āyāt memorized", "1 Surahs started" — FIXED

- **Where:** [`ProfileView.tsx`](../../apps/web/src/components/ProfileView.tsx)
- **Symptom:** with one āyah in Hifz the stat cards read "1 Āyāt memorized" and
  "1 Surahs started".
- **Fix:** singular labels for exactly one.
- **Regression test:** `ProfileView.test.tsx` "says 'Āyah memorized' and 'Surah started' for exactly one".

## Investigated, no bug found

Names learned (1/99) matches the 99 Names page from round 87; the
"2 new badges unlocked" toast shows once and not again on reload; Saved verses
0 matches Bookmarks.

## Verification

ProfileView tests 4/4; ESLint clean.

## Verdict

One small real bug, fixed.
