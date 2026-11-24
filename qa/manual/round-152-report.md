# Manual E2E QA — Round 152 (2026-11-24)

Iteration 84/100. Area: the links the reader hands out — "Copy link" (web) and
"Share" (mobile).

## Findings

None this round.

## Investigated, no bug found

- Web Copy link: `${location.origin}/surah/N#N:A` — the reader's own hash
  format, from whatever origin you're on (so a preview deploy shares preview
  links), and it also writes the hash so a refresh keeps the place.
- Mobile Share: `https://ummahlibrary.org/surah/N#N:A` plus the āyah text with
  blank translations filtered out (round 151's concern doesn't apply).
- Extension links (round 129) use the same formats.

## Verification

No code changes.

## Verdict

Clean.
