# Manual E2E QA — Round 30 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Prayer Times screen.

## Findings

### 1. Every prayer time wrapped "AM"/"PM" onto its own line, splitting the letters - FIXED

- **Where:** [apps/mobile/src/screens/PrayerTimesScreen.tsx:410](../../apps/mobile/src/screens/PrayerTimesScreen.tsx#L410)
- **Symptom:** On the Prayer Times list, every row's time column (Fajr,
  Sunrise, Dhuhr, Asr, Maghrib, Isha, and the Night section's Imsāk /
  Islamic midnight / Last third) wrapped mid-string: "4:44 AM" rendered as
  "4:44 A" on one line and "M" alone on the next, "12:25 PM" as "12:25 P" /
  "M", etc. — on every single row, on the device's default font scale.
- **Root cause:** `prayerTime`'s style hardcoded `width: 56`, too narrow
  to fit `fmtPrayerTime()`'s output (`toLocaleTimeString` with
  `hour: "2-digit", minute: "2-digit"`, e.g. "12:25 PM" — 8 characters) at
  `fontSize: 16` semibold, so React Native wrapped the `Text` onto a
  second line and split the two-letter meridiem across the break.
- **Fix:** Widened `prayerTime` from `width: 56` to `width: 78` — enough
  for the longest realistic value ("12:25 PM") with headroom, while
  `prayerName`'s `flex: 1` absorbs the few extra pixels without disturbing
  the row layout.
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6`: reproduced the wrap on all seven visible
  rows before the fix; after the fix, every time (4:44 AM, 6:01 AM,
  12:25 PM, 3:47 PM, 6:46 PM, 7:58 PM, 4:34 AM, 11:46 PM, 1:25 AM) renders
  on a single line.
- **Regression test:** None added — no test harness exists for mobile
  screen components in this repo (confirmed in round 23); the live
  re-verification above is the practical check available.

## Investigated, no bug found

- **"Use my location" flow**: requests device location, resolves, and
  populates the full prayer-times list including the "Next · Maghrib · 8m"
  countdown hero card — all correct.
- **Per-prayer reminder bell icons**: present on all five obligatory
  prayers (not on Sunrise/Night section, correctly — those aren't
  salah times).

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.

## Verdict

One real bug found and fixed this round (prayer-time text wrapping/
splitting on every row). Restarting the 3-in-a-row clean-streak count at
zero.
