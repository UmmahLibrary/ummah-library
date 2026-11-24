# Manual E2E QA — Round 98 (2026-11-24)

Iteration 30/100. Area: round 97's geolocation-error bug in the other two places
that ask for a location — Prayer Times and Qibla.

## Findings

### 1. Prayer Times and Qibla also called every location failure a denied permission — FIXED

- **Where:** [`PrayerTimesView.tsx`](../../apps/web/src/components/PrayerTimesView.tsx),
  [`QiblaCompass.tsx`](../../apps/web/src/components/QiblaCompass.tsx)
- **Symptom:** same `() => setStatus("denied")` error callback: a timeout or
  location services switched off showed "Location permission was denied".
- **Fix:** code 1 → denied; otherwise Qibla shows its existing "Couldn't
  determine your location", Prayer Times a new "Couldn't get your location.
  Check that location services are turned on" card with Try again. All these
  cards and messages are now `role="alert"`.
- **Regression test:** `QiblaCompass.test.tsx` "doesn't call a timeout a denied permission".

## Verification

QiblaCompass tests 4/4; `tsc`, ESLint clean.

## Verdict

One real bug (two screens), fixed.
