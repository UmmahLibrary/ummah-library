# Manual E2E QA - Round 13 (2026-08-21)

Continuation of the closure-capture/rapid-tap sweep started in round 12:
after fixing the font-size steppers, grepped the mobile app for other
`set/write/adjustX(x ± delta)`-shaped call sites to proactively catch more
instances of the same bug class before they were found by accident. One
more turned up, on the khatma page-adjustment buttons.

## Findings

### 1. Khatma +1/-1 page buttons lose rapid taps - FIXED

- **Where:** [apps/mobile/src/screens/ReadingGoalsScreen.tsx](../../apps/mobile/src/screens/ReadingGoalsScreen.tsx)
- **Symptom:** With a khatma at 604/604 (complete), tapped "−1" three
  times in quick succession — `ul.khatma` in storage only moved to
  `currentPage: 603` (one step), not 601 (three steps).
- **Root cause:** This is the *original* async-round-trip shape of the
  rapid-tap bug (commit `55adba5`, "adjustQadaCount/... did an async
  store.read() before computing and writing every tap") — not the
  render-closure variant from rounds 11-12, but the same underlying
  problem: `adjustKhatma(delta)` read `khatma.currentPage` from the
  screen's `state` (itself only ever updated via an async `refresh()` =
  `readReadingState().then(setState)` round-trip after each write),
  computed `currentPage + delta`, wrote it, then called `refresh()` again
  to re-sync. Several taps landing before that async round-trip resolves
  all read the same pre-write `state` and each compute from the same base,
  so the net effect of N rapid taps is only ever one step — this screen was
  outside `55adba5`'s original scope (that fix touched
  `QadaTracker`/`FastingQadaTracker` specifically) and was never
  updated to match.
- **Fix:** `adjustKhatma` (and `startKhatma`, and a new shared
  `clearKhatmaAndRefresh`) now update the screen's local `state` optimistically
  via the functional `setState` form — computing the next `khatma` from
  `prev` and persisting via `writeKhatma`/`clearKhatma` as a background side
  effect, instead of reading a stale snapshot and re-fetching the whole
  state afterward. `changeGoal` (daily-goal selection) is untouched since
  it sets an absolute, idempotent value with no race exposure.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm --filter @ummahlibrary/mobile typecheck` (clean), `pnpm --filter
  @ummahlibrary/mobile test` (105/105, unrelated to this screen). Live
  re-verification on the Expo web dev server: seeded a 604/604 khatma, 3
  rapid "−1" taps correctly landed on `currentPage: 601` in storage
  (previously 603).
- **Regression test:** None added, for the same reason as the other mobile
  screen-level fixes this session (no component-test harness for mobile
  screens). Verified live instead, as above.

## Investigated, no bug found

- **Repo-wide grep for the same two bug shapes** (`onPress={() =>
  set/writeX(x ± delta)}` and `set/writeX(x ± 1|0.1)` generally) across
  both `apps/web` and `apps/mobile` turned up only one other borderline
  case: `OnboardingScreen.tsx`'s "Continue" button (`setI(i + 1)` to
  advance a slide index). Not fixed — a lost tap there just means an
  onboarding slide gets skipped or re-shown, which is inconsequential (no
  persisted/user data at stake, and the user is already moving forward
  through a linear intro), unlike the counters/trackers this session's
  other fixes protect.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm --filter @ummahlibrary/mobile typecheck` — clean.
- `pnpm --filter @ummahlibrary/mobile test` — 105/105 passed, unaffected by
  this round's change.
- Live re-verification against the Expo web dev server, described above.

## Verdict

One real bug found and fixed this round (khatma page-adjustment rapid-tap
race). This is the third and, per the proactive grep sweep, likely final
instance of this bug class in the app. Restarting the 3-in-a-row
clean-streak count at zero; continuing to round 14.
