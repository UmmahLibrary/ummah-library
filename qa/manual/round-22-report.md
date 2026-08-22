# Manual E2E QA — Round 22 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered Du'ās, the Hijri Calendar's date-adjustment feature, and — the
main find — cross-checked the Ramaḍān screen against the Hijri Calendar
after nudging the sighting adjustment.

## Findings

### 1. Ramaḍān screen ignores the user's Hijri sighting-adjustment setting, on both web and mobile - FIXED

- **Where:** [apps/mobile/src/screens/RamadanScreen.tsx:48,55](../../apps/mobile/src/screens/RamadanScreen.tsx#L48),
  [apps/web/src/components/RamadanView.tsx:84-87](../../apps/web/src/components/RamadanView.tsx#L84-L87)
- **Symptom:** In Hijri Calendar → "Date adjustment", nudging the sighting
  offset to +1 day correctly shifts that screen's own "today" marker and
  "Mawlid an-Nabī" countdown by a day (Aug 22 → Aug 23 = Hijri day 8 → 9,
  "in 4 days" → "in 3 days"). But the Ramaḍān screen, opened right
  afterward with no other change, still reads "8 Rabī' al-Awwal 1448 AH" —
  one day behind the Hijri Calendar's "9". Two screens fed by the same
  device-local setting disagreeing about what day it is.
- **Root cause:** Both `RamadanScreen.tsx` (mobile) and `RamadanView.tsx`
  (web, whose docstring literally says "Mirrors the mobile screen") called
  `gregorianToHijri(todayGreg(), 0)` with the adjustment **hardcoded to
  `0`**, instead of reading the user's saved `ul.hijriAdjust` preference the
  way `HijriCalendarScreen.tsx` (mobile) and `TopBar.tsx` /`HijriToday.tsx`/
  `SunnahFastReminderToggle.tsx`/`FastingQadaTracker.tsx` (web) all already
  do. This wasn't just a cosmetic date-label bug: `ramadanStartGreg` — used
  to scope which Qur'an pages count toward this Ramaḍān's khatm-progress
  stat — was derived from the same unadjusted Hijri year/month, so a user
  near the Ramaḍān boundary with a non-zero adjustment could get the wrong
  fasting-calendar month entirely, not just a mislabeled date.
- **Fix:** Mobile — added a `hijriAdjust` state loaded from
  `getString(KEYS.hijriAdjust)` on mount (mirroring
  `PrayerTrackerScreen.tsx`'s existing pattern exactly) and passed it into
  both `gregorianToHijri` and `hijriToGregorian` instead of the literal
  `0`. Web — added the same `readHijriAdjust()` read plus a
  `HIJRI_ADJUST_KEY` window-event subscription (mirroring `TopBar.tsx`
  exactly, so the Ramaḍān page's date live-updates if the adjustment is
  changed elsewhere while it's open) and passed the value into
  `gregorianToHijri` instead of `0`.
- **Verification:** Mobile — `pnpm lint` (0 errors; 1 pre-existing warning
  in the file, unrelated to this change), `pnpm typecheck` (8/8 packages),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on the native build: with the adjustment still at +1 from
  the Hijri Calendar screen, opening Ramaḍān now correctly shows "9 Rabī'
  al-Awwal 1448 AH", matching the Hijri Calendar. Reset the adjustment back
  to 0 afterward to leave the device in a clean state. Web —
  `pnpm --filter @ummahlibrary/web exec eslint` and `typecheck` both clean
  for the changed file; **the web unit-test suite itself could not be run
  to completion this round** — see the environment note below — so the web
  fix is verified by lint/typecheck plus exact-pattern parity with four
  other already-tested web components, not by a live web re-run.
- **Regression test:** None added. No test file exists for either
  `RamadanScreen.tsx` or `RamadanView.tsx` in this repo currently (unlike
  e.g. `HifzDashboard.test.tsx`), and adding one plus the render harness it
  would need is beyond a minimal fix for this specific bug. Flagging this
  gap rather than silently leaving it undocumented.

## Investigated, no bug found

- **Du'ās:** categories (Du'ā of the Day, Comprehensive, Forgiveness, etc.)
  render Arabic, translation, and Qur'anic citation correctly.
- **Hijri Calendar date-adjustment mechanics themselves:** the -2/-1/0/+1/+2
  nudge correctly re-renders the calendar grid, the "Today" highlight, and
  the "Observances this month" countdown all in lockstep within that one
  screen — the bug above is specifically about *other* screens not picking
  up the same setting, not the adjustment control itself.

## Environment note (not an app bug, recorded for future rounds)

`pnpm --filter @ummahlibrary/web test` currently fails broadly (38 of 96
test files, ~95 individual tests) with `TypeError: Cannot read properties
of null (reading 'useState')` inside React's own `renderWithHooks` — a
duplicate-React-instances symptom. Confirmed **pre-existing and unrelated**
to this round's change: an untouched test file
(`src/components/HifzDashboard.test.tsx`, added in an earlier round) fails
identically in isolation. `find`-ing every `react/package.json` under the
repo shows the root `node_modules/react` hoisted to `19.1.0` while
`apps/web`'s own copy, `react-dom`'s nested copy, and
`@testing-library/react`'s nested copy are all `19.2.7` — two different
React instances at runtime, which breaks hooks. `pnpm-lock.yaml` was
already showing as modified before this round started, consistent with
this being a lingering side effect of round 17's `node-linker=hoisted`
workaround (needed to get the native Android build working around
Windows' path-length limit) rather than something to fix mid-QA-round. Not
attempting a `pnpm install`/reinstall here given how much one-time setup
that native environment required — flagging for a deliberate, separate fix
rather than a QA-loop side quest. `eslint` and `tsc --noEmit` are
unaffected (no React runtime involved) and both pass clean on the web
changes made this round.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (8/8 packages),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.
- Web: `eslint` and `typecheck` clean for the changed file; full
  `vitest` run blocked by the pre-existing environment issue above.

## Verdict

One real, cross-platform bug found and fixed this round (mobile fixed and
fully verified; web fixed and verified by lint/typecheck/pattern-parity,
with the test-suite verification gap explicitly noted). Restarting the
3-in-a-row clean-streak count at zero.
