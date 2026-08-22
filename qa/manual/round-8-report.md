# Manual E2E QA - Round 8 (2026-08-21)

Second round on the mobile app. Covered this round: the Hifz (memorize)
flow end-to-end (adding an āyah to memorize, the dashboard, a full review
session with SM-2 grading), plus — after finding one bug there — a targeted
parity check of the same string-formatting pattern on web, since round 7
established that web fixes aren't always mirrored to mobile (and, as this
round shows, the reverse — an unfixed pattern surviving on web even after
being "fixed" elsewhere in the same codebase — is also possible.

## Findings

### 1. "āyahāt" plural typo, present in 3 places across web and mobile - FIXED

- **Where:**
  [apps/mobile/src/screens/HifzReviewScreen.tsx](../../apps/mobile/src/screens/HifzReviewScreen.tsx),
  [apps/mobile/src/screens/HifzDashboardScreen.tsx](../../apps/mobile/src/screens/HifzDashboardScreen.tsx),
  [apps/web/src/components/HifzDashboard.tsx](../../apps/web/src/components/HifzDashboard.tsx)
- **Symptom:** Memorized 3 āyāt on the mobile app (via Expo web) and
  reviewed 2 of them in one session. The dashboard's due-count banner and
  the review-completion message both said "2 āyahāt" instead of the correct
  "2 āyāt".
- **Root cause:** This is the exact typo already found and fixed on web's
  review-completion message in commit `97b34db`
  ("fix(hifz): correct 'āyahāt' to 'āyāt'...") — but that fix only patched
  `apps/web/src/components/HifzReview.tsx`'s completion message. It missed
  three other call sites using the identical broken pattern
  (`` `${n} āyah${n === 1 ? "" : "āt"}` ``, i.e. concatenating the plural
  suffix onto the singular word instead of substituting the correct plural
  word): the *dashboard's* "due" banner on web
  (`HifzDashboard.tsx`), and both the dashboard and the review-completion
  message on the mobile screens, which are separate components from web's
  and never received the `97b34db` fix at all. Web's `HifzReview.tsx` (the
  one file that *was* touched by the original fix) was confirmed still
  correct.
- **Fix:** All three broken call sites now use the same ternary substitution
  already used correctly in web's `HifzReview.tsx`:
  `` {n} {n === 1 ? "āyah" : "āyāt"} `` instead of concatenating a suffix.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm typecheck` (8/8), `pnpm test` (95/95 web incl. 3 new tests, 15/15
  mobile — mobile has no component-test harness so its two fixes aren't
  covered by an automated test, see below), `pnpm build` (clean). Live
  re-verification on the mobile Expo-web dev server: memorized 3 āyāt,
  reviewed 2 in one sitting — dashboard correctly showed "2 āyāt ready for
  review" and the completion screen correctly showed "2 āyāt reviewed · 3
  tracked in total."
- **Regression tests:**
  [apps/web/src/components/HifzDashboard.test.tsx](../../apps/web/src/components/HifzDashboard.test.tsx) (new) —
  seeds 2 due `ul.hifz` records and asserts "2 āyāt ready for review" (and
  the absence of "āyahāt"); a second case checks the singular still reads
  "1 āyah ready for review". Confirmed to fail on the pre-fix
  `HifzDashboard.tsx` (via `git stash`) and pass after.
  [apps/web/src/components/HifzReview.test.tsx](../../apps/web/src/components/HifzReview.test.tsx) (new) —
  seeds 2 due records, mocks the per-surah Arabic-text fetch, drives two
  full reveal-and-rate cycles via `@testing-library/user-event`, and
  asserts the completion message. This file was already correct
  pre-existing web code (not touched by this round's fix), so this test
  documents/locks in correct behavior rather than demonstrating a
  regression.
  The two mobile fixes (`HifzReviewScreen.tsx`, `HifzDashboardScreen.tsx`)
  have no automated regression test, for the same reason noted in round 7:
  `apps/mobile/vitest.config.ts` only runs `src/**/*.test.ts` in a plain
  Node environment, there is no `@testing-library/react-native` or
  equivalent dependency, and no `.tsx` component test exists anywhere in
  the mobile app today. Verified instead via the live re-check above.

## Investigated, no bug found

- **Zakat "Reset amounts" fix (round 7) re-verified in a fresh session:**
  set gold=75, cash=500, tapped Reset — gold correctly preserved, cash
  correctly cleared. Confirms the fix holds across a full server
  restart/reload, not just the original test session.
- **Hifz memorize → dashboard → review → completion, full flow:** tapping
  "Memorize āyah" (found via `aria-label`, since — unlike web — the mobile
  reader's per-āyah action row renders icon-only buttons with no visible
  text label) correctly added the āyah to the spaced-repetition schedule;
  the dashboard's stats (Due today, Day streak, Āyāt tracked, per-surah
  progress %) and the review session's SM-2 grading (Again/Hard/Good/Easy)
  all updated correctly and consistently with each other.
- **A methodology confirmation, not a new finding:** twice this round, a
  `.click()` immediately followed by a DOM-state query *in the same
  `javascript_exec` call* returned stale pre-click state (once for a tab
  navigation, once for the dashboard's due count right after adding a
  second āyah) — resolved both times by splitting the click and the
  read-back into two separate script calls. Matches the read-before-flush
  race already documented in rounds 5 and 7; recording it again here since
  it recurred in a different context (tab navigation, not just store
  writes) to reinforce the general rule for this app: never trust a DOM
  read taken in the same synchronous script as the action that changed it.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm typecheck` — clean (8/8).
- `pnpm test` — 95/95 passed for web (93 existing + 2 new files), 15/15 for
  mobile, clean everywhere else (154 total test files across the repo).
- `pnpm build` — clean, run with the mobile dev server as the only server
  active (no `.next`-conflict risk since it's a different app/port).
- Live re-verification against the Expo web dev server, described above.

## Verdict

One real bug found and fixed this round, spanning three call sites across
both platforms (mobile dashboard, mobile review, web dashboard). Restarting
the 3-in-a-row clean-streak count at zero; continuing to round 9.
