# Manual E2E QA — Round 120 (2026-11-24)

Iteration 52/100. Area: the children's reader (`/kids/112`).

## Findings

### 1. The "play this āyah" buttons were small 28px targets on the children's page — FIXED

- **Where:** [`KidsReader.tsx`](../../apps/web/src/components/KidsReader.tsx), `globals.css`
- **Symptom:** the page promises "big buttons", but each āyah's play control is
  the reader's shared 1rem ﴿n﴾ marker: 28px tall — hard for small fingers.
  "I finished this surah" and "Choose another surah" are 60–64px.
- **Fix:** a `kids-play` modifier: 1.6rem, at least 48×48 (now 68×53), inside
  the ~95px Arabic line so the layout doesn't move. The adult reader keeps its
  inline marker.
- **Verification:** live measurement and screenshot.

## Investigated, no bug found

Each play button has a screen-reader name ("Play āyah 1"); the header says
"Tap a word to hear it".

## Verification

ESLint clean. (Styling only; no unit test can measure CSS layout in jsdom.)

## Verdict

One real UX bug, fixed.
