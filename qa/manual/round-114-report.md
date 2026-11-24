# Manual E2E QA — Round 114 (2026-11-24)

Iteration 46/100. Area: round 113's check on the Hijri calendar's observance
bells.

## Findings

### 1. Observance reminders also turned on silently with notifications blocked — FIXED

- **Where:** [`HijriCalendar.tsx`](../../apps/web/src/components/HijriCalendar.tsx)
- **Fix:** the same "Notifications are blocked in your browser…" status line
  under the observances while any reminder is on and permission is denied.

### 2. The bell's accessible name flipped along with its state — FIXED

- **Symptom:** the button was named "Turn on reminder for X" / "Turn off
  reminder for X" *and* had `aria-pressed` — a screen reader heard "Turn off
  reminder for Ramaḍān, pressed": the name and the state contradict each other.
- **Fix:** a constant name, "Remind me about X"; `aria-pressed` says on/off.

**Regression test:** `HijriCalendar.test.tsx` "keeps the bell's name fixed
(aria-pressed carries on/off) and flags blocked notifications".

## Verification

Tests 2/2; `tsc`, ESLint clean.

## Verdict

Two real bugs, fixed.
