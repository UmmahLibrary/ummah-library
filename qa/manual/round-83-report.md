# Manual E2E QA — Round 83 (2026-11-24)

Iteration 15/100. Area: the Hadith browser in the light themes — grade badges
use fixed hex colours outside the Noor tokens.

## Findings

### 1. Hadith grade labels were unreadable on light themes (1.6–2.7:1) — FIXED

- **Where:** [`HadithBrowser.tsx`](../../apps/web/src/components/HadithBrowser.tsx)
- **Symptom:** computed against every theme's surfaces: Ṣaḥīḥ green 2.06:1,
  Ḥasan gold 1.72:1 on Ivory/Mint/Rose, 1.58:1 on Sepia — far under WCAG AA
  4.5:1 for this 11.5px text. Dark themes were fine (4.3–8.4).
- **Root cause:** `GRADE_COLOR` hard-coded hues tuned for dark backgrounds, in
  an app — not a Noor token (ADR 0023).
- **Fix:** `STATUS_HUES` + `readableHue()` in [`packages/ui/src/tokens.ts`](../../packages/ui/src/tokens.ts):
  the hue blended toward `--noor-fg` via `light-dark()` (30% on light themes,
  75% on dark), keeping each grade's hue while clearing 4.5:1. Hadith badges
  use it.
- **Verification:** live on Ivory — Ṣaḥīḥ renders dark green rgb(49,76,54) on
  its tint.
- **Regression test:** `ui/themes.test.ts` "readableHue — status hues as text":
  every status hue ≥ 4.5:1 on every surface of all eight themes, on its own tint.

## Investigated, no bug found

`HifzReview`'s "Easy" and `PrayerTracker`'s "late" use the same green/orange,
but as icons/swatches (3:1 non-text rule), not as text.

## Verification

ui tests 72/72; typecheck ui/mobile clean; web `tsc`, ESLint clean.

## Verdict

One real accessibility bug, fixed via a design-system token.
