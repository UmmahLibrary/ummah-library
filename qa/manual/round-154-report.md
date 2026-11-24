# Manual E2E QA — Round 154 (2026-11-24)

Iteration 86/100. Area: round 153's check on the other ARIA widgets — tab
lists, the āyah scrubber slider, menus, dialogs.

## Findings

### 1. The Adhkār set tabs and Go-to's Surah/Juzʾ/Page tabs ignored arrow keys — FIXED

- **Where:** [`AdhkarView.tsx`](../../apps/web/src/components/AdhkarView.tsx),
  [`GoToSheet.tsx`](../../apps/web/src/components/GoToSheet.tsx)
- **Symptom:** `role="tablist"` promises arrow-key movement; neither list
  handled it, and every tab was its own Tab stop (eleven in Adhkār).
- **Fix:** `onTabListKeyDown` (the round 153 helper generalised: arrows,
  Home/End, RTL-aware, selection follows focus) and a roving `tabIndex`.

### 2. Arabic labels styled `.noor-ar` weren't marked as Arabic — FIXED

- Round 134's guard only looked for `.arabic`; widening it to `.noor-ar` found the
  Adhkār tab labels, the Hijri month name and Today's Arabic surah name without
  `lang`. All now carry `lang="ar"` (`dir="rtl"` where standalone).

**Regression tests:** `lib/radio-group.test.tsx` "moves between tabs with the
arrow keys"; `arabic-lang.test.ts` now covers `.noor-ar`.

## Investigated, no bug found

The āyah scrubber is a focusable `role="slider"` with min/max/now/valuetext and
its own key handler; the āyah menu got arrow keys in round 64; dialogs trap and
restore focus (rounds 57/63).

## Verification

Affected tests pass; `tsc`, ESLint clean.

## Verdict

Two real accessibility bugs, fixed.
