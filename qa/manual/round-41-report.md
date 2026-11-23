# Manual E2E QA — Round 41 (2026-11-23)

A full first-run setup from a cleared device (all six steps, Back, every kind
of choice) and the Today card that follows it.

## Findings

### 1. "I mostly listen — Home will lead with recitation" had no effect — FIXED

- **Where:** [HomeToday.tsx](../../apps/web/src/components/HomeToday.tsx)
- **Symptom:** after choosing "I mostly listen" in setup step 6, Today still
  led with the gold "Read Al-Fātiḥah" (and, once reading, gold "Continue" with
  "Listen instead" second).
- **Root cause:** the choice is saved as `comfort.readingPath = "listen"`, but
  nothing in the app read `readingPath` — the setup made a promise the Home
  screen never kept.
- **Fix:** Today reads it: for listen-first readers the listen action is gold
  and comes first (in DOM order, so keyboard and screen-reader order match the
  visual order), with read/continue second; everyone else is unchanged. The
  pair is one small `ReadListenPair` component used by both the start and
  continue cards.
- **Verification:** live after setup with "I mostly listen": "Listen to
  Al-Ikhlāṣ" (gold) then "Read Al-Fātiḥah".
- **Regression tests:** "Today — the setup's reading path decides which action
  leads" in [NoorHomePage.test.tsx](../../apps/web/src/components/NoorHomePage.test.tsx).

## Investigated, no bug found

- Setup: six steps in order (language, script, translation, size, light/dark,
  reading path); choosing a language or script advances; Back keeps the earlier
  choice (IndoPak stayed pressed); "Light" applies Ivory immediately; "Start
  reading" closes setup and saves `setupDone`; "Skip, use these settings"
  works from any step. The speak button is labelled "Read this question
  aloud".
- `ul.onboarded` cleared → setup shows again; after finishing it does not.

## Verification

- Web `tsc` clean; prettier clean; NoorHomePage tests (11) pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
