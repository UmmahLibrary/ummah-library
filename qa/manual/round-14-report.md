# Manual E2E QA - Round 14 (2026-08-21)

Areas covered this round: Reading Plans (start/mark-day-done flow) and
Duʿās, both not yet exercised on the mobile app.

## Findings

None this round.

## Investigated, no bug found

- **Reading Plans:** started "Ramaḍān Khatm" (30 days), marked Day 1 done —
  progress correctly advanced to 3%, the header correctly kept reading
  "Active · Day 1 of 30", and the "Today" portion preview advanced to
  Juzʾ 2 (the next portion from the reading cursor). This is the exact
  same intentional look-ahead-preview pattern already confirmed correct on
  web in round 3 (`computeTodayPortion` in `packages/core/src/reading-plans.ts`
  — shared logic between platforms, so this wasn't expected to differ, and
  didn't).
- **Duʿās:** categorized supplications (Comprehensive, Forgiveness,
  Guidance & knowledge, ...) render correctly with Arabic, translation, and
  the correct Quranic reference for each — a read-only reference screen
  with no counters/steppers, so out of scope for the rapid-tap bug class
  rounds 11-13 focused on.
- **Tab-bar navigation, revisited:** switching from the Reading Plans
  screen (under the "More" tab's stack) directly to the "Tools" tab this
  time landed correctly on Tools' own root list, not a stale nested screen
  — contradicting my tentative round 11 note that tab-bar re-tap doesn't
  reset a stack. Given the inconsistent results across rounds (sometimes
  the previously-visited nested screen persists, sometimes it doesn't, and
  the exact trigger isn't clear from black-box testing alone), this still
  isn't confirmed as either a real bug or expected behavior — leaving it
  as an open question for a future round rather than guessing further; it
  hasn't affected the correctness of any of the actual bugs found so far.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 13's (last round with a code change), which remains
  green: lint 0 errors, typecheck clean, 105/105 mobile tests / 415/415
  web tests, clean build.
- All checks above were live re-verifications against the running Expo web
  dev server.

## Verdict

Zero new bugs found — round 1 of the 3-in-a-row stop condition (following
round 13's fix). Continuing to round 15.
