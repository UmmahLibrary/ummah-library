# Manual E2E QA — Round 153 (2026-11-24)

Iteration 85/100. Area: keyboard behaviour of the app's radio groups — the plan
reminder time ("When to remind me"), Settings → Quran script, and the
translation chooser.

## Findings

### 1. Radio groups announced as radios but behaved like a row of buttons — FIXED

- **Where:** [`PlanReminderToggle.tsx`](../../apps/web/src/components/PlanReminderToggle.tsx),
  [`SettingsView.tsx`](../../apps/web/src/components/SettingsView.tsx) (script),
  [`TranslationChoice.tsx`](../../apps/web/src/components/TranslationChoice.tsx)
- **Symptom:** `role="radiogroup"` / `role="radio"` tell a screen reader "radio
  button, 2 of 5 — use arrow keys", but arrows did nothing and every option was
  its own Tab stop (the translation chooser lists dozens, so Tab had to walk them
  all to leave).
- **Fix:** new [`lib/radio-group.ts`](../../apps/web/src/lib/radio-group.ts):
  `onRadioGroupKeyDown` (arrows move and select, wrapping; Home/End; Left/Right
  mirrored in RTL) and `radioTabIndex` (only the checked option — or the first —
  is tabbable). All three groups use it.
- **Regression test:** new `lib/radio-group.test.tsx` "is one tab stop, and
  arrows move and select (wrapping)".

## Verification

Radio-group + Settings/Plans/Onboarding tests pass; `tsc`, ESLint clean.

## Verdict

One real accessibility bug (three groups), fixed with a shared helper.
