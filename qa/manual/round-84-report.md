# Manual E2E QA — Round 84 (2026-11-24)

Iteration 16/100. Area: follow-up sweep from round 83 — every hard-coded hex
used as **text** colour in web components.

## Findings

### 1. Hifz review "Again"/"Easy" and Search result-type badges washed out on light themes — FIXED

- **Where:** [`HifzReview.tsx`](../../apps/web/src/components/HifzReview.tsx),
  [`SearchView.tsx`](../../apps/web/src/components/SearchView.tsx)
- **Symptom:** button labels "Again" (#C56A52) and "Easy" (#5BBF8A), and the
  Search badges "Verse"/"Surah"/"In the app" (gold), "Name of Allah" (blue),
  "Adhkār" (violet) used fixed hues as text; on Ivory/Sepia/Mint/Rose these sit
  around 1.6–3:1.
- **Fix:** added `alert`, `blue`, `violet` to `STATUS_HUES` and rendered all of
  them through `readableHue()` (round 83).
- **Regression test:** the ui contrast test now covers the three new hues on all
  eight themes (72 tests pass).

## Investigated, no bug found

No other hex text colours in `apps/web/src` (`grep color: "#…"`).

## Verification

ui 72/72, HifzReview + SearchView tests pass, `tsc`, ESLint clean.

## Verdict

One real accessibility bug (two screens), fixed.
