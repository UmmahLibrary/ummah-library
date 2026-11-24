# Manual E2E QA — Round 127 (2026-11-24)

Iteration 59/100. Area: unknown and out-of-range URLs.

## Findings

None this round.

## Investigated, no bug found

`/nope`, `/surah/0`, `/surah/115`, `/surah/abc`, `/juz/31`, `/page/0`,
`/page/605`, `/kids/2` (not a kids surah), `/plans/bogus`, `/listen/115`,
`/blog/nope`, `/hifz/nope`: every one answers HTTP 404 with the titled "Page not
found" page (٤٠٤, "← Back to home", "Search the Quran").

## Verification

No code changes.

## Verdict

Clean.
