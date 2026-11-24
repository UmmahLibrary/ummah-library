# Manual E2E QA — Round 166 (2026-11-24)

Iteration 98/100. Area: the repository's Playwright end-to-end suite (50 specs,
against the dev server) and an independent code review of this loop's riskiest
changes — the first two of its findings fixed here.

## Findings

### 1. E2E: the bookmarks rename spec assumed save-per-keystroke — FIXED (test)

- **Where:** [`e2e/bookmarks.spec.ts`](../../e2e/bookmarks.spec.ts)
- The spec filled the name and waited for storage; round 111 deliberately saves
  on Enter/blur (saving each keystroke ate spaces). The spec now presses Enter.
  It passes.

### 2. Arrow keys in onboarding's translation step picked and left — FIXED (review)

- **Where:** [`lib/radio-group.ts`](../../apps/web/src/lib/radio-group.ts),
  [`TranslationChoice.tsx`](../../apps/web/src/components/TranslationChoice.tsx)
- Round 153's selection-follows-focus clicked the option on every arrow press;
  in onboarding a pick calls `onPick` → next step, so ArrowDown chose a
  translation and left the step. That group now uses
  `onRadioGroupKeyDownFocusOnly` (arrows move focus; Space/Enter picks).
- **Regression test:** `radio-group.test.tsx` "moves focus with the arrows
  without picking".

### 3. Year-less fasts would be re-dated on the first visit in Ramaḍān 1448 — FIXED (review)

- **Where:** [`core/ramadan-fasts.ts`](../../packages/core/src/ramadan-fasts.ts),
  both Ramaḍān screens
- Round 76 assigned legacy `"5"` keys to the Ramaḍān the screen showed *when
  opened*; someone who didn't open the page until 1 Ramaḍān 1448 would see last
  year's fasts as this year's. Every year-less entry predates year keys, so
  they now always belong to `LEGACY_FASTS_YEAR = 1447`.
- **Regression test:** `ramadan-fasts.test.ts` "stay in Ramaḍān 1447 even when
  first read during Ramaḍān 1448".

## Investigated

The axe gate failed once on `/surah/2` during the full run and passed 31/31 on
two re-runs — a dev-server compile-timing flake. 48 of the other 49 specs passed
first time.

## Verification

E2E bookmarks 1/1, axe 31/31; core ramadan-fasts 6/6; web ramadan + radio-group
tests pass; typecheck 8/8.

## Verdict

Three real bugs fixed (two from the review), one spec updated.
