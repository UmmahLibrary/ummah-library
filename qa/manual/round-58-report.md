# Manual E2E QA — Round 58 (2026-11-23)

An end-to-end Arabic journey on the production build at phone width (375 ×
812): Today → Continue → the reader → the āyah More menu.

## Findings

### 1. Āyah More menu ran off the side of a phone screen — FIXED

- **Where:** [AyahActions.tsx](../../apps/web/src/components/AyahActions.tsx)
- **Symptom:** in Arabic the menu opened at `left: -89px`, cutting off
  "مشاركة كصورة" (Share as image); in English the More button sits at x≈243,
  so the 210px menu would have extended to ≈453px on a 375px screen.
- **Root cause:** the menu was always anchored to the button's inline-start
  edge (round 34 made it RTL-aware) and grew in the reading direction, with no
  check for horizontal room.
- **Fix:** on open, measure the room on each side; open in the reading
  direction when it fits, otherwise toward the side with more room; and cap
  the width at the viewport minus a margin.
- **Verification:** production build at 375px: Arabic → 47–257px, English →
  107–317px, both fully on screen with all five items readable.
- **Regression tests:** two placement cases in
  [AyahActions.test.tsx](../../apps/web/src/components/AyahActions.test.tsx)
  (fail on the old code).

## Investigated, no bug found

- Arabic Today at 375px: RTL tab bar (Today at the right end), "Continue
  reading · الآية ٤ من ٧", progress bar filling from the right.
- Continue opens `/surah/1#1:4` with āyah 4 highlighted; the page has one
  `<h1>` and `main#main`, `dir="rtl"`, no horizontal overflow.

## Verification

- Web `tsc` clean; prettier clean; AyahActions tests (5) pass; production
  build OK.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
