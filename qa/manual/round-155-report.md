# Manual E2E QA — Round 155 (2026-11-24)

Iteration 87/100. Area: the shared segmented control `Seg` (web + native),
following rounds 153–154's widget-pattern checks.

## Findings

None this round.

## Investigated, no bug found

Web `Seg` is a labelled `role="group"` of buttons with `aria-pressed`; native is
a labelled container of `button`s with `accessibilityState.selected`. Neither
claims a radio or tab role, so neither owes arrow-key behaviour — plain
toggle buttons in Tab order are the correct, honest pattern here.

## Verification

No code changes.

## Verdict

Clean.
