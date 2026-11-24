# Manual E2E QA — Round 85 (2026-11-24)

Iteration 17/100. Area: the round 83–84 sweep on mobile — hard-coded hex text
colours in `apps/mobile/src`.

## Findings

### 1. Mobile hadith grade label washed out on light themes — FIXED

- **Where:** [`HadithScreen.tsx`](../../apps/mobile/src/screens/HadithScreen.tsx)
- **Symptom:** the grade pill used `#5bbf8a` for text and border on every theme
  (≈2:1 on Ivory/Mint/Rose, 1.9:1 on Sepia).
- **Fix:** new `readableHueFor(hex, palette)` in
  [`packages/ui/src/tokens.ts`](../../packages/ui/src/tokens.ts) — the same
  blend as the web `readableHue()`, resolved against the concrete palette (no
  CSS variables on native). The screen uses `STATUS_HUES.good` through it.
- **Regression test:** `ui/themes.test.ts` asserts `readableHueFor` equals the
  blend whose contrast it checks (≥ 4.5:1 on every surface of all eight themes).

## Investigated, no bug found

`ErrorBoundary.tsx` uses fixed colours deliberately — it renders when the theme
provider itself may have crashed, on a fixed dark background.

## Verification

ui 72/72; typecheck ui + mobile clean; ESLint clean.

## Verdict

One real accessibility bug, fixed.
