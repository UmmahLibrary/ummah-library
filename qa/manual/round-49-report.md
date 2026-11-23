# Manual E2E QA — Round 49 (2026-11-23)

Regression round: re-exercise the flows changed in rounds 34–48 end to end,
and run every package's test suite.

## Findings

None this round.

## Investigated, no bug found

- **Go to** (round 34): on Al-Baqara, "255" + Enter jumps to 2:255, closes the
  sheet, updates the hash and the header ("Āyah 255 of 286").
- **Āyah More menu** (round 34): five `menuitem`s; Memorize adds the āyah to
  Hifz, shows "Added to Hifz" and the ✦ Hifz badge; the menu opens upward when
  its button sits low on screen.
- **Search** (rounds 38/48): "mercy" → 60, Show more (92) → 120, Show more (32)
  → 152, no further button; Adhkār filter → 6 results and `aria-pressed=true`;
  "patience" → 9 results, no Show more.
- **Test suites** (all packages): web 122 files / 566 tests, core 544, data 25,
  adapters 42, ui 79, mobile 203, extension 74 — all pass. (Locally the web,
  ui and extension suites run with a resolver hook that pins React to each
  app's own copy; see round 34. CI needs no hook.)

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 1/3.
