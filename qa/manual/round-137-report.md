# Manual E2E QA — Round 137 (2026-11-24)

Iteration 69/100. Area: the mirror image of round 136 — a `YYYY-MM-DD` string
parsed as UTC midnight (`new Date("2026-11-24")`) and then shown with local
getters, which prints the previous day west of Greenwich.

## Findings

None this round.

## Investigated, no bug found

- Web: `CyclePause`, `PrayerTracker` build local midnight (`T00:00:00`, no
  `Z`); `HijriCalendar` and `SunnahFastReminderToggle` build UTC dates *and*
  format with `timeZone: "UTC"`; `ReadingGoalsView` and `PrayerTimesView` format
  local `Date`s; the Hifz heatmap shows its key strings as-is.
- Mobile: `prayer-intl` formats with `timeZone: "UTC"`; the tracker and goals
  screens build local dates from parts (`new Date(y, m-1, d)`).

## Verification

No code changes.

## Verdict

Clean.
