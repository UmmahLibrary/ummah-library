# Manual E2E QA — Round 101 (2026-11-24)

Iteration 33/100. Area: round 100's focus-loss pattern elsewhere — any control
that removes the item it sits in.

## Findings

### 1. Removing a saved āyah, deleting a collection or a download dropped focus to the top — FIXED

- **Where:** [`CollectionsView.tsx`](../../apps/web/src/components/CollectionsView.tsx)
  (Remove āyah, Delete collection), [`DownloadsManager.tsx`](../../apps/web/src/components/DownloadsManager.tsx)
  (Delete download)
- **Symptom:** the focused button disappears with its card; keyboard focus falls
  to `<body>` and Tab restarts from "Skip to content" — after every removal in a
  long list.
- **Fix:** new [`lib/focus.ts`](../../apps/web/src/lib/focus.ts):
  `focusTargetAfterRemoving(item)` picks the next focusable control after the
  item (else the last before it) *before* removal; `focusSoon` focuses it once
  React has re-rendered. Used by all three and by round 100's translation notice
  (its ad-hoc version replaced).
- **Regression tests:** `lib/focus.test.ts`; `TranslationNotice.test.tsx` still
  passes through the shared helper.

## Verification

focus/Downloads/TranslationNotice tests pass; `tsc`, ESLint clean.

## Verdict

One real accessibility bug (three controls), fixed with a shared helper.
