# Manual E2E QA — Round 25 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered Reading Plans (summary and detail screens).

## Findings

None this round.

## Investigated, no bug found

- **Reading Plans summary:** the active plan card ("30-Day Juzʾ Sprint")
  correctly showed 17% progress, "Day 4 of 30", and a "Your days" strip with
  D1–D5 all marked done. Initially looked like a possible inconsistency
  (why would D5 show done if we're only on day 4?) — traced through
  [packages/core/src/reading-plans.ts](../../packages/core/src/reading-plans.ts):
  `currentDay` is a pure calendar calculation (days elapsed since
  `startDate`), while `isDayComplete` checks cumulative `unitsRead` against
  each day's target. The two are intentionally independent — a reader who
  gets ahead of schedule shows future days as done without the "Day X of
  30" calendar label changing to match. Confirmed this is by design, not a
  bug.
- **Plan detail screen:** progress ring, day grid with legend (Done/
  Missed/Upcoming), and the "Manage" actions (Re-pace, Extend +1wk, Pause,
  Abandon) all matched the summary screen's state exactly.
- **Daily reminder time picker:** tapping "Remind me at 6:50 PM" opens the
  native Android `TimePickerDialog` correctly; Cancel dismisses it without
  changing the stored time (verified 6:50 PM was unchanged afterward).

## Verification

No code changes this round — investigation only, no fix needed.

## Verdict

No bugs found this round. Clean-streak: 2/3 (round 23 found a bug; rounds
24 and 25 are now clean — one more clean round reaches the 3-in-a-row stop
condition).
