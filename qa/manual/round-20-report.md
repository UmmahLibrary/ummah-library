# Manual E2E QA — Round 20 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered ground not yet exercised natively: the Prayer Tracker
(logging a prayer, streak semantics) and the Settings screen's theme
switcher, plus a re-verification pass on the Hifz fix from round 19.

## Findings

None this round.

## Investigated, no bug found

- **Prayer Tracker — logging and streak semantics:** tapping the Fajr circle
  correctly logs it "On time", updates "Prayed today" (0/5 → 1/5), and fills
  in today's cell in the "Last 7 days" grid. "Day streak" staying at 0 after
  logging only one of five prayers is *correct*, not a bug — confirmed via
  [packages/core/src/prayer-tracker.ts:43](../../packages/core/src/prayer-tracker.ts#L43):
  "A day 'counts' for the streak when all five obligatory prayers are
  logged." The 100% "On time (30d)" stat with a small sample (2 pre-existing
  on-time Fajr entries from earlier in this native session, now 3) is also
  correctly computed, not a placeholder value.
- **Settings — theme switcher:** selecting a different Noor theme swatch
  (Appearance → Theme) applies instantly and correctly across the whole app
  — verified the accent color, backgrounds, and selection rings all updated
  consistently on both the Settings screen itself and after navigating to
  Home. Reverted to the original theme afterward; no state corruption.
- **Hifz dashboard fix from round 19 (spot check):** returning to the
  Memorize dashboard via the tab bar (not a remount) still shows "Due
  today" and the "Review queue" card in agreement — the round 19 fix holds.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 19's, which remains green: lint 0 errors (4
  pre-existing warnings in the touched file), typecheck 8/8 packages,
  105/105 mobile tests.
- All checks above were live re-verifications against the native
  `org.ummahlibrary.app` build running on `QA_Pixel6`.

## Verdict

Zero new bugs found — round 1 of the 3-in-a-row stop condition (following
round 19's fix).
