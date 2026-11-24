# Manual E2E QA — Round 102 (2026-11-24)

Iteration 34/100. Area: the Zakat calculator with amounts typed the way people
in the app's six languages type them.

## Findings

### 1. Arabic-Indic digits were wiped from every amount field — FIXED (web + mobile)

- **Where:** [`ZakatCalculator.tsx`](../../apps/web/src/components/ZakatCalculator.tsx),
  [`ZakatScreen.tsx`](../../apps/mobile/src/screens/ZakatScreen.tsx)
- **Symptom:** typing `١٠٠٠٠` (an Arabic or Urdu keyboard's digits) left the
  field empty — the sanitizer kept only `[0-9.]`.

### 2. A decimal comma multiplied the amount by 10–100 — FIXED (web + mobile)

- **Symptom:** Turkish/Indonesian `10,5` became `105`; `1.000,50` became
  `1.00050` (≈ 1). Commas were stripped and the first dot kept.
- **Fix (both):** new pure [`core/amount-input.ts`](../../packages/core/src/amount-input.ts):
  `sanitizeAmountInput` (maps Arabic-Indic/Persian digits and `٫`/`٬`, keeps
  digits, `.` and `,`, never a minus) while typing, and `parseAmount` when
  calculating — the last of `.`/`,` is the decimal separator when both appear,
  a lone comma followed by 1–2 digits is a decimal comma, otherwise commas (and
  `1.500.000`-style dots) group thousands. The currency field also drops
  Arabic-Indic digits now.
- **Verification:** live — `١٠٬٠٠٠٫٥` reads as 10,000.50 and zakat $250.01.
- **Regression tests:** `core/amount-input.test.ts` (15 cases),
  `ZakatCalculator.test.tsx` "accepts Arabic-Indic digits and a decimal comma".

## Verification

core 15/15, Zakat web 5/5, mobile suite 204/204; typecheck core/web/mobile;
ESLint clean.

## Verdict

Two real bugs (one a 10–100× miscalculation), fixed on both apps.
