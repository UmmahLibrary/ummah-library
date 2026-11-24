# Manual E2E QA — Round 140 (2026-11-24)

Iteration 72/100. Area: the Ramaḍān page outside Ramaḍān (today is 13 Jumādā
al-Ākhirah).

## Findings

### 1. "Today's worship" (Suhūr, Tarāwīḥ…) was offered all year — FIXED (web + mobile)

- **Where:** [`RamadanView.tsx`](../../apps/web/src/components/RamadanView.tsx),
  [`RamadanScreen.tsx`](../../apps/mobile/src/screens/RamadanScreen.tsx)
- **Symptom:** in Jumādā al-Ākhirah the page invited you to tick Suhūr, Fajr in
  jamāʿah, a Qurʾān juzʾ and Tarāwīḥ for "today", and showed "0/4 Today's
  worship" — logging Ramaḍān worship on an ordinary day. ("Day of Ramaḍān"
  already showed "—" out of season.)
- **Fix:** the checklist appears only during Ramaḍān; out of season its stat
  reads "—". The fasting grid stays (it refers to the Ramaḍān just gone, round 76).
- **Regression test:** new `RamadanView.test.tsx` "offers the daily worship
  checklist only during Ramaḍān" (Nov 2026: no Tarāwīḥ button; Feb 2027: there).

## Verification

Test passes; typecheck web + mobile; ESLint 0 errors (one pre-existing hooks
warning on mobile).

## Verdict

One real UX bug, fixed on both apps.
