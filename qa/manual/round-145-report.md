# Manual E2E QA — Round 145 (2026-11-24)

Iteration 77/100. Area: integrity of the bundled adhkār (`adhkar.json`).

## Findings

None fixed this round.

## Investigated, no bug found

- 85 adhkār, unique ids; every one has Arabic, a translation and a repeat
  count > 0. Occasions: morning 26, evening 24, after-ṣalāh 13, daily 17,
  eating/home/travel 4 each, distress 5, dressing 2, sleep and waking 1.
- Three after-ṣalāh entries — `as-5` subḥān Allāh, `as-6` al-ḥamdu lillāh,
  `as-7` Allāhu akbar (the 33/33/33/34 set) — carry no `source`. They come from
  the attributed upstream set (fitrahive/dua-dhikr, from Ḥiṣn al-Muslim); adding
  a reference is a content change for scholarly review, so it is noted here
  rather than authored.

## Verification

No code changes.

## Verdict

Clean (one content note for `needs-scholar-review`).
