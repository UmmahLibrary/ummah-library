# Manual E2E QA — Round 146 (2026-11-24)

Iteration 78/100. Area: sajdah (prostration) āyāt in the reader.

## Findings

None fixed this round.

## Investigated — a gap for the roadmap, not a regression

The bundled Tanzil Uthmani text carries no sajdah sign (۩, U+06E9; e.g. 7:206
ends "يَسْجُدُونَ" with nothing after), and no code in core, web or mobile
knows the sajdah positions, so the reader never marks them — printed muṣḥafs
and most Quran apps do. The positions are standard structural metadata (Tanzil
publishes them), but the schools differ on which are obligatory (e.g. 22:77 and
38:24), so choosing and labelling them is a content decision for scholarly
review (AGENTS.md), not something to author in a QA pass. Recorded for the
roadmap.

## Verification

No code changes.

## Verdict

Clean (feature gap noted).
