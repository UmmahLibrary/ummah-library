# Manual E2E QA — Round 75 (2026-11-24)

Iteration 7/100. Area: the web Hijri calendar (`/calendar`) — today, month grid,
Gregorian cross-reference, adjustment.

## Findings

### 1. The month grid had no Gregorian dates for touch or screen-reader users — FIXED

- **Where:** [`HijriCalendar.tsx`](../../apps/web/src/components/HijriCalendar.tsx)
- **Symptom:** the page promises "Islamic months with Gregorian cross-reference",
  but a day cell only showed the Hijri number; the Gregorian date was a `title`
  tooltip — mouse hover only. A screen reader read the grid as bare numbers
  "1 2 3 …" with nothing marking today.
- **Fix:** the grid is an `<ol>` named after the month; each day is an `<li>`
  named "13 Jumādā al-Ākhirah, 24 Nov 2026, today[, observance]" with
  `aria-current="date"` on today, and a small Gregorian day number shows in the
  cell's corner.
- **Verification:** zoomed screenshot shows e.g. 13 with 24 beside it.
- **Regression test:** new `HijriCalendar.test.tsx`.

## Investigated, no bug found

- Today = 13 Jumādā II 1448: matches `Intl` `islamic-civil` (the arithmetic
  calendar the page says it uses); Umm al-Qura shows 14 — the ±2 adjustment
  exists for exactly this, as the page explains.

## Verification

Test passes; web `tsc`, ESLint clean.

## Verdict

One real accessibility bug, fixed.
