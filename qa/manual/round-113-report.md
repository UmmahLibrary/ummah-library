# Manual E2E QA — Round 113 (2026-11-24)

Iteration 45/100. Area: the reminder toggles when the browser has blocked
notifications (plan, adhkār, sunnah fasts, Hijri observances, prayer times).

## Findings

### 1. Adhkār and sunnah-fast reminders turned "On" silently with notifications blocked — FIXED

- **Where:** [`AdhkarReminderToggle.tsx`](../../apps/web/src/components/AdhkarReminderToggle.tsx),
  [`SunnahFastReminderToggle.tsx`](../../apps/web/src/components/SunnahFastReminderToggle.tsx)
- **Symptom:** with `Notification.permission === "denied"` the toggle showed
  🔔 On and nothing else, though no system notification can ever arrive (only
  the in-app banner while the tab is open). Plan reminders and Prayer times
  already say "Notifications are blocked in your browser…".
- **Fix:** the same notice (as `role="status"`) under both toggles while on and blocked.
- **Regression test:** `SunnahFastReminderToggle.test.tsx` "says so when reminders
  are on but the browser blocks notifications".

## Investigated, no bug found

Plan reminders and Prayer-time alerts already show the blocked notice; the
Hijri observance bell only asks when permission is "default".

## Verification

Tests 2/2; `tsc`, ESLint clean.

## Verdict

One real UX bug (two toggles), fixed.
