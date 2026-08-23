# Manual E2E QA - Round 12 (2026-08-21)

Sixth round on the mobile app, exploring Settings. Following round 11's
Tasbih finding, deliberately spot-checked the other +/- steppers in the app
for the same rapid-tap race — and found the same shape of bug in three more
places, one of which turned out to affect **web too** (not just a
mirroring gap this time — a genuinely new, previously undiscovered bug).

## Findings

### 1. Font-size steppers (mobile Settings, mobile reader, web reader) lose rapid taps - FIXED

- **Where:**
  [apps/mobile/src/state/SettingsContext.tsx](../../apps/mobile/src/state/SettingsContext.tsx) (`setScale`),
  [apps/mobile/src/screens/SettingsScreen.tsx](../../apps/mobile/src/screens/SettingsScreen.tsx),
  [apps/mobile/src/components/ReaderControls.tsx](../../apps/mobile/src/components/ReaderControls.tsx),
  [apps/web/src/components/ReaderControls.tsx](../../apps/web/src/components/ReaderControls.tsx)
- **Symptom:** On the mobile Settings screen, font size started at 110%;
  tapping "A+" four times in quick succession only moved it to 120%
  (one step), not 150% (four steps). Same shape of bug independently in
  the in-reader font-size control and, on inspection, in web's reader
  font-size control too.
- **Root cause:** The exact rapid-tap race already fixed for Tasbih this
  round (and for the Qada steppers in an earlier session, commit
  `55adba5`): each stepper button computed its next value from a `scale`
  variable captured in the render closure (`setScale(scale - 0.1)` /
  `onScale(scale + 0.1)` / `changeScale(delta)` reading outer `scale`),
  instead of from React's guaranteed-fresh previous state. Several taps
  landing in the same event-loop tick — a fast real double/triple-tap, or
  several queued clicks before React flushes — all read the same stale
  value and each compute `value ± 0.1`, so the last `setState` call wins
  and the net effect is only ever one step. Three separate implementations
  had it: mobile's `SettingsContext.setScale` (used directly by the
  Settings screen) and the *separate* `ReaderControls.tsx` component the
  in-reader toolbar uses on each platform — web's own `ReaderControls.tsx`
  included, which had never been touched by the earlier Qada fix since
  that fix's scope was the qaḍāʾ trackers specifically.
- **Fix:** All three now resolve the next value from React's own
  `prev` argument instead of a captured variable:
  - Mobile's `SettingsContext.setScale` now accepts either a plain number
    or an updater function `(prev) => number` (mirroring `useState`'s own
    overload) and resolves it inside `setScaleState`'s functional form; its
    two callers (`SettingsScreen.tsx`'s A-/A+ buttons and
    `ReaderControls.tsx`'s `onScale` prop/callers) now pass `(prev) => prev
    ± 0.1` instead of `scale ± 0.1`.
  - Web's `ReaderControls.tsx` `changeScale(delta)` now wraps its
    computation in `setScale((prev) => {...})` instead of reading the
    component's `scale` state variable directly.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm typecheck` (8/8), `pnpm test` (415/415 web incl. 2 new tests,
  105/105 mobile), `pnpm build` (clean). Live re-verification on the Expo
  web dev server: with scale at 110%, 4 rapid A+ taps correctly landed on
  150% (previously 120%).
- **Regression test:**
  [apps/web/src/components/ReaderControls.test.tsx](../../apps/web/src/components/ReaderControls.test.tsx) (new) —
  dispatches 4 raw DOM `.click()` calls on "Increase text size" inside a
  single `act()` (so React sees them as landing in one tick, the same way
  a fast real tap sequence would) and asserts the `--reading-scale` CSS
  property lands on `1.4`, not `1.1`; a second case does the same for
  "Decrease text size". Confirmed to fail on the pre-fix component (`1.1`/`1`
  instead of `1.4`/`0.8`) via `git stash`, and pass after. The two mobile
  fixes have no automated test for the same reason as this session's other
  mobile screen-level fixes (no component-test harness); verified live
  instead, as above.

## Investigated, no bug found

- **Adhkar per-dhikr counters:** already covered in round 11 — correctly
  uses a pattern immune to this race, unlike Tasbih and the font-size
  steppers.
- **Backup/export UI, reciter/tafsir/script pickers, theme swatches on
  Settings:** all single-choice selectors (tap sets an absolute value, not
  a delta) — not susceptible to this class of bug regardless of tap speed,
  since repeating the same selection is idempotent. Skimmed but not
  exhaustively tapped this round given time; noted as already-safe by
  construction rather than individually verified live.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm typecheck` — clean (8/8).
- `pnpm test` — 415/415 passed for web (96 files, incl. 1 new file/2 new
  tests), 105/105 for mobile, clean everywhere else.
- `pnpm build` — clean.
- Live re-verification against the Expo web dev server (after an
  unexpected server-process drop mid-round — restarted it via
  `preview_start`; app state including local storage survived the restart
  since it's browser-side, not server-side), described above.

## Verdict

One real bug found and fixed this round, spanning three implementations
across both platforms (two mobile, one web — the web instance being a
genuinely new discovery, not a mirroring gap). Restarting the 3-in-a-row
clean-streak count at zero; continuing to round 13.
