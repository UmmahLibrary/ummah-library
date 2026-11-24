# Manual E2E QA — Round 142 (2026-11-24)

Iteration 74/100. Area: data integrity of the Related-hadith dataset
(`verse-hadith-links.json`, ADR 0044) against the bundled hadith collections.

## Findings

None this round.

## Investigated, no bug found

- All **1,389** links point at a hadith that exists (collection + number).
- In every one, the stored matched span appears in that hadith's Arabic once
  both are normalised the way the matcher does (diacritics and tatweel removed;
  alif forms → ا; ى → ي; ة → ه; ئ/ؤ → ي/و; hamza dropped). A first pass that
  skipped the hamza-seat step reported 210 "misses" — e.g. 2:158 in Bukhārī
  1643, whose text plainly quotes the āyah — a checker artefact, not data error.

## Verification

No code changes.

## Verdict

Clean.
