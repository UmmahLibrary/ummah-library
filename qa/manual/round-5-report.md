# Manual E2E QA — Round 5 (2026-08-21)

Areas covered this round: re-verification of the two previously-fixed Zakat bugs
(reset preserving gold/silver prices, negative amounts blocked) together in one flow,
and Tasbih per-phrase counter persistence.

## Findings

None this round.

## Investigated, no bug found

- **Zakat calculator:** set gold price to 75/gram, typed `-500` into "Cash & bank
  balances" — the `-` was correctly stripped at input time (field held `500`, not a
  silently-dropped negative), and "Total assets" showed the correct `$500.00`.
  Clicking "Reset amounts" cleared the asset field back to empty while the gold price
  (`75`) was preserved — both previously-shipped fixes (`71b7b67`) hold correctly
  together in the same session.
- **Tasbih counter:** tapped the dial 6 times on SubḥānAllāh, switched to
  Alḥamdulillāh (correctly reset to 0), switched back to SubḥānAllāh (correctly
  showed 6 — untouched by the detour). Confirms the per-phrase state fix
  (`ccd8701`) still holds.
- **A tooling false alarm, noted for the record:** dispatching several rapid
  `element.click()` calls in a `javascript_tool` script and reading
  `element.getAttribute('aria-label')` back *in the same synchronous script* initially
  appeared to show the counter stuck at 0 (then later 5, expected 6) — this was purely
  a read-before-React-flush race in my own test script, not the app: a follow-up
  `javascript_tool` call issued as a separate step correctly showed the counter at the
  right value every time. Matches the QA-loop guidance to re-verify with a single
  clean action + read rather than concluding from a read taken mid-interaction.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was needed
  beyond round 3's (last round with a code change), which remains green: lint 0
  errors, typecheck clean, 410/410 tests, clean build.
- All checks above were live re-verifications against the running dev server.

## Verdict

Zero new bugs found — round 2 of the 3-in-a-row stop condition (following round 4's
clean round). Continuing to round 6.
