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

---

## Iteration 7 — catalogue items 7–8: Zakat "Reset" wiping prices / negative amounts (cross-reference)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

Catalogue perspectives A7 ("Zakat 'reset amounts' wiping unrelated fields")
and A8 ("negative Zakat asset amounts silently ignored") are the same two
web bugs already fully investigated and live-verified in
**[Iteration 2](#iteration-2--zakat-currency-field-sanitization-and-adjacent-resetnegative-amount-bugs)**
above, while checking the adjacent currency-sanitization perspective in the
same screen. Re-running the identical repro (tap `+1` on Gold-per-gram,
enter Cash, tap Reset, confirm price held; type a leading `-` into an
amount field, confirm it's stripped) would just reproduce that same
evidence a second time.

Not spending a full iteration re-testing what's already confirmed and
logged; advancing straight to catalogue group B (native platform
correctness) next. No code or test changes.

**Commit:** none (no work performed; cross-reference only).

---

## Iteration 8 — Android hardware back-button handling on every screen/modal

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** whether any screen overrides or could break the hardware
back-button's default "pop the stack" behavior.

**Result: clean by code review, with an honest verification gap.**
`apps/mobile/src` has **zero** custom back-button handling anywhere: no
`BackHandler` import, no `Modal` usage (not even re-exported from
[`Type.tsx`](apps/mobile/src/Type.tsx), the app's central RN-primitive
barrel), no `beforeRemove`/navigation-blocking listeners, and no
`presentation: "modal"` routes in any of the five stacks under
[`navigation/`](apps/mobile/src/navigation/). Every screen is a plain
native-stack push. That means hardware back is handled entirely by
`@react-navigation/native-stack`'s own default behavior — there is no
app-specific logic here that could have introduced a back-button bug, only
the library's own (extremely well-established) default.

**Genuine limitation, not glossed over:** this environment has no Android
emulator or device, so I could not press an actual hardware back button.
`react-native-web`'s `BackHandler` doesn't exist on web, so there is no
in-browser equivalent to fire. I tried the browser's own Back navigation as
a rough proxy (Tools → Zakat, then `navigate("back")`) and it jumped
straight to Home instead of popping one level to the Tools list — but this
is almost certainly a `react-navigation` web-linking/browser-history
artifact (tab switches likely `replace` rather than `push` a history entry;
`App.tsx`'s `linking` config governs URL↔screen mapping for the web/deep-link
target, a completely different code path from the native `BackHandler`
integration used on-device). Logging this as a curiosity, not a finding: it
says nothing about the real hardware back button, and this loop's mandate
is the Play Store (Android/iOS) target, not a web build — chasing a browser
`history` quirk here would be solving a problem nobody asked for.

**Not fixing anything.** No app-code changes to make when there's no
app-specific logic to find fault with; noting the verification gap
transparently instead of claiming coverage this environment can't provide.

**Commit:** none (clean iteration; no reproducible app-level issue).

---

## Iteration 9 — Deep link (`ummahlibrary://`) handling, including malformed links

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** `App.tsx`'s `linking` config and every param-taking deep-linked
screen (`SurahReader: "surah/:surah"`, `JuzReader: "juz/:juz"`,
`MushafPage: "page/:page"`, `PlanDetail: "plans/:id"`) for how they handle a
malformed or out-of-range param — a link a user could get from a bad share,
a stale bookmark, or someone probing the scheme.

**Found and fixed a real bug:** `SurahReaderScreen.tsx` had
`useEffect(() => { setLastRead(n); ... }, [n])` firing **unconditionally**,
two lines above the effect that actually validates `n`
(`!Number.isInteger(n) || n < 1 || n > TOTAL_SURAHS`) and shows a "Couldn't
load this surah." error. `setLastRead` itself does zero validation — it
just writes whatever number it's given straight to `AsyncStorage`. So
opening e.g. `ummahlibrary://surah/9999` (or `/abc` → `NaN`, or `/-5`)
showed the correct error on screen, but silently poisoned the persisted
"continue reading" surah with a number no real surah will ever match. Not a
crash — `HomeScreen.tsx`'s `{last && (...)}` guard means the "Continue
reading" card just quietly stops appearing — but genuine, unnecessary data
corruption from a single malformed link, and a real UX regression (losing
your actual continue-reading position) with no error surfaced anywhere.

**Fix:** gated the `setLastRead(n)` call with the same validity check the
adjacent effect already uses
([`SurahReaderScreen.tsx:147-153`](apps/mobile/src/screens/SurahReaderScreen.tsx#L147)).

**Live-verified** via `preview_start({name: "mobile"})`: navigated to
`/surah/9999` — got the "Couldn't load this surah." error, and
`localStorage.getItem('ul.lastRead')` stayed `null` (previously it would
have been `{"surah":9999}`). Navigated to `/surah/2` afterward — `lastRead`
correctly became `{"surah":2}`, confirming the guard didn't break the normal
path.

**Other screens on the same audit, all clean:**
- `JuzReaderScreen.tsx` validates `juz` before use and shows an error state;
  no unconditional side effect ahead of the check.
- `MushafPageScreen.tsx` validates via `isValidPageNumber(n)` before use and
  shows an error state. Minor, not-worth-fixing cosmetic note: the header
  title (`navigation.setOptions({ title: \`Page ${n}\` })`) is set before
  validation, so a malformed `/page/xyz` would flash "Page NaN" in the title
  bar above the "Couldn't load page NaN." error body — cosmetic only, no
  storage or state impact, and only visible via a malformed link in the
  first place.
- `PlanDetailScreen.tsx` doesn't read `route.params.id` at all — it always
  shows whatever `readActivePlan()` returns (this app supports one active
  reading plan at a time per ADR 0025). A malformed or garbage `:id` is
  simply never touched, so there's nothing to corrupt; noting this only
  because it means `plans/:id` deep links can't target a *specific*
  non-active plan today, which may or may not be intentional — not
  investigating further, as it's a design question, not a bug.
- The catch-all `NotFound: "*"` route in `App.tsx` correctly handles any
  path that doesn't match a configured screen at all.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` and `test`
(116/116) pass; `pnpm lint` — 0 errors, same 13 pre-existing warnings as
before (none new, none on the changed lines' logic).

**Commit:** `fix(mobile): don't persist an out-of-range surah from a
malformed deep link`.

---

## Iteration 10 — Cold start time and splash screen timing

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-01`

**Checked:** what the user sees between the OS launching the app and the
first real screen rendering.

**Found and fixed a real gap:** `App.tsx` has two sequential async startup
gates that each render `null` (nothing) while pending — `useFonts(fontMap)`
in `App()`, then a `getString(KEYS.onboarded)` read in `AppGate()`. Neither
`expo-splash-screen` nor any call to `preventAutoHideAsync`/`hideAsync`
existed anywhere in the app (not even installed as a dependency), so Expo's
default behavior applies: the native splash auto-hides as soon as the first
JS frame paints, which for this app is well before either gate resolves.
Net effect: native splash → **blank screen** for however long fonts +
the storage read take → onboarding or home screen. A blank flash between
splash and content is exactly the kind of thing App Store/Play Store
reviewers and users alike read as "janky."

**Fix:**
- `pnpm --filter @ummahlibrary/mobile add expo-splash-screen` (via
  `npx expo install`, so it resolved the SDK-54-matched version, `~31.0.13`)
  and added it to `app.json`'s `plugins` array alongside the app's other
  native-config packages.
- [`App.tsx`](apps/mobile/App.tsx): `SplashScreen.preventAutoHideAsync()` at
  module scope (swallowed with `.catch(() => {})`, matching this codebase's
  existing convention for platform APIs that might not exist — see web's
  `qada.ts` `emit()`), and `AppGate` now calls `SplashScreen.hideAsync()` in
  a `useEffect` once `onboarded !== null`. `AppGate` only ever mounts after
  `fontsLoaded` is already true (it's gated behind that in `App()`), so
  hiding on the onboarding-resolved signal correctly covers both async
  gates without lifting state or restructuring the component tree.
- Deliberately left the existing root-level `"splash"` image/color config in
  `app.json` untouched — this change only controls *when* the already-
  configured native splash hides, not what it looks like, so there was no
  reason to touch or risk that part.

**Verification, and its limits, stated plainly:** `pnpm --filter
@ummahlibrary/mobile typecheck` and `test` (116/116) pass; `pnpm lint` — 0
errors, same 13 pre-existing warnings. Confirmed the RN-web preview still
boots and renders normally with the change
(`preview_start({name: "mobile"})`). **What I could not verify:** actual
native splash-hide timing on a real device — `expo-splash-screen` has no
meaningful web behavior (there's no native splash to control there), so
this environment can't observe the fix doing its job. The implementation
follows Expo's own documented `preventAutoHideAsync`/`hideAsync` pattern
exactly; confirming it visually needs an Android/iOS build, which isn't
available here.

**Unrelated, pre-existing console error noticed while verifying, not
investigated:** both before and after this change, the web preview logs
`TypeError: this.validatePath is not a function` plus a 404 resource load
failure on every cold load (confirmed identical on the pre-change code via
`git stash`). Something (likely an Expo web shim for a native-only module —
not `expo-splash-screen`, since it reproduces without that package too)
probes a path that 404s on web. Doesn't visibly break anything tested so
far; flagging for whichever later iteration covers general error-console
hygiene rather than chasing it now.

**Commit:** `feat(mobile): keep the splash screen up until fonts and the
onboarding check are ready`.

---

## Iteration 11 — App background/foreground transitions (timers, audio, in-flight requests)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether backgrounding/foregrounding the app leaks timers,
desyncs UI state, or races in-flight work — specifically relevant here
since `app.json` declares `UIBackgroundModes: ["audio"]`, i.e. reciter audio
is *meant* to keep playing while backgrounded, not pause.

**Result: clean, and better-engineered for this than I expected.** Three
independent, purpose-built mechanisms already cover this:
- [`useSurahAudio.ts:163-168`](apps/mobile/src/audio/useSurahAudio.ts#L163) —
  an `AppState` listener sets a `resyncRef` on returning to `"active"`,
  specifically to force-repaint the word-highlight after backgrounding. The
  comment explains the exact failure mode this fixes: React's `setActiveWord`
  commits are throttled/suppressed while backgrounded, so without this the
  highlight would sit stale (right value, nothing painted) until the audio
  crossed into the next word. No pause-on-background logic anywhere, which
  is correct given the declared background-audio capability.
- [`sync-runtime.ts:1-12`](apps/mobile/src/lib/sync/sync-runtime.ts#L1) —
  explicitly documents and guards against app-launch and the `AppState`
  "active" trigger firing in the same tick and racing on the shared
  `ul.sync.meta` sidecar; an in-flight round's promise is reused instead of
  starting a second one.
- [`notifier.ts:7-9`](apps/mobile/src/notifier.ts#L7) — reminders re-sync on
  foreground specifically to roll a fired one-shot notification to the next
  day.
- The three UI "live clock" timers (`HomeScreen`, `PrayerTimesScreen`,
  `RamadanScreen` — `setInterval(() => setNow(new Date()), …)`) all clean up
  correctly on unmount via `return () => clearInterval(id)`. They don't need
  explicit background handling: the OS suspends the JS runtime while
  backgrounded, the interval simply doesn't fire, and because each tick sets
  `now` to the actual current time (not an incremented counter), resuming
  produces the correct value immediately — no drift or catch-up logic
  needed.

**Verification and its limits:** this is native app-lifecycle behavior
(`AppState` transitions, OS suspension) that `react-native-web` only
loosely approximates via document visibility, and this environment has no
Android/iOS device to background for real. Calling this clean based on
code review — three independent, already-documented mechanisms addressing
exactly this class of problem is stronger evidence than most of this loop's
"nothing custom exists to break" findings, but it's still not the same as
watching it happen on a device. Not claiming otherwise.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 12 — Kill-and-restore state integrity

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether the app survives having its process killed mid-write —
i.e., whether persisted state can end up as truncated/partial JSON, and
whether every consumer tolerates that instead of crashing on restart.

**Result: clean, with unusually strong existing coverage.**
[`storage.ts`](apps/mobile/src/storage.ts)'s `getJSON` wraps every read
(including `JSON.parse`) in try/catch and falls back to the caller's default
on any failure, plus an optional shape-validator (`isValid`) to reject
valid-but-wrong-shaped JSON (e.g. a synced peer payload, or `42` where an
object was expected) — the exact class of corruption a mid-write kill would
produce. `setJSON` similarly swallows write failures. Because
[ADR 0028](docs/adr/0028-persistence-enforcement.md) lint-enforces that
*nothing* touches `AsyncStorage` directly outside these wrappers, this
protection is structural, not something an individual screen could bypass.
[`stores-corrupt.test.ts`](apps/mobile/src/stores-corrupt.test.ts) already
unit-tests exactly this for essentially every store in the app (library,
plans, settings, qada, prayer tracker, ḥayḍ, fasting-qaḍāʾ, achievements,
reading goals, tasbih, reminders, prayer settings) — truncated/wrong-shape
values all fall back to safe defaults, never a crash.

**Live-verified beyond the unit tests** via `preview_start({name: "mobile"})`:
wrote genuinely truncated JSON (`'{"fajr":2,"dhu'`, `'{"template":'`), a
wrong-shape value (`'42'` for `ul.prayerLog`), and an empty string
(`ul.bookmarks`) directly into `localStorage`, then did a cold reload — Home
rendered normally (including "Continue reading" from the still-valid
`ul.lastRead`), no console errors beyond the already-flagged pre-existing
`validatePath` one, and Prayer Tracker (which reads the two deliberately
corrupted keys) rendered its normal empty state instead of crashing.

**Not independently verifiable here:** whether `AsyncStorage`'s underlying
native write (SQLite-backed on both platforms in current versions) is
itself atomic per key — that's third-party library behavior, not this
app's code, and not something a device-less environment can confirm either
way. Given every consumer already tolerates a corrupted read regardless,
it's not load-bearing for this app's resilience even if a native write
were ever non-atomic.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 13 — Tablet/iPad layout (`supportsTablet: true` — is it actually usable?)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** `app.json` sets `ios.supportsTablet: true` (iPad runs the app
un-scaled, not letterboxed), so live-tested several representative screens
at tablet widths via `resize_window` in the RN-web preview: 768×1024
(standard tablet preset) and 1024×1366 (iPad Pro portrait-ish).

**Result: functionally fine, one real but low-severity polish gap found —
logged, not fixed.** Only 5 of ~30 screens reference
`Dimensions`/`useWindowDimensions`/`maxWidth` at all
(`CollectionsScreen`, `HifzDashboardScreen`, `OnboardingScreen`,
`PrayerTrackerScreen`, `QiblaScreen`); everywhere else is plain
flex-based layout with no tablet-specific treatment, and nothing broke,
overflowed, or became unreadable at either tested width — `SurahList`,
`PrayerTracker`, `Home`, and the `SurahReader` verse view all held up fine,
since per-ayah blocks and card grids don't get meaningfully worse as the
viewport widens.

**What does look genuinely unpolished:** form screens like
[`ZakatScreen.tsx`](apps/mobile/src/screens/ZakatScreen.tsx) use a
label-left/`flex:1`-spacer/input-right `Row` layout
([`ZakatScreen.tsx:235-247`](apps/mobile/src/screens/ZakatScreen.tsx#L235))
with no content-width cap. At 1024px wide, the label hugs the left edge and
the (still `minWidth: 100`-sized) input pins to the far right with a huge
empty gap between them — functionally fine (still tappable, still typeable,
values still correct) but visually the kind of "obviously not designed for
this screen size" rough edge that would stand out on an actual iPad.

**Not fixing this now.** A content-width cap is a cross-cutting visual
design decision, not a per-screen bug — per `AGENTS.md`, palette/layout
primitives belong in `packages/ui` (the Noor design system), and something
like a shared `maxContentWidth` token/wrapper used consistently across
every screen is a design-system-level change, not a scoped fix for one
iteration of this loop. Recommending it as a concrete follow-up rather than
improvising a partial version here: e.g. a `ScreenContainer`/`FormRow`
primitive in `packages/ui` that caps and centers content past some width,
adopted screen-by-screen.

**Commit:** none (clean iteration; findings logged, no code changes — this
one specifically deferred rather than fixed).

---

## Iteration 14 — Safe-area/notch handling on every screen

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** every screen for whether it can render content under the
status bar/notch/home-indicator, given `App.tsx` renders headers via
`headerShown: false` at the **tab-navigator** level but the underlying
per-tab `Stack.Navigator`s (`HomeStack`, `ReadStack`, `ToolsStack`,
`HifzStack`, `MoreStack`) each set their own `screenOptions` independently.

**Result: clean, consistent pattern — but had to chase down one apparent
inconsistency to be sure.** Exactly 5 screens use
`useSafeAreaInsets`/`SafeAreaView`
(`HomeScreen`, `SurahListScreen`, `MoreMenuScreen`, `HifzDashboardScreen`,
`OnboardingScreen`), and cross-checking every stack's `Stack.Screen`
options confirms this is exactly right:

- 4 of the 5 (`Today`, `SurahList`, `MoreMenu`, `HifzDashboard`) are each
  the **root** screen of their stack with `headerShown: false` explicitly
  set, rendering their own custom "big title" instead of the native header
  — those need, and have, manual `insets.top` padding.
- `OnboardingScreen` renders entirely outside any navigator (`AppGate`
  shows it directly before `NavRoot` mounts), so it has no header chrome at
  all from any library and correctly handles its own insets.
- Every other screen — including, importantly, `ToolsListScreen` (`Tools`
  tab's root) and all ~24 pushed sub-screens across every stack — relies on
  `@react-navigation/native-stack`'s own default header (`headerShown`
  defaults `true`, not overridden), which has safe-area handling built in
  by the library itself. These correctly have *no* manual inset code.

**The apparent inconsistency, resolved:** `ToolsListScreen` was the one
root screen that looked odd — no `headerShown: false`, no manual insets,
yet the RN-web preview renders its "Tools" title flush at the top-left with
no visible header bar, looking identical in style to the other four
screens' *custom* big titles. Checked `ToolsListScreen.tsx` directly: it
defines no title text of its own anywhere (its only string literals are the
11 tool-tile labels) — the "Tools" text on screen is the native header's
`title` from `ToolsStack.tsx`'s `options={{ title: "Tools" }}`. The visual
similarity is just `react-native-web`'s native-stack header shim rendering
minimally (no border/shadow) in this preview, not a real header being
skipped — the actual native header component (and its safe-area handling)
is still there and is guaranteed by the library on a real device regardless
of how flat the web shim draws it.

**Verification and its limits:** confirmed via code audit across every
`navigation/*.tsx` file and `preview_start({name: "mobile"})`. Like
back-button handling (iteration 8), the actual safe-area *reservation* is
native-stack/bottom-tabs library behavior this app's code can't uniquely
break — `react-native-web` has no real notch to observe the difference
against, so the visual confirmation here is necessarily about *which
screens have the responsibility* (custom title → needs manual insets, all
do) rather than pixel-perfect notch clearance, which needs a real device.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 15 — Keyboard-avoiding behavior on every text-input screen

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** every screen with a `TextInput` for whether the keyboard could
obscure it, with no way to bring it back into view.

**Found and fixed a real gap on 2 of 5 screens.** Of the 5 screens with a
`TextInput` (`ZakatScreen`, `SearchScreen`, `SurahListScreen`,
`CollectionsScreen`, `PlansScreen`), only `ZakatScreen` wrapped its
`ScrollView` in a `KeyboardAvoidingView`. `SearchScreen` and
`SurahListScreen` don't need it — their input is a search bar fixed at the
very top, never at risk of being covered by a keyboard opening from the
bottom. But:

- **`CollectionsScreen`** — the per-collection rename `TextInput` sits
  inside a card that can itself be arbitrarily tall (each collection can
  hold many saved āyāt, each rendered with Arabic text, translation, and
  notes), and multiple collections stack in one long `ScrollView`. A rename
  on anything but the first collection could land well below the fold.
- **`PlansScreen`** — the "Create your own" custom-plan pages-per-day/days-
  to-finish `TextInput` sits at the very bottom of a `ScrollView` listing
  every preset plan above it (confirmed live: had to scroll past ~6 preset
  plan cards to reach it).

Neither had any keyboard-avoiding treatment at all.

**Fix:** wrapped both screens' `ScrollView` in a `KeyboardAvoidingView`
(`behavior={Platform.OS === "ios" ? "padding" : undefined}`), copying
`ZakatScreen`'s exact, already-established pattern rather than inventing a
new one — this codebase had already solved this problem once; the other
two screens just hadn't been brought in line with it.

**Live-verified functionally** via `preview_start({name: "mobile"})`:
created a collection and renamed it via the (now keyboard-avoiding-wrapped)
input — typed correctly, value updated. Scrolled to `PlansScreen`'s custom
plan section, changed "Pages a day" from 2 to 5 — value updated, estimated
duration recalculated (121 days) and finish date recalculated
(2027-01-20) correctly. Functional correctness confirmed; actual
on-device keyboard-obscuring behavior itself isn't observable in a desktop
browser (no virtual keyboard triggers there), same verification-gap caveat
as other native-only perspectives in this loop — the fix's mechanism
(`KeyboardAvoidingView`'s `padding` behavior) is the same one already
shipped and presumably working in `ZakatScreen`, not a new unverified
pattern.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass; `pnpm lint` (full workspace) — 0 errors, same 13
pre-existing warnings. Both files re-formatted with `prettier --write`
after the JSX wrap.

**Commit:** `fix(mobile): wrap Collections and Plans screens in
KeyboardAvoidingView`.

---

## Iteration 16 — Android permission request flow (location, notifications)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether every location/notification permission request has a
clear rationale and a real path forward after denial, across
`QiblaScreen`, `MosqueFinderScreen`, `PrayerTimesScreen` (location) and
`notifier.ts` + its three reminder-toggle callers (notifications).

**Notifications: clean.** `notifier.ts`'s `schedule()` explicitly checks
`cachedPermission !== "granted"` before ever touching the OS scheduler —
denied permission means reminders silently don't fire, never an error.
`PlanReminderToggle`/`AdhkarReminderToggle`/`SunnahFastReminderToggle` all
request permission on first toggle-on and — with an explicit comment
explaining the choice — leave the switch off rather than show "on" for a
reminder that will never fire. `app.json`'s `expo-location` plugin config
already has a real rationale string
(`"Allow Ummah Library to use your location to calculate prayer times and
find the qibla direction."`) for the OS's own permission dialog.

**Found and fixed a real, consistent gap on the 3 location screens.**
`QiblaScreen`, `MosqueFinderScreen`, and `PrayerTimesScreen` each had the
identical denied-state message — "Location permission was denied. Enable
it in Settings." — with only a "Try again" button that just re-calls
`requestForegroundPermissionsAsync()`. On a *permanent* denial (Android's
"Don't ask again", or iOS after a first decline), the OS won't re-show the
prompt — the button silently re-fails with no visible feedback, and the
message tells the user to go to Settings without giving them any way to
get there. `Linking.openSettings()` was never called anywhere in the app.

**Fix:** added a second "Open Settings" button next to "Try again" in all
three denied-state blocks, calling `Linking.openSettings()` — the standard
cross-platform API for this exact situation. Kept "Try again" too, since
it's still the faster path for a non-permanent denial.

**Smaller, related gap logged but not fixed:** the notification-permission
toggles (`PlanReminderToggle` etc.) give *zero* feedback when denied beyond
the switch not flipping on — no message explaining why, unlike the location
screens' full denied-state view. Lower severity (a secondary toggle buried
in a settings-adjacent surface, not a primary screen's core flow) and would
need a different UI treatment (inline text or a toast near a switch, not a
full-screen state), so treating it as a separate, smaller follow-up rather
than bundling it into this fix.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass; `pnpm lint` — 0 errors, same 13 pre-existing warnings.
Live-verified via `preview_start({name: "mobile"})` that `QiblaScreen`
still renders its normal initial state after the change. **Not verified
live:** the actual denied-state render with both buttons — inducing a real
permission denial isn't reliably scriptable against a desktop browser's
geolocation prompt in this environment. The change itself is a small,
purely additive JSX addition (one more `Pressable` in an existing row),
already confirmed syntactically and structurally sound by typecheck, lint,
and `prettier`.

**Commit:** `fix(mobile): add an Open Settings shortcut when location
permission is denied`.
