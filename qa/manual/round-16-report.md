# Manual E2E QA - Round 16 (2026-08-21)

Areas covered this round: 99 Names (mark-a-name flow, cross-screen
aggregation into "Your journey"), and Hadith.

## Findings

None this round.

## Investigated, no bug found

- **99 Names:** tapping "Ar-Raḥmān" correctly moved the count from "0 of
  99 learned" to "1 of 99 learned".
- **"Your journey" (mobile's profile/stats aggregation screen) cross-check:**
  reflected every stat correctly and consistently with what was set up
  across this entire session's rounds — 3 āyāt memorized (round 8's Hifz
  testing), 1 surah started, 1 saved verse (round 7's bookmark test), 1/99
  names learned (this round), 1-day streaks, and 2/13 achievements
  unlocked ("First āyah", "Surah starter"). Nothing double-counted,
  nothing missing.
- **Hadith:** Sahih al-Bukhari Book 1 (Revelation) loads with real hadith
  text, narrator chains, English translation, and correct
  collection/number references (e.g. "Sahih al-Bukhari 1", "...2", "...3").

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 13's (last round with a code change), which remains
  green: lint 0 errors, typecheck clean, 105/105 mobile tests / 415/415
  web tests, clean build.
- All checks above were live re-verifications against the running Expo web
  dev server.

## Verdict

Zero new bugs found — round 3 of the 3-in-a-row stop condition (following
rounds 14 and 15). This satisfies the loop's stop condition.
