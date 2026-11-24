# Manual E2E QA — Round 131 (2026-11-24)

Iteration 63/100. Area: the production build — `next build` + `next start` of
this branch in the isolated verify worktree (`../ummah-library-verify`,
`node-linker=isolated`), then the service worker live.

## Findings

None this round.

## Investigated, no bug found

- `next build` succeeds (all routes static/SSG as before; `/tafsir` is now a
  2.9 kB static page with its surah list).
- Service worker on `localhost:3001`: the new `sw.js` (round 93) installed and
  activated; the origin's existing **`ul-audio-v1` survived the update** — the
  data-loss scenario fixed in round 93, observed for real.
- Fetching a tafsir and a Related-hadith API put both in `ul-api-v1`;
  `prayer-times` (coordinates) was not cached.
- Production responses: sitemap 782 URLs; `/`, `/tafsir`, `/hadith`, `/prayer`,
  `/surah/2`, `/search` 200; `/api/v1/places/nearby` with no coordinates 400;
  Tromsø prayer times 200; `/hadith` canonical present.

## Verification

No code changes. The temporary launch entry was reverted.

## Verdict

Clean.
