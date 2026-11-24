# Manual E2E QA — Round 115 (2026-11-24)

Iteration 47/100. Area: round 114's naming bug across every `aria-pressed`
toggle in the web app.

## Findings

### 1. Four more toggles stated their state twice, sometimes in contradiction — FIXED

- **Where:** [`PrayerTimesView.tsx`](../../apps/web/src/components/PrayerTimesView.tsx)
  (per-prayer reminder bell), [`ReadingAudio.tsx`](../../apps/web/src/components/ReadingAudio.tsx)
  (dock Play/Pause), [`SpeakButton.tsx`](../../apps/web/src/components/SpeakButton.tsx)
  (read-aloud), [`RamadanView.tsx`](../../apps/web/src/components/RamadanView.tsx) (fast days)
- **Symptom:** "Turn off the Fajr reminder, pressed", "Pause, pressed",
  "Stop reading, pressed", "Fast day 5 done, pressed".
- **Fix:** bell and fast days keep a fixed name ("Fajr reminder", "Fast day 5")
  with `aria-pressed`; Play/Pause and read-aloud keep their flipping media-style
  name and drop `aria-pressed`.
- **Regression test:** new `components/toggle-names.test.ts` fails if any
  `aria-pressed=` sits next to a ternary `aria-label` (it caught the bell before
  the fix).

## Verification

All component tests pass; `tsc`, ESLint clean.

## Verdict

One real accessibility pattern bug (four controls), fixed with a guard test.
