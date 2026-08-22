# Manual E2E QA — Round 31 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Prayer Tracker and Qibla screens.

## Findings

None this round.

## Investigated, no bug found

- **Prayer Tracker "tap to log" cycle**: tapping a prayer's circle correctly
  cycles `none → on time → late → none → …`; stats (Prayed today, On time %,
  the 7-day grid cell) all updated in step with each tap. An initial
  side-by-side screenshot comparison made the third tap (late → none) look
  like a no-op, but a slower re-test through the same four taps showed the
  full correct cycle (on time → late → none → on time) — a stale-screenshot
  timing artifact (the same class of artifact documented in round 24), not
  an app bug.
- **Qibla screen showing "0° N"**: initially looked wrong — a bearing of
  exactly due north seemed too convenient to be a real great-circle
  calculation to Mecca from an arbitrary point. Traced through
  [packages/core/src/qibla.ts](../../packages/core/src/qibla.ts):
  `qiblaDirection()` has a documented special case, `if (y === 0 && x === 0)
  return 0` — "at the Kaaba itself the bearing is undefined." Checked the
  emulator's actual mock location via `adb shell dumpsys location`: it's
  set to `21.422498, 39.826200`, which **is** the Kaaba's own coordinates
  (`KAABA = { latitude: 21.4225, longitude: 39.8262 }` in the same file) —
  this `QA_Pixel6` emulator's location happens to be configured at Mecca
  itself, so "0° N" is the correct, documented output for that exact input,
  not a computation bug. Re-confirmed the Prayer Times screen's times
  (Fajr 4:44 AM, Maghrib 6:46 PM) are consistent with a low-latitude
  location near the equator, matching Mecca's own timezone — corroborating
  evidence, not a separate check.
- **Qibla compass dial / "Update location" chip**: renders correctly;
  re-fetching location correctly re-persists to the same `KEYS.prayerCoords`
  storage key the Prayer Times screen reads, keeping both screens in sync.

## Verification

No code changes this round — investigation only, no fix needed.

## Verdict

No bugs found this round. Clean-streak: 1/3 (round 30 found a bug; this
round is now clean).
