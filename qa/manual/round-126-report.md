# Manual E2E QA — Round 126 (2026-11-24)

Iteration 58/100. Area: round 125's blank polar times downstream — "next
prayer", the Tools prayer card, prayer reminders and the Ramaḍān iftar countdown
when Fajr or Maghrib is "".

## Findings

None this round.

## Investigated, no bug found

- `core nextPrayer` skips blank times (`NaN > now` is false).
- When every prayer has passed and tomorrow's Fajr is blank, the fallback
  `new Date(NaN)` is already caught: `fmtPrayerTime` and both `countdown`
  helpers return "—" for an invalid Date (an earlier loop's guard).
- I briefly rewrote the three fallbacks to skip a blank Fajr/Maghrib, then
  reverted: a test against the old code showed no "Invalid"/"NaN" ever reached
  the screen, so it would have been churn, not a fix.

## Verification

No code changes.

## Verdict

Clean.
