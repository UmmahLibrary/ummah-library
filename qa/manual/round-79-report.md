# Manual E2E QA — Round 79 (2026-11-24)

Iteration 11/100. Area: the Duʿās page — content integrity and navigation.

## Findings

### 1. A duʿā's reference couldn't be opened in the reader — FIXED (web)

- **Where:** [`DuasView.tsx`](../../apps/web/src/components/DuasView.tsx), [`core/duas.ts`](../../packages/core/src/duas.ts)
- **Symptom:** "Al-Baqarah 2:286" etc. were plain text, so reading a Qurʾānic
  duʿā in its context meant finding the surah and scrolling by hand. Every
  other āyah reference in the app (search, bookmarks, Related) opens the reader.
- **Fix:** core `duaVerse()` parses the reference (a range like 20:25–26 starts
  at 20:25); each reference is now a link to `/surah/N#N:A` named
  "Al-Baqarah 2:286 — read in context" (starts with its visible text).
- **Verification:** live — clicking 2:286 lands with that āyah 80px from the top.
- **Regression test:** `core/duas.test.ts` "points every duʿā at the āyah it starts on".

## Investigated, no bug found

- All 10 duʿās' Arabic checked against the bundled Tanzil text (diacritics and
  alif forms normalised): every one is a verbatim span of the cited āyah(s).
- Mobile Duʿās has the same plain references; left for a mobile pass (the
  reader route takes a surah but no āyah to land on).

## Verification

core tests 7/7; web `tsc`, ESLint clean.

## Verdict

One UX gap, fixed on web.
