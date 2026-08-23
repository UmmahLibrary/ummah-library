# Manual E2E QA - Round 10 (2026-08-21)

Fourth round on the mobile app, continuing rounds 7-9's approach of
spot-checking mobile against web bugs already fixed there. This round:
the khatma (Quran-completion tracker) on the Reading Goals screen, checked
against commit `9341e3d` ("show a completion state when a khatm reaches
its last page").

## Findings

### 1. Khatma tracker never acknowledged reaching page 604 - FIXED

- **Where:** [apps/mobile/src/screens/ReadingGoalsScreen.tsx](../../apps/mobile/src/screens/ReadingGoalsScreen.tsx)
- **Symptom:** Seeded a khatma at `currentPage: 604, totalPages: 604` (the
  whole Mushaf finished) — the Khatma section kept rendering as if
  mid-progress: "Page 604/604 · 0d left · —/day" with a "Resume p604" link
  back to the page just finished, no acknowledgment the khatm was actually
  complete.
- **Root cause:** Same gap as the already-fixed web bug: the khatma
  section only branched on "no khatma" vs. "khatma in progress" — there was
  no `currentPage >= totalPages` case. `apps/web/src/components/ReadingGoalsView.tsx`
  is a *separate* component from mobile's `ReadingGoalsScreen.tsx` (same
  underlying `KhatmaPlan` shape from `@ummahlibrary/core`, different UI
  code per platform), so `9341e3d`'s fix never carried over.
- **Fix:** Added the same third branch web uses: when
  `khatma.currentPage >= khatma.totalPages`, show "Alhamdulillah — khatm
  complete! 🎉" plus "−1" (undo the last page, matching web) and "Start a
  new khatm" (clears the plan) — replacing the progress line and "Resume"
  link, which no longer make sense once there's nothing left to resume.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm --filter @ummahlibrary/mobile typecheck` (clean), `pnpm --filter
  @ummahlibrary/mobile test` (105/105, unrelated to this screen). Live
  re-verification on the Expo web dev server: seeded `ul.khatma` at
  604/604 and reloaded the Reading Goals screen — correctly showed the
  completion message with "−1"/"Start a new khatm" in place of the old
  progress line.
- **Regression test:** None added, for the same reason as rounds 7-9's
  mobile screen fixes: no component-test harness exists for mobile screens
  in this codebase. Verified live instead, as above.

## Investigated, no bug found

- **Prior three fixes (rounds 7-9) re-verified together in one session:**
  Zakat reset, Hifz plural messages, and prayer-times timezone all still
  held correctly when re-checked in sequence during this round, confirming
  none regressed from the khatma fix's changes.
- **Qada rapid-click race (web fix `55adba5`) — mobile already correct:**
  read `apps/mobile/src/screens/PrayerTrackerScreen.tsx` and
  `FastingQadaTracker`-equivalent logic; both already hold the log in React
  state and update via the functional `setState` form rather than
  round-tripping through an async store read on every tap — this is in
  fact the exact pattern the web fix's own commit message credits as
  "mirroring the pattern the mobile PrayerTrackerScreen already uses." No
  fix needed here; mobile was the reference implementation for that one.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm --filter @ummahlibrary/mobile typecheck` — clean.
- `pnpm --filter @ummahlibrary/mobile test` — 105/105 passed, unaffected by
  this round's change.
- Live re-verification against the Expo web dev server, described above.
- No `pnpm build`/repo-wide test re-run this round since only one mobile
  screen file changed and mobile has no `build` step; the full-repo suite
  was already confirmed clean as of round 9's report immediately prior.

## Verdict

One real bug found and fixed this round (mobile khatma tracker missing a
completion state, mirroring an already-fixed web bug), plus one prior web
fix (Qada rapid-click race) confirmed to have never needed mirroring since
mobile was already correct. Restarting the 3-in-a-row clean-streak count at
zero; continuing to round 11.
