# Manual E2E QA — Round 123 (2026-11-24)

Iteration 55/100. Area: Hifz review when nothing is due (one āyah tracked, due
in five days).

## Findings

### 1. Opening review with nothing due said "All caught up! 0 āyāt reviewed" — FIXED

- **Where:** [`HifzReview.tsx`](../../apps/web/src/components/HifzReview.tsx)
- **Symptom:** arriving with no due cards showed the end-of-session summary
  "0 āyāt reviewed · 1 tracked in total" — true, but it doesn't tell you when to
  come back.
- **Fix:** when the session started empty: "Nothing is due yet — your next
  review is in 5 days. 1 tracked in total." The after-review summary is unchanged.
- **Regression test:** `HifzReview.test.tsx` "says when the next review is,
  instead of '0 āyāt reviewed'".

## Verification

HifzReview tests 3/3; `tsc`, ESLint clean.

## Verdict

One real UX bug, fixed.
