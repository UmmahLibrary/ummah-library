# Mobile Stabilization Loop — QA Log

Append-only. One `## Iteration N — <perspective>` section per iteration, in
the style of the earlier `WEB_QA_REPORT.md` pass. Never rewrite past entries.
Driven by [`.claude/MOBILE_STABILIZATION_LOOP.md`](.claude/MOBILE_STABILIZATION_LOOP.md).

---

## Iteration 1 — Prayer-time timezone-of-location vs device-timezone bug

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** every `toLocaleTimeString`/time-formatting call site in
`apps/mobile/src` (all screens + `utils.ts`), specifically whether prayer
times render in the timezone of the saved *location* or silently fall back
to the *device's* timezone — this was a confirmed High-severity bug on web
([`WEB_QA_LIVE_BROWSER_REPORT.md`](WEB_QA_LIVE_BROWSER_REPORT.md) bug #1).

**Result: clean, not reproducible.** Mobile already has this fixed and
better-centralized than web ever was:

- [`src/utils.ts`](apps/mobile/src/utils.ts) has `fmtPrayerTime(src, coords)`,
  which derives the IANA timezone from coordinates via `tz-lookup` and passes
  it explicitly to `toLocaleTimeString`, with a doc comment calling out
  exactly the device-timezone-fallback footgun.
- Every prayer-time display (`HomeScreen`, `PrayerTimesScreen`, `RamadanScreen`)
  calls `fmtPrayerTime(…, coords)` — confirmed via grep, no screen inlines
  its own `toLocaleTimeString` (web's version of this bug was made worse by
  the same broken snippet being duplicated across 4 components; mobile never
  had that duplication).

**Found instead: dead code that's an attractive nuisance for this exact bug
class.** A second helper, `fmtTime(src)` (no `coords` param, no `timeZone`),
existed alongside `fmtPrayerTime` — same file, same signature shape, minus
the fix. It had zero call sites outside its own test (`utils.test.ts`).
Keeping a device-timezone-only formatter sitting right next to the
location-aware one is exactly the kind of thing a future screen could import
by mistake and reintroduce the web bug on mobile.

**Fix:** removed `fmtTime` and its test from
[`apps/mobile/src/utils.ts`](apps/mobile/src/utils.ts) /
[`utils.test.ts`](apps/mobile/src/utils.test.ts). `fmtPrayerTime`'s own test
suite already covers the invalid-date-dashing case that `fmtTime`'s test was
also asserting, so no coverage was lost.

**Verification:**
- `pnpm --filter @ummahlibrary/mobile test` — 15 files / 116 tests pass.
- `pnpm lint` — 0 errors (13 pre-existing, unrelated `react-hooks/exhaustive-deps`
  warnings in other files, untouched by this change).
- `pnpm typecheck` — clean across all 8 packages.
- `pnpm build` / full `pnpm test` — see "Out of scope" below; could not get a
  clean full-workspace run, for reasons unrelated to this change.

**Commit:** `fix(mobile): remove unused device-timezone-only fmtTime helper`

---

### Out of scope — pre-existing, repo-wide (found while trying to run the full gate)

**Duplicate React installations cause `apps/web` and `apps/extension` builds
and tests to fail with "Invalid hook call" / `Cannot read properties of null
(reading 'useRef'/'useState')`.**

- Root `node_modules/react` is hoisted at `19.1.0`.
- `apps/web/node_modules/react`, `apps/extension/node_modules/react`, and
  `packages/ui/node_modules/react` each have their own nested copy at
  `19.2.7`.
- This reproduces on a completely clean diff (confirmed: my only change this
  iteration was two lines removed from `apps/mobile/src/utils.ts`/`.test.ts`
  — nothing under `apps/web`, `apps/extension`, or `packages/ui` was
  touched), so it predates this loop and isn't caused by it.
- `pnpm test` fails in `@ummahlibrary/extension` (2 test files, 7 tests) and
  throws render errors in `@ummahlibrary/web`'s `AyahWords.test.tsx`.
  `pnpm build` fails prerendering `apps/web`'s `/500` page with the same
  `useRef`-on-null signature.
- `apps/mobile` is unaffected — it has no local `node_modules/react` copy of
  its own and its full test suite (116 tests) passes clean in isolation.

This is a real, repo-wide dependency-hoisting problem (likely worth a
`pnpm install`/lockfile audit, or a `.npmrc` `public-hoist-pattern`/dedupe
fix) but it sits entirely outside `apps/mobile` and this loop's mandate.
Flagging it here rather than fixing it blind, since a dependency-resolution
change is exactly the kind of thing that shouldn't be made silently as a
side effect of an unrelated mobile bug-hunt. The mobile-scoped gate (lint +
typecheck + mobile's own test suite) is green and that's what this commit is
held to; the full-workspace `pnpm build`/`pnpm test` will stay red until
someone addresses the React duplication directly.
