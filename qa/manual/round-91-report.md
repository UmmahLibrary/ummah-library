# Manual E2E QA — Round 91 (2026-11-24)

Iteration 23/100. Area: the reader's Recite (hide & peek) mode on Al-Ikhlāṣ —
the dock's Recite button and its tray.

## Findings

None this round.

## Investigated, no bug found

- Recite turns `aria-pressed` on and blurs every word (`blur(7px)`); the tray is
  a labelled group ("Recite from memory").
- Peek word → 1000, again → 1100; Reveal āyah → 1111 (rest of āyah 1); Show all
  → every word; Hide all → none; Done removes the tray and all `w--peek` classes.
- A first pass seemed to show "Show all" and "Peek word" doing nothing — the
  check read computed `filter` 300 ms after each click, mid CSS transition.
  Re-checked on the `w--peek` classes: all correct. A testing artifact.
- With the tray open, the last āyah's actions (bottom 421px) still scroll clear
  of the tray (top 587px).

## Verification

No code changes.

## Verdict

Clean.
