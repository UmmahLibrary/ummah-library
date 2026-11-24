# Manual E2E QA — Round 149 (2026-11-24)

Iteration 81/100. Area: the Juzʾ reader's per-āyah actions, compared with the
surah reader.

## Findings

### 1. The Juzʾ reader offered only "▶ Play" under each āyah — FIXED

- **Where:** [`app/juz/[number]/page.tsx`](../../apps/web/src/app/juz/[number]/page.tsx)
- **Symptom:** in `/juz/22` an āyah had a play marker and a "▶ Play" button —
  no Save, Tafsir, Related or More. Someone reading their daily juzʾ (the most
  common Ramaḍān pattern) couldn't bookmark an āyah, write a note, open its
  tafsir or share it without switching to the surah reader.
- **Fix:** the juzʾ page renders the same `AyahActions` row as the surah reader
  (its Play keeps `data-play-one`, so the dock's audio still drives it).
- **Verification:** live — 33:31 shows Play · Save · Tafsir · Related · More;
  Tafsir opens the Muyassar commentary; Play carries `data-play-one="33:31"`.

## Verification

`tsc`, ESLint clean; no e2e spec depends on the old juzʾ button.

## Verdict

One real feature-parity bug, fixed.
