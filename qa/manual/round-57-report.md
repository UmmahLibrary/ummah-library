# Manual E2E QA — Round 57 (2026-11-23)

Keyboard and screen-reader behaviour of the first-run setup dialog on the
production build, plus a console check.

## Findings

None this round.

## Investigated, no bug found

- The setup is a `role="dialog"` with `aria-modal="true"`, labelled by its
  step title (`ul-setup-title`); focus starts inside it (on Next).
- Twelve Tab presses keep focus inside the dialog (it cycles back to the
  language choices) — the page behind can't be reached.
- Language choices expose `aria-pressed` (English `true`, others `false`);
  the speak button is labelled; "Skip, use these settings" closes it.
- No console errors on the production tab across this and the previous round.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 2/3.
