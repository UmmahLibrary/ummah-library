# Manual E2E QA - Round 11 (2026-08-21)

Fifth round on the mobile app. Fresh exploration areas this time (not a
web-fix parity check going in): Adhkar counters, and Tasbih — where the
round's finding turned up.

## Findings

### 1. Tasbih dial loses taps under rapid tapping - FIXED

- **Where:** [apps/mobile/src/screens/TasbihScreen.tsx](../../apps/mobile/src/screens/TasbihScreen.tsx)
- **Symptom:** Tapped the dial once (0→1, correct), then tapped it 5 times
  in quick succession — the counter only advanced by 1 (2→7 after the fix;
  before the fix, 1→2 total instead of 1→6). A single tap always worked;
  only rapid taps landing in the same event-loop tick lost count.
- **Root cause:** The exact bug shape already found and fixed on web (and
  on mobile's own `QadaTracker`/`FastingQadaTracker`, per commit `55adba5`)
  — but Tasbih was outside that fix's scope and still had it. `tap()`
  called `persist({ ...state, phrases: { ...state.phraseId]: { ...progress,
  total: progress.total + 1 } } })`, computing the new total from
  `progress`/`state` captured in the closure at the last render. Several
  `tap()` calls firing before React re-renders (a fast multi-tap, or
  several taps in the same script tick) all read the same stale total and
  each compute `total + 1`, so the last `setState` call wins and the net
  effect is only ever +1 regardless of how many taps landed. Web's
  `TasbihPageClient.tsx` already uses the correct functional-`setState`
  form for this exact scenario (`setState((prev) => {...})`, computing from
  `prev` instead of a captured variable) — mobile's `TasbihScreen.tsx` is a
  separate component and never followed that pattern.
- **Fix:** Rewrote `tap()` to use the functional `setState` form, computing
  the phrase's current progress from `prev` inside the updater (mirroring
  web's `TasbihPageClient.tap()` almost line-for-line), so each queued tap
  sees the truly-latest count rather than a stale snapshot. The other three
  `persist()` call sites (phrase switch, target selection, reset) are
  untouched — none of them depend on a prior counter value, so they aren't
  susceptible to the same race.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm --filter @ummahlibrary/mobile typecheck` (clean), `pnpm --filter
  @ummahlibrary/mobile test` (105/105, unrelated to this screen). Live
  re-verification on the Expo web dev server (hot-reloaded via Metro watch
  mode): a single tap correctly went 0→1; 5 rapid taps issued back-to-back
  in one script tick correctly went 2→7 (previously would have landed on
  3).
- **Regression test:** None added, for the same reason as the other mobile
  screen-level fixes this session: no component-test harness exists for
  mobile screens. Verified live instead, as above.

## Investigated, no bug found

- **Adhkar counters:** a single tap on a "0/1" dhikr correctly moved the
  category total from 0/26 to 1/26; a burst of 3 rapid taps on a "0/3"
  dhikr correctly landed on 3/3 (not undercounted) — this screen's
  increment handler already uses the correct pattern, unlike Tasbih's.
- **Tab-bar re-tap not resetting a tab's nested stack:** tapping the
  already-active "Tools" tab while deep inside it (e.g. on Prayer Times or
  Adhkar) didn't pop back to the Tools root list, which most tab-bar apps
  do by default via React Navigation's built-in re-tap-to-top behavior.
  Not confident this reflects real native-device behavior rather than a
  react-native-web quirk in how this automation dispatches the synthetic
  re-tap (no explicit `tabPress`/`popToTop` wiring exists in the app's own
  navigation code either way — it would rely entirely on the navigator's
  default, which native and web may handle differently). Flagging for a
  future round to re-check on an actual native build rather than treating
  it as confirmed.
- **A testing-methodology note:** while chasing the tab-bar question above,
  discovered that `.click()` on an element found by text search can
  successfully trigger navigation on a screen that's currently `aria-hidden`
  and stacked behind the active one (e.g. clicking "Adhkar" on a
  Tools-list screen still mounted behind Prayer Times) — real user taps
  couldn't reach it, but the app's underlying navigation state responded
  correctly regardless of which screen was visually on top. Not a bug, but
  a reminder that a successful synthetic click here doesn't by itself prove
  a *visible* element was tapped — worth cross-checking visibility
  separately when the click target's identity matters.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm --filter @ummahlibrary/mobile typecheck` — clean.
- `pnpm --filter @ummahlibrary/mobile test` — 105/105 passed, unaffected by
  this round's change.
- Live re-verification against the Expo web dev server, described above.

## Verdict

One real bug found and fixed this round (Tasbih's rapid-tap race).
Restarting the 3-in-a-row clean-streak count at zero; continuing to
round 12.
