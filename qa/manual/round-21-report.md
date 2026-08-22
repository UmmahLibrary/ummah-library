# Manual E2E QA — Round 21 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered two Tools screens not yet exercised natively: Adhkar
(remembrance categories, tap-to-count progress) and the Zakat Calculator
(niṣāb price entry, live calculation).

## Findings

None this round.

## Investigated, no bug found

- **Adhkar:** category tabs (Morning/Evening/After Prayer/Waking/Sleep/etc.)
  render correctly with Arabic, transliteration, translation, and a hadith
  reference for each dhikr. "Tap to count" correctly increments an
  individual dhikr's repetition counter (0/1 → 1/1, entry highlighted gold,
  "✓ Done") and the category-wide "N / 26 done" progress bar at the top
  updates in lockstep (0/26 → 1/26).
- **Zakat Calculator:** entering gold/silver prices per gram correctly
  computes and displays the silver niṣāb threshold (595 g equivalent — the
  displayed $520.51 matches 612.36 g × $0.85, i.e. this build's niṣāb
  constant), shows the appropriate "Net wealth is below the niṣāb — no
  zakat due" messaging with zero assets entered, and the entered prices
  persist correctly across screen navigation (verified by leaving and
  re-entering the screen). No crash or state corruption from any input
  sequence tried.
- **Testing-method note (not an app issue):** on this 1080×2400 emulator,
  the on-screen numeric keyboard covers roughly the bottom half of the
  screen (below y≈1360) whenever a Zakat input field is focused. A `tap`
  aimed at a lower field (e.g. "Silver per gram") while the keyboard from a
  higher field (e.g. "Currency") is still open lands on a keyboard key
  instead, not the intended field — producing garbled input that looked
  like an app bug at first glance until re-verified with a clean
  dismiss-keyboard-between-fields sequence. Recorded here per this loop's
  standing methodology note so a future round doesn't waste time
  rediscovering it.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 19's, which remains green: lint 0 errors (4
  pre-existing warnings in the touched file), typecheck 8/8 packages,
  105/105 mobile tests.
- All checks above were live re-verifications against the native
  `org.ummahlibrary.app` build running on `QA_Pixel6`.

## Verdict

Zero new bugs found — round 2 of the 3-in-a-row stop condition (following
round 19's fix).
