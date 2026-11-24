# Manual E2E QA — Round 108 (2026-11-24)

Iteration 40/100. Area: phone width (375px) — horizontal overflow on the 15
pages changed in this loop, then a visual check of the densest one.

## Findings

### 1. The Gregorian day read as an exponent of the Hijri day on phones — FIXED

- **Where:** [`HijriCalendar.tsx`](../../apps/web/src/components/HijriCalendar.tsx) (round 75's addition)
- **Symptom:** in ~40px cells the small Gregorian number sat against the
  top-right of the Hijri number: "13²⁴", "1¹²" — easily read as 1324 or 112.
- **Fix:** the cell stacks the Hijri day over a smaller, fainter Gregorian day;
  the observance dot moves to the top corner.
- **Verification:** zoomed phone screenshot — "13 / 24", "20 / 1" clearly stacked.
- **Regression test:** `HijriCalendar.test.tsx` still asserts the visible
  Gregorian day and the full accessible name.

## Investigated, no bug found

No element crosses the viewport and `scrollWidth` is 371 on `/tafsir`, `/search`,
`/calendar`, `/mosques`, `/downloads`, `/duas`, `/hadith` (deep link), `/goals`,
`/zakat`, `/surah/33`, `/tracker`, `/settings`, `/ramadan`, `/names`, `/hifz`.

## Verification

Calendar test passes; ESLint clean.

## Verdict

One real visual bug (introduced in round 75), fixed.
