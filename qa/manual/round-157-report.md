# Manual E2E QA — Round 157 (2026-11-24)

Iteration 89/100. Area: the reader's short confirmations — "Verse copied",
"Link copied", "Preparing image…".

## Findings

### 1. The confirmations could go unannounced — FIXED

- **Where:** [`AyahActions.tsx`](../../apps/web/src/components/AyahActions.tsx)
- **Symptom (from source):** the `role="status"` element was rendered only
  while a message existed — inserted into the DOM together with its text.
  Screen readers commonly announce *changes* inside an existing live region,
  not a region that appears already filled, so "Verse copied" was often silent.
- **Fix:** the status region is always mounted (empty, no margin) and its text
  changes.
- **Regression test:** `AyahActions.test.tsx` "keeps its live status mounted so
  'Copied' is announced when it appears".

## Verification

AyahActions tests 9/9; `tsc`, ESLint clean.

## Verdict

One real accessibility bug, fixed.
