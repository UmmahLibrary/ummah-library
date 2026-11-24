# Manual E2E QA — Round 90 (2026-11-24)

Iteration 22/100. Area: keyboard focus visibility — real Tab presses on Today,
then every component that turns an outline off.

## Findings

### 1. Search boxes and Zakat fields showed no focus ring at all — FIXED

- **Where:** top-bar search ([`TopBar.tsx`](../../apps/web/src/components/shell/TopBar.tsx)),
  [`SearchView.tsx`](../../apps/web/src/components/SearchView.tsx),
  [`HadithBrowser.tsx`](../../apps/web/src/components/HadithBrowser.tsx),
  [`ZakatCalculator.tsx`](../../apps/web/src/components/ZakatCalculator.tsx),
  collection rename in [`CollectionsView.tsx`](../../apps/web/src/components/CollectionsView.tsx)
- **Symptom:** links and buttons get the gold 2px ring (global `:focus-visible`),
  but these fields are a bare `<input>` with inline `outline: "none"` inside a
  styled pill, and nothing styles the pill — Tab into them and only a thin caret
  shows (WCAG 2.4.7). The collection title's `:focus` underline in globals.css
  was overridden by the input's inline transparent border.
- **Fix:** `.noor-field:focus-within` rings the pill (class added to the five
  wrappers); `.collection-name:focus` border marked `!important` over the inline style.
- **Verification:** live — focusing the Hadith and top-bar searches outlines the
  pill in gold; blur removes it.
- **Regression test:** new `components/focus-ring.test.ts` — any component that
  sets `outline: "none"` must use `noor-field` (or be a script-only focus target).

## Investigated, no bug found

Tab order on Today starts Skip link → logo → Today…; each shows the global ring.

## Verification

Affected component tests pass; `tsc`, ESLint clean.

## Verdict

One real accessibility bug (five fields), fixed.
