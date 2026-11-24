# Manual E2E QA — Round 116 (2026-11-24)

Iteration 48/100. Area: round 115's toggle-naming check on mobile.

## Findings

### 1. Mobile reminder bells contradicted (or omitted) their state — FIXED

- **Where:** [`PrayerTimesScreen.tsx`](../../apps/mobile/src/screens/PrayerTimesScreen.tsx),
  [`HijriCalendarScreen.tsx`](../../apps/mobile/src/screens/HijriCalendarScreen.tsx)
- **Symptom:** Prayer times' bell is a `switch` with `checked`, but its name
  flipped to "Turn off reminder for Fajr" — TalkBack: "Turn off reminder for
  Fajr, switch, on". The calendar's observance bell had **no role or state** at
  all, so it wasn't announced as a control.
- **Fix:** both are switches with `checked` state under the fixed name from the
  existing `pr.reminderFor` string ("Fajr reminder", "تذكير …") — no new
  translations needed.

## Verification

mobile `tsc`, ESLint clean; mobile suite 204/204 (round 115 run).

## Verdict

One real accessibility bug (two controls), fixed.
