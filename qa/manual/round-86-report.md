# Manual E2E QA — Round 86 (2026-11-24)

Iteration 18/100. Area: the Prayer Tracker (`/tracker`) — today's log cycle,
the 7-day grid, qaḍāʾ counters; then the mobile tracker's grid.

## Findings

### 1. The 7-day grid's cells couldn't be told apart by a screen reader — FIXED (web + mobile)

- **Where:** [`PrayerTracker.tsx`](../../apps/web/src/components/PrayerTracker.tsx),
  [`PrayerTrackerScreen.tsx`](../../apps/mobile/src/screens/PrayerTrackerScreen.tsx)
- **Symptom:** web cells were named "Fajr · T: Not yet" — the narrow weekday,
  so Tuesday/Thursday and Saturday/Sunday read the same. On mobile every cell in
  a row was just "Fajr: Not yet — tap to change", no day at all.
- **Fix:** web names cells "Fajr · Wed, Nov 18: …" (tooltip too); mobile
  prefixes the localized date into the existing `pr.cellA11y` name (no new
  strings to translate).
- **Regression test:** `PrayerTracker.test.tsx` asserts yesterday's cell carries
  its full date.

## Investigated, no bug found

Today's cycle Not yet → On time → Late → Not yet updates "Prayed today" and
"On time (30d)" correctly; qaḍāʾ steppers labelled; no unlabelled buttons (52).

## Verification

Tests 4/4; typecheck web + mobile; ESLint clean.

## Verdict

One real accessibility bug, fixed on both apps.
