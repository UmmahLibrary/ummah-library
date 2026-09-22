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

---

## Iteration 2 — Zakat currency-field sanitization (and adjacent Reset/negative-amount bugs)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** [`ZakatScreen.tsx`](apps/mobile/src/screens/ZakatScreen.tsx) against
all three related web bugs
([`WEB_QA_REPORT.md`](WEB_QA_REPORT.md) #1,
[`WEB_QA_LIVE_BROWSER_REPORT.md`](WEB_QA_LIVE_BROWSER_REPORT.md) #3–#4):
currency field digit-corruption, "Reset amounts" wiping gold/silver prices,
and negative asset amounts being silently accepted.

**Result: clean on all three, confirmed by both code read and live
interaction** via `preview_start({name: "mobile"})` (the RN-web build) in the
Browser pane:

- `sanitizeCurrency` strips digits from the currency field on every
  keystroke, plus a self-heal migration for values saved before the
  sanitizer existed, plus a defensive re-sanitize in `money()` for values
  that could arrive via sync from another device. Typed `85` into Currency
  live — field stayed empty (falls back to `$`), confirmed via screenshot.
- `sanitizeDecimal` strips everything but digits and a single `.`, which
  also strips `-` — negative amounts can't be entered at all, not just
  "ignored after the fact." Typed `-75.5.2abc` into a price field live — it
  rendered as `75.52`.
- `reset()` only touches `assets`/`liabilities` by design (explicit comment
  in the source). Verified live: set Gold-per-gram to `75` and Cash to
  `500`, tapped "Reset amounts" — Cash went back to `0`, Gold-per-gram
  **stayed `75`**.

**Process note (not an app bug):** my first pass through this test flagged
Reset as wiping the gold price — a false positive caused by this session's
`read_page` accessibility-tree reader, which reports a text input's
**placeholder** as its `name` regardless of whether it currently holds a
value, so an input with real content still showed `placeholder="e.g. 75"` in
the tree. Re-verified with actual screenshots (ground truth for input
values, not `read_page`'s textbox name) and the price was intact. Noting
this so future iterations trust screenshots over `read_page` names when
checking live text-input values.

**No test added:** `apps/mobile/vitest.config.ts` scopes tests to
`src/**/*.test.ts` only ("Node env (pure logic)") — there's no
React-Testing-Library-for-RN setup in this repo, so screen components aren't
unit-tested here by convention. `sanitizeCurrency`/`sanitizeDecimal`/`reset`
are correct today; extracting them out of `ZakatScreen.tsx` into a testable
module purely to add coverage, with no bug driving it, would be scope creep
for this iteration. Flagging as a candidate for the iteration-40 "test
coverage audit" pass instead.

**Verification:** no code changed this iteration; `pnpm --filter
@ummahlibrary/mobile test`/`typecheck` were already green from iteration 1
and nothing here touched source.

**Commit:** none (clean iteration).

---

## Iteration 3 — Tasbih per-phrase counter (mobile's "opposite bug" from web)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** whether switching the dhikr chip on
[`TasbihScreen.tsx`](apps/mobile/src/screens/TasbihScreen.tsx) carries the
running count over under the wrong phrase's label — the mobile-specific
half of [`WEB_QA_REPORT.md`](WEB_QA_REPORT.md) bug #2.

**Result: clean, already fixed at the shared `core` layer.**
[`packages/core/src/tasbih.ts`](packages/core/src/tasbih.ts) stores
`TasbihRecord.phrases: Record<phraseId, {total, target}>` — every phrase
keeps its own entry, and `phraseId` (which chip is currently displayed) is
tracked separately. Switching the chip
(`persist({ ...state, phraseId: p.id })`) only changes which entry is
*displayed*; it can't touch another phrase's total, because there's no
shared/flat total left to collide on. The source comment on `TasbihRecord`
names this exact failure mode as the reason for the shape. `mobileTasbihStore`
([`tasbih-store.ts`](apps/mobile/src/tasbih-store.ts)) even migrates the old
flat-total shape forward into the per-phrase one for anyone who had it
persisted from before this fix.

**Live-verified** via `preview_start({name: "mobile"})`: tapped SubḥānAllāh's
dial to 3, switched to Alḥamdulillāh (correctly showed 0), switched back to
SubḥānAllāh — **still showed 3**, not merged, not reset, not mislabeled.

`packages/core/src/tasbih.test.ts` already covers this at the unit level
(`tasbihPhraseProgress`: "switching away and back must not touch another
phrase's entry").

**Side note, not a finding:** mobile's "Total today" stat shows only the
*currently selected* phrase's total, not a sum across all five dhikr. This
looked potentially mislabeled at first glance, but web's
`TasbihPageClient.tsx` does the exact same thing (`totalToday = view.total`,
same label) — it's an intentional, already-shipped, cross-platform design
choice, not a mobile-specific defect. Not logging it as a bug.

**Verification:** no code changed; nothing to re-run beyond what iteration 1
already confirmed green.

**Commit:** none (clean iteration).

---

## Iteration 4 — Qada +/− stepper race condition under rapid taps

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** whether tapping a qaḍāʾ stepper rapidly loses counts, the way
[`WEB_QA_LIVE_BROWSER_REPORT.md`](WEB_QA_LIVE_BROWSER_REPORT.md) bug #2
found on web (3 quick clicks → "1 owed" instead of "3").

**Result: clean, not reproducible, confirmed by both code and live rapid
taps.** [`PrayerTrackerScreen.tsx`](apps/mobile/src/screens/PrayerTrackerScreen.tsx)'s
`adjustQadaFor`/`adjustFasting` both use the safe pattern the web bug report
itself recommended: `setQadaLog((prev) => { const next = adjustQada(prev, …);
void qadaStore.write(next); return next; })` — the next value is always
derived from React's own `prev`, never from a fresh `store.read()`, so
taps landing faster than an AsyncStorage round-trip can't race each other.
`mobileQadaStore`/`mobileFastingQadaStore` are plain read/write adapters
with no intermediate async wrapper to race through (web's actual bug was in
a since-removed `adjustQadaCount` in `apps/web/src/lib/qada.ts` — that file
now carries a doc comment explaining exactly why it was rewritten to this
same prev-based pattern, so the web side looks already fixed too, just not
yet reflected in that report).

**Live-verified** via `preview_start({name: "mobile"})`: 3 rapid clicks on
the Fajr "+" on `/tools/prayer-tracker` → **3 owed**, not 1.

**Adjacent finding, deferred to iteration 23 (sync edge cases), not acted on
now:** `PrayerTrackerScreen` also calls `load()` — a full
`qadaStore.read().then(setQadaLog)` (and the same for the prayer log, ḥayḍ,
and fasting-qaḍāʾ stores) — every time `onSyncApplied` fires
([`sync-events.ts`](apps/mobile/src/lib/sync/sync-events.ts)), i.e. whenever
a remote sync pull lands. Unlike a local tap, that's a genuine stale-read
risk: if a sync pull resolves *between* two rapid local taps, `setQadaLog`
gets called with whatever was in storage at read time, and a later tap's
functional updater would then derive `next` from that (possibly stale)
value instead of the most recent optimistic one — a real, if narrow,
lost-tap window, but only when sync is on and a remote change lands
mid-interaction, which is a different mechanism than the web bug this
iteration targeted. Not fixing speculatively; flagged here so the sync-focused
iteration investigates whether `load()` should merge rather than clobber, or
skip re-reading stores the user is actively mutating.

**Verification:** no code changed; nothing to re-run.

**Commit:** none (clean iteration).

---

## Iteration 5 — Hifz review Arabic pluralization copy ("āyahāt" vs "āyāt")

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** [`WEB_QA_LIVE_BROWSER_REPORT.md`](WEB_QA_LIVE_BROWSER_REPORT.md)
bug #5 — a completion message reading "āyahāt" (not a real word) instead of
the correct plural "āyāt" — against mobile's Hifz screens.

**Result: clean.** Both
[`HifzReviewScreen.tsx:110`](apps/mobile/src/screens/HifzReviewScreen.tsx)
and [`HifzDashboardScreen.tsx:134`](apps/mobile/src/screens/HifzDashboardScreen.tsx)
already use the correct ternary (`count === 1 ? "āyah" : "āyāt"`). A
repo-wide grep for the typo (`āyahāt`/`ayahat`) across `apps/mobile/src` and
every `packages/*` turned up zero matches. Web's own copies of this string
(`HifzDashboard.tsx:227`, `HifzReview.tsx:112`) are also already correct and
now carry regression tests (`HifzDashboard.test.tsx`, `HifzReview.test.tsx`)
explicitly asserting `āyahāt` never appears — so this looks fixed
everywhere, just not yet reflected in that report.

**No live browser check this iteration:** this is a static string literal
with no dynamic/async path (unlike the timezone or race-condition
perspectives), so a full source-level grep across both call sites plus the
whole codebase is exhaustive verification on its own; spending a preview
session on it wouldn't add confidence.

**Commit:** none (clean iteration).

---

## Iteration 6 — Khatm 604/604 completion state

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** [`WEB_QA_LIVE_BROWSER_REPORT.md`](WEB_QA_LIVE_BROWSER_REPORT.md)
bug #6 — on web, a khatm that reaches `currentPage === totalPages` (604/604)
still renders as mid-progress ("30d left · 0/day", a "Resume p604" button
looping back to the finished page), with no congratulations and no way to
start a new khatm. Unlike bugs #1/#2/#5, the report notes this one is
**still unfixed on web** as of that pass.

**Result: mobile already has this, correctly, in a dedicated branch.**
[`ReadingGoalsScreen.tsx:187-198`](apps/mobile/src/screens/ReadingGoalsScreen.tsx#L187)
checks `khatma.currentPage >= khatma.totalPages` and renders "Alhamdulillah —
khatm complete! 🎉" with a "−1" (undo) and a "Start a new khatm" button,
instead of falling into the same resume-loop web has.

**Live-verified** via `preview_start({name: "mobile"})`: started a 30-day
khatm, used `localStorage.setItem('ul.khatma', …)` to jump straight to
`currentPage: 603` (rather than tapping "+1" 603 times), confirmed the
screen showed the expected pre-completion state ("Page 603/604 · 1/day",
"Resume p604"), tapped "+1" once to cross the threshold, and got the
completion card exactly as the source promises — no dead "0/day" state, no
loop-back button.

**Not backporting to web this iteration** — this loop's mandate is
`apps/mobile`, and web already has its own tracked, unfixed bug for this
with a known fix direction pointed at the Reading Plans page's existing
completion pattern; out of scope here.

**Commit:** none (clean iteration; storage was only manipulated in the
disposable dev-server preview, not in any file in the repo).
