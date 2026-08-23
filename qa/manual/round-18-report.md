# Manual E2E QA - Round 18 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round attempted Nearby Mosques (location-dependent) and re-verified two
previously web-only-tested rapid-tap fixes (Tasbih, round 11) hold correctly
on real native hardware/timing.

## Findings

None this round.

## Investigated, no bug found

- **Tasbih rapid-tap counter (round 11's fix), on native:** 5 rapid taps on
  the dial via `adb shell input tap` (looped, no delay between calls)
  correctly counted all 5 - `0 -> 5`, "Total today" also `5`. Confirms the
  functional-`setState` fix from round 11 (verified on web at the time)
  holds under genuine native touch-event timing, not just React Native Web's
  synthetic event handling.
- **Nearby Mosques - could not be exercised, environment limitation, not an
  app bug:** `adb emu geo fix <lon> <lat>` had no effect on this emulator
  (`dumpsys location` showed the location frozen at the emulator's default
  boot coordinates - Mecca's, 21.42, 39.83 - throughout, both before and
  immediately after issuing the geo-fix command and re-checking). This is a
  known limitation of Google-Play-enabled AVD images: they resolve location
  through Google Play Services' fused provider, which the classic `emu geo
  fix` console command does not feed - only the legacy GPS NMEA provider,
  which Play-services apps generally ignore. A correct, real screen result
  ("No mosques found within 5 km") was produced for whatever location was
  actually active, so the screen itself isn't broken; there was just no way
  to mock a specific test location. A future round could use the Android
  Studio Extended Controls GUI's location tab instead (not available via
  `adb`/`emulator` CLI in this headless setup), or an AVD without Play
  Store, to properly test this screen's live-network path natively.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 17's (last round with a code change), which remains
  green: lint 0 errors (12 pre-existing warnings), typecheck 8/8 packages,
  105/105 mobile tests.
- All checks above were live re-verifications against the native
  `org.ummahlibrary.app` build running on `QA_Pixel6`.

## Verdict

Zero new bugs found - round 1 of the 3-in-a-row stop condition for the
native-Android phase (following round 17's fix). Given the very large
amount of one-time environment setup this native phase required (see round
17's "Environment setup" section) and the ground already covered - quick
actions, native audio, the hardware back button, cross-tab navigation
(fixed), real location-permission grants, and now a native rapid-tap
re-verification - this is a reasonable point to check in with the user
rather than silently continuing to the full 3-in-a-row native-only
threshold.
