# Manual E2E QA — Round 103 (2026-11-24)

Iteration 35/100. Area: round 102's digit problem in the app's other numeric
fields (web `inputMode`/`type="number"`, mobile number pads).

## Findings

### 1. Mobile custom reading plan rejected Arabic-Indic digits — FIXED

- **Where:** [`PlansScreen.tsx`](../../apps/mobile/src/screens/PlansScreen.tsx)
- **Symptom (from source):** the custom plan's "pages a day" / "days" fields use
  `keyboardType="number-pad"`, which on an Arabic or Urdu keyboard types ١٢٣;
  `Number("٩٠")` is `NaN` → 0, so the plan failed validation with an error.
- **Fix:** both values go through core `toWesternDigits` (already used by Go to
  and now the zakat parser) before `Number()`.
- **Regression test:** `toWesternDigits` is covered in `core/goto.test.ts`; the
  screen has no component harness on mobile.

## Investigated, no bug found

Web: the plan form uses `type="number"`, which the browser normalises; Go to
already converts Arabic-Indic digits (core); Zakat fixed in round 102.

## Verification

mobile `tsc`, ESLint clean.

## Verdict

One real bug, fixed.
