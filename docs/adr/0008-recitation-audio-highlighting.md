# ADR 0008 — Recitation audio + word-by-word highlighting

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

The reader plays per-ayah audio and should **highlight the word being recited**.
Word highlighting needs word-level **timing** (which word at which millisecond),
and the displayed words must align with that timing. Our displayed Arabic is the
Tanzil text (0002); per-ayah audio comes from a reciter plugin (0005, EveryAyah),
which has **no** word timings.

## Decision

- Per-ayah playback uses the reciter plugin's `audioUrlTemplate` (EveryAyah). The
  player (`ReadingAudio`) plays an **ordered list of verses that may cross surah
  boundaries**, so single-ayah, play-from-here, full-surah, and full-juzʾ playback
  share one engine.
- For **word highlighting**, a reciter plugin may declare a **`quranComId`**. When
  present, the player fetches that verse's audio **and word `segments`** from the
  **quran.com API** (CORS-open, cached) and plays **that timed audio**, then
  highlights the active word on `timeupdate`.
- The displayed Tanzil ayah is split into word spans; our word splitting **aligns
  1:1 with quran.com's word positions** (verified across a sample), so the static
  Tanzil text stays — no remote text is swapped in.
- If a reciter has no timing (or the fetch fails), playback **falls back** to the
  plugin URL with no highlighting.

## Consequences

- Highlighting requires being online and a reciter with timing; the reading text
  remains static/offline (0003).
- When highlighting, the **audio source is quran.com** (so timings match), not the
  plugin's EveryAyah URL. Adding a timed reciter is a one-field manifest change.
