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

---

## Iteration 17 — Audio playback interruption (calls, other apps, headphone unplug)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether reciter audio handles an OS-level interruption
(incoming call, another app taking audio focus, headphone route change)
gracefully instead of desyncing the queue, skipping āyāt, or leaving the
UI stuck on "playing" while actually silent.

**Result: clean — this is the most deliberately-engineered perspective
I've audited yet.** [`useSurahAudio.ts:382-401`](apps/mobile/src/audio/useSurahAudio.ts#L382)'s
`playbackStatusUpdate` listener explicitly distinguishes "paused because
buffering" from "paused after having genuinely played" and names the exact
scenario this loop's perspective is asking about, verbatim, in its own
comment: *"the screen went off, a call came in, or the system took audio
focus. Freeze the stall watchdog so we hold on this āyah and its highlight
instead of skipping ahead; playback (and the poll below) resumes us when
audio comes back."* Concretely: the stall-detection timer (which would
otherwise skip a hung āyah after `STALL_MS`) is deliberately cleared during
an external pause so the queue doesn't advance or skip while genuinely
interrupted, and the word-highlight poll (which drives `resyncRef`, see
[iteration 11](#iteration-11--app-backgroundforeground-transitions-timers-audio-in-flight-requests))
naturally re-syncs once playback resumes.

Also relevant and already in place: `setAudioModeAsync({ playsInSilentMode:
true, shouldPlayInBackground: true })` keeps the audio session alive
through backgrounding rather than fighting `expo-audio`'s own auto-pause,
and lock-screen/notification media controls (`setActiveForLockScreen`) are
armed once per session — the comment there notes "an external pause is
handled by the pause-aware watchdog below," i.e. the lock-screen pause
button and a genuine OS interruption both flow through the exact same,
already-audited path.

**Verification and its limits:** this is native OS behavior (telephony
interruption, audio-focus arbitration, headphone route change) that
`react-native-web` has no equivalent for and this environment has no real
device to phone-call-interrupt. Calling this clean based on the code: the
comment doesn't just claim generic robustness, it names this exact
perspective's three scenarios (call, other-app audio focus, "screen went
off") as the specific case being handled, which is stronger evidence than
most "nothing custom exists to break" findings elsewhere in this loop —
but it's still reasoning from source, not a watched device.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 18 — Offline/airplane-mode behavior on every network-touching screen

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether losing network access mid-session produces a graceful
error instead of a crash, blank screen, or infinite spinner — across both
never-fetched and previously-fetched content.

**Result: clean, and unusually thoroughly live-verified.** `api.ts` wraps
essentially every content call — surahs, translations, tafsir, hadith
sections, 99 names, adhkar, search corpus — in `readThrough`
([`offlineCache.ts`](apps/mobile/src/offlineCache.ts)): network-first,
falling back to a disk cache on failure, with age/size-bounded eviction
(`stores-corrupt.test.ts`'s sibling for this layer). Verified live via
`preview_start({name: "mobile"})` by overriding `window.fetch` to always
reject (a true offline simulation, not just a slow/flaky one):

- **Never-fetched content while offline** (`SurahReader` for a fresh
  surah, `NamesScreen`): each showed a clear, screen-specific error
  ("Couldn't load this surah.", "Could not load names. Check your
  connection.") — no crash, no blank screen, no stuck spinner.
- **Previously-fetched content while offline** (re-opened a surah already
  loaded earlier in the same session): also showed the "couldn't load"
  error rather than serving the disk cache.

**Traced the cache-miss to its actual cause rather than reporting it as a
bug:** `expo-file-system`'s own web implementation
(`node_modules/expo-file-system/src/ExpoFileSystem.web.ts`) is an explicit,
official stub — every method just does `console.warn('expo-file-system is
not supported on web')` and no-ops. `offlineCache.ts` already wraps every
disk operation in try/catch, so this isn't a crash — it's `readThrough`
correctly and silently falling back to "network only" on a platform whose
disk-cache primitive doesn't exist. This is a **verification-environment
limitation, not an app bug**: on a real Android/iOS device,
`expo-file-system` is a mature, fully-native module and the disk cache
should genuinely serve previously-fetched content offline there — the
RN-web preview simply cannot exercise that specific path, the same class of
gap as several native-only perspectives earlier in this loop, just traced
all the way to its root cause this time instead of stopping at "can't
verify."

**Not fixing anything** — there's nothing broken in this app's own code to
fix; the graceful-degradation design (try/catch everywhere, no raw
propagation of a cache failure) is exactly what made the web-only
cache-unavailability a non-event instead of a crash.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 19 — Notification scheduling correctness (DST, timezone change, reboot, exact-alarm restrictions)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** whether scheduled prayer/adhkar/plan reminders survive a
device reboot, stay correct across a DST transition or timezone change, and
account for Android 12+/13+'s exact-alarm restrictions.

**Device reboot: clean.** `expo-notifications`' own bundled native
`AndroidManifest.xml`
(`node_modules/expo-notifications/android/src/main/AndroidManifest.xml`)
declares `RECEIVE_BOOT_COMPLETED` and a receiver listening for
`BOOT_COMPLETED`/`REBOOT`/`QUICKBOOT_POWERON`/`MY_PACKAGE_REPLACED` — the
library re-registers scheduled alarms after a reboot itself. Nothing for
this app to add; Expo's autolinking merges the module's manifest into the
build automatically regardless of `app.json`'s own `android.permissions`
list.

**DST / timezone change: reasonably mitigated, one narrow residual edge
case that's an industry-wide hard problem, not unique to this app.**
`reminders.ts`'s `now: () => Date` clock and `localDateStr` resolve against
whatever the *current* system timezone is at call time (plain JS `Date`
semantics), and `App.tsx` re-syncs every reminder family on every
foreground (`AppState` → `syncAll()`), which cancels and reschedules each
notification's next occurrence freshly. Since `expo-notifications` schedules
a `DATE` trigger as a fixed absolute instant, the one gap this can't
self-heal is: a DST shift happening **while the app hasn't been
foregrounded since**, before the reminder fires — the already-scheduled
instant doesn't move with the new offset (a ~1-hour drift, up to twice a
year). This is the same limitation any app using one-shot absolute-instant
OS notifications has (as opposed to `RRULE`-based recurring calendar
alarms, a different, heavier native API this app doesn't use) — not
something worth re-architecting notification scheduling to chase.

**Real, Play-Store-policy-sensitive finding — documented, not
unilaterally fixed.** `expo-notifications`' Android scheduling delegate
(`ExpoSchedulingDelegate.kt:106`) already degrades gracefully:
`if (SDK < 31 || alarmManager.canScheduleExactAlarms()) setExactAndAllowWhileIdle(...)
else setAndAllowWhileIdle(...)` — no crash either way. But neither the
library's manifest nor this app's `app.json` declares
`SCHEDULE_EXACT_ALARM` (or the newer, auto-granted-but-category-restricted
`USE_EXACT_ALARM`), so on Android 13+ `canScheduleExactAlarms()` will be
`false` and every prayer/adhkar/plan reminder falls back to **inexact**
delivery — the OS batches it within a window (commonly a few minutes,
more under Doze) rather than firing at the precise minute. For a prayer-times
app this is a real, user-visible precision trade-off, not a hypothetical
one. **Deliberately not adding the permission in this iteration**:
`SCHEDULE_EXACT_ALARM` is a Google Play–restricted permission as of the
2024 policy tightening — declaring it requires a Play Console justification
and apps outside the alarm-clock/calendar category risk rejection or
removal for using it without qualifying. That's a product/policy decision
with real Play Store submission consequences, not a pure code-correctness
call this loop should make unilaterally. Flagging it clearly so the team
can decide: accept inexact delivery on Android 13+ (current, safe default),
or pursue `SCHEDULE_EXACT_ALARM` with the Play Console justification that
requires.

**Commit:** none (clean iteration; the exact-alarm trade-off is a
documented decision point, not a code change).

---

## Iteration 20 — AsyncStorage/SQLite migration safety and corrupted-store recovery

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-02`

**Checked:** every stored-value-shape migration in the mobile app (distinct
from [iteration 12](#iteration-12--kill-and-restore-state-integrity)'s
corrupt-JSON recovery — this is about *old-version-to-new-version* shape
upgrades). No direct `expo-sqlite` usage exists in `apps/mobile` (SQLite
usage in the codebase is `packages/adapters`' `SqliteHifzRepository`, a
different, server-side concern per `ARCHITECTURE.md`) — mobile persistence
is entirely `AsyncStorage`-backed.

**Found four migrations, three already correct, one fixed to match them.**
- `tasbih-store.ts` (the per-phrase-progress shape, see
  [iteration 3](#iteration-3--tasbih-per-phrase-counter-mobiles-opposite-bug-from-web)) —
  reads the old flat shape, migrates, and `await setJSON(...)`s it back.
  Tested.
- `sync-settings.ts`'s `readSyncSecret()` — migrates a pre-hardening
  plaintext `AsyncStorage` secret into the secure Keychain/Keystore store,
  then removes the plaintext copy, with a doc comment explicitly promising
  "an app update never looks like sync silently turned off." Tested
  (`sync-settings.test.ts`: "migrates a pre-hardening plaintext secret...").
- `sync-meta.ts`'s `loadMeta()` — migrates the legacy `"millis:counter:node"`
  string HLC clock format to the structural `{millis, counter, node}` shape.
  Tested (`sync-meta.test.ts`: "migrates the legacy... string clock").
- **`theme.tsx`'s `loadTheme()` — migrated the legacy `"dark"`/`"light"`
  theme keys to the new named-theme keys (`"obsidian"`/`"ivory"`) correctly
  in memory, every launch, but never wrote the migrated value back to
  storage** (`setThemeKey(key)` with no matching `setString(KEYS.theme,
  key)`, unlike every other migration above). Functionally harmless on its
  own — the map-on-read is deterministic and reapplied every launch, so the
  displayed theme was always correct — but it meant the legacy value would
  persist in storage (and whatever a sync round pushes to another device)
  forever, and the `LEGACY` compatibility table could never be safely
  removed from the codebase.

**Fix:** [`theme.tsx`](apps/mobile/src/theme.tsx) now calls `setString`
once, only on an actual legacy-value hit, to persist the migrated key —
matching the write-back pattern every other migration in this codebase
already uses.

**Live-verified** via `preview_start({name: "mobile"})`: wrote
`localStorage.setItem('ul.theme', 'dark')` (simulating a pre-migration
install), reloaded — before the fix, `ul.theme` stayed `"dark"` after
launch (correct theme rendered, but storage never updated); after the fix,
it reads `"obsidian"` post-launch, confirmed by re-checking after the
reload completed.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass (no test added for this specific change — `theme.tsx`
is UI-context code outside this repo's store/`.test.ts` convention,
consistent with earlier iterations' findings on what does and doesn't get
unit-tested here); `pnpm lint` — 0 errors, same 13 pre-existing warnings.

**Commit:** `fix(mobile): persist the migrated theme key instead of
re-mapping it every launch`.

---

## Iteration 21 — Secure storage of the sync recovery secret (parity with web's hardening)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** whether mobile's recovery secret is stored at rest the same
way web's was hardened to (per the recent `feat(sync): harden the recovery
secret at rest (#275)` commit already on `main`).

**Result: clean — this was never a mobile-lagging-behind-web gap in the
first place.** `git show --stat 8da793c` (the hardening commit itself)
covers **both** platforms in one PR: *"Mobile: moves it from plain
AsyncStorage into expo-secure-store (iOS Keychain / Android Keystore). A
pre-hardening install's plaintext copy is migrated in, in place, on first
read. Web + extension: wraps it with a non-extractable AES-256-GCM key...
before it touches localStorage."* — the platform-appropriate primitive for
each (mobile gets real OS-level secure storage; web doesn't have that, so
it gets a non-extractable wrapping key instead). Confirmed in
[`sync-settings.ts`](apps/mobile/src/lib/sync/sync-settings.ts) (already
reviewed in [iteration 20](#iteration-20--asyncstoragesqlite-migration-safety-and-corrupted-store-recovery)
for its migration logic): `enableSync()` writes a **new** secret straight
to `expo-secure-store`, never touching plaintext `AsyncStorage`; `readSyncSecret()`
migrates a pre-hardening plaintext copy in on first read; `disableSync()`
clears both the secure entry and any leftover legacy plaintext copy
defensively. `expo-secure-store` is correctly listed in `app.json`'s
`plugins`.

**Bonus: closed out iteration 10's unexplained pre-existing console
error.** While checking whether `expo-secure-store` has a web
implementation (it does, but a real no-op one — its own `.web.ts` is a bare
`export default {}`, so `SecureStore.getItemAsync`/`setItemAsync` correctly
*throw* on web, which `sync-settings.ts`'s try/catch already anticipates
with an explicit "SecureStore unavailable" comment), I checked its sibling
stub, `expo-file-system`, for the same pattern — and found the exact source
of the `TypeError: this.validatePath is not a function` error that's
appeared in every single preview session this entire loop
(first noted, unexplained, in [iteration 10](#iteration-10--cold-start-time-and-splash-screen-timing)).
`expo-file-system/src/FileSystem.ts`'s `File`/`Directory` constructors both
call `this.validatePath()` right after `super()`
(`node_modules/expo-file-system/src/FileSystem.ts:84,170`) — but the web
platform's `ExpoFileSystem.FileSystemFile`/`FileSystemDirectory` (confirmed
in [iteration 18](#iteration-18--offlineairplane-mode-behavior-on-every-network-touching-screen))
are bare stub classes with no prototype methods at all, so the method
doesn't exist. `offlineCache.ts`'s `cacheDir()`/`ensureDir()` construct a
`Directory` on essentially every API call, which is why this fires
constantly. **Confirmed this is purely a web-preview artifact with zero
functional impact** (the app has worked correctly through every offline,
corruption, and migration test in this entire loop despite it) **and not
worth fixing** — silencing it would mean either skipping the offline-cache
layer on web (defeating the point of using this preview as a QA tool) or
patching around a third-party stub, for a console line nobody using the
real Android/iOS app will ever see. Recording the root cause here so no
future iteration re-flags it as a mystery.

**Commit:** none (clean iteration; no code changes — both findings are
confirmations, not bugs).

---

## Iteration 22 — Sync engine mobile edge cases (killed mid-sync, incremental cursor, conflict merges, and the deferred backgrounded-push race)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** the four sync edge cases named in the catalogue, including
closing out the race [deferred from iteration 4](#iteration-4--qada-stepper-race-condition-under-rapid-taps)
(`onSyncApplied(load)` re-reading stores wholesale could clobber an
in-flight optimistic local tap).

**Killed mid-sync: clean, safe by design.**
[`sync-engine.ts:79-125`](packages/core/src/sync-engine.ts#L79) only
advances the persisted cursor (`state.setCursor?.(cursor)`) **once, after**
the full push/pull exchange loop completes — every page's entries are
applied and durably persisted (`state.apply(...)`, awaited) *inside* the
loop, strictly before the cursor that would let a future round skip past
them. Kill the app mid-round and the next launch's round starts from the
same old cursor and safely re-pulls/re-applies whatever didn't get a
chance to advance the cursor — redundant work, not data loss, since
`state.apply` is LWW/clock-keyed and re-applying an already-applied entry
at the same HLC is a no-op. This is the textbook-correct way to make an
interruptible sync protocol interruption-safe.

**Incremental cursor and conflict merges: clean, already thoroughly
tested.** `mobile-sync-state-store.test.ts` explicitly covers "persists and
reports the incremental-pull cursor (ADR 0035)" and the dirty/markPushed
bounded-push bookkeeping; `sync-runtime.test.ts` covers round coalescing
("coalesces concurrent calls into a single in-flight round") and recovery
from a stuck state ("resetSyncRuntime breaks coalescing so 'turn on' isn't
stuck on a stale OFF round"); `sync-e2e.test.ts`'s two-device round-trip
exercises the actual conflict-merge path end to end.

**The deferred backgrounded-push race: real, narrow, and — after
deeper analysis — deliberately left as a documented recommendation rather
than a speculative fix.** 9 screens subscribe to `onSyncApplied`; of
those, `PrayerTrackerScreen` is the clearest one with both local optimistic
mutations (qada/prayer-log/ḥayḍ taps, all otherwise race-safe per
[iteration 4](#iteration-4--qada-stepper-race-condition-under-rapid-taps))
*and* a wholesale `load()` reload triggered by the same event. The exact
failure mode: `qadaStore.read().then(setQadaLog)` is a plain (non-merging)
assignment; if that read resolves between two rapid local taps — i.e. a
remote sync round completes at almost the same instant as an in-progress
local interaction — the second tap's functional updater would derive its
`next` from the just-reloaded (and possibly stale-relative-to-the-first-tap)
value instead of the true latest local state.

Not fixing this speculatively: reproducing the actual race needs real
multi-device sync timing (a remote push landing within milliseconds of a
local tap), which this environment can't simulate reliably enough to
verify a fix actually closes the window without introducing a *different*
regression in genuinely complex async coordination code. Recommending a
concrete direction instead of guessing: track a short-lived
"just-wrote-locally" flag per store (e.g. skip/defer a sync-triggered
reload for a store with a write inside the last ~500ms, or merge the
freshly-read value against current state instead of overwriting outright).
This is a UI-layer refinement on top of an already-correct core sync
protocol, not a data-integrity bug — worth doing, not urgent enough to ship
unverified.

**Commit:** none (clean iteration; the backgrounded-push race is a
documented recommendation, not a code change).

---

## Iteration 23 — RTL/Arabic rendering correctness (Indopak script, word-level highlighting, mixed-direction layout)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** Arabic text direction, the IndoPak script variant, word-by-word
transliteration alignment, and mixed RTL/LTR layout (Arabic word row above
an English translation line) — live, not just by code reading.

**Result: clean, thoroughly live-verified.** Via
`preview_start({name: "mobile"})`: switched **Settings → Arabic Script**
from Uthmani to **IndoPak**, then opened Al-Kahf in both reading modes:

- **Verse-by-verse view, word-by-word on:** IndoPak glyphs render correctly
  (visually distinct from Uthmani, as expected), the verse reads
  right-to-left with correct word order, and tapping a word triggers
  tap-to-hear audio. The transliteration row beneath each āyah is
  **RTL-ordered to match** — e.g. for āyah 1, the transliteration reads
  (left→right) "…walam yaj'al lahu 'iwaja" with "**al-ḥamdu**" (the first
  word) rightmost, directly under the rightmost (first) Arabic word,
  exactly mirroring the Arabic line above it word-for-word rather than
  reading in a fixed LTR order that would misalign under RTL text.
- **Continuous "Reading" (Mushaf-style) view:** paragraph-flow RTL text
  renders correctly across multiple āyāt with ayah-end ornament markers
  correctly inline, no reversed flow, no overlap.
- **Mixed-direction layout:** the RTL Arabic + transliteration block sits
  above an LTR English translation line with no direction bleed or bidi
  glitches in either script mode.

No code changes — this perspective checked out clean on live inspection
across both reading modes and both scripts.

**Commit:** none (clean iteration; no code changes).

---

## Iteration 24 — Font loading fallback and flash-of-unstyled-text

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** whether every font used anywhere in the app is covered by the
startup loading gate (no flash-of-unstyled-text risk from a font that
loads outside it), and what happens if font loading fails outright.

**No FOUT risk — clean.** [`fonts.ts`](apps/mobile/src/fonts.ts)'s single
`fontMap` (passed to the one `useFonts()` call in `App.tsx`) includes
*every* typeface the app uses: all 5 Hanken Grotesk (Latin UI) weights, all
4 IBM Plex Sans Arabic weights, and the IndoPak Nastaʿlīq face (checked
live in [iteration 23](#iteration-23--rtlarabic-rendering-correctness-indopak-script-word-level-highlighting-mixed-direction-layout)).
Nothing loads a font lazily or outside this gate, so there's no path to a
flash of system-default text anywhere in the app.

**Found and fixed a real, severe failure mode: a single bad font asset
could freeze the app forever.** `expo-font`'s own `useFonts` implementation
([`node_modules/expo-font/src/FontHooks.ts`](node_modules/expo-font/src/FontHooks.ts))
returns `[loaded, error]` — and critically, **if the load ever rejects,
`loaded` never becomes `true` on its own**; only a successful load sets it.
`App.tsx` destructured only the first element
(`const [fontsLoaded] = useFonts(fontMap)`), silently discarding `error`.
Combined with `if (!fontsLoaded) return null` gating literally the entire
app, **and** [iteration 10](#iteration-10--cold-start-time-and-splash-screen-timing)'s
`SplashScreen.hideAsync()` only firing once that gate clears: a single
corrupted, missing, or unparseable font asset — the custom
converted-from-`.woff2` IndoPak `.ttf` being the most exposed candidate,
being the one non-Google-Fonts-package asset in the map — would leave the
user staring at a **permanently frozen native splash screen**, with no
error surfaced, no fallback, and no way to proceed. Not a hypothetical:
`loadAsync` loads local bundled assets, so this needs a bad *build*, not a
bad network condition, but corrupted asset bundling and per-device font-
parsing quirks are real, non-zero-probability failure classes — and the
consequence (total, silent, unrecoverable app-startup failure) is about as
severe as this loop has found.

**Fix:** [`App.tsx`](apps/mobile/App.tsx) now destructures `fontError` too
and gates on `if (!fontsLoaded && !fontError) return null` — proceeding
past the splash screen with the OS default typeface on a font-load error
instead of hanging forever. A screen that looks slightly off-brand is
categorically better than an app that never starts.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass; `pnpm lint` — 0 errors, same 13 pre-existing warnings.
Live-verified the normal (fonts-load-successfully) path still boots and
renders identically via `preview_start({name: "mobile"})` — no regression.
**Not verified live:** the actual error path itself, since the RN-web
preview's fonts load successfully and deliberately corrupting a real font
asset to force the failure would be a messier, riskier way to test a
two-line, directly-sourced-from-the-library's-own-documented-return-type
fix than the risk warrants.

**Commit:** `fix(mobile): don't let a failed font load freeze the app on
the splash screen forever`.

---

## Iteration 25 — Large accessibility text scaling (Android font scale up to 200%) without layout breakage

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** whether the app's layout survives the OS's large-text
accessibility setting, and whether text scaling is disabled anywhere (the
more common, worse mistake).

**Baseline is good:** no screen sets `allowFontScaling={false}` anywhere —
confirmed by grep across `apps/mobile/src`. Every screen respects the
user's OS text-scale setting by default, which is the right starting
point; the risk with this perspective is layout breakage *because* scaling
is respected, not text being frozen.

**Found and fixed real breakage, with a genuine live simulation, not just
code reading.** This environment has no way to change a real OS
accessibility font-scale setting, but I could still get a real visual
signal: injected a script into the running RN-web preview that scales
every rendered leaf text node's *computed* font-size (via
`!important`, since react-native-web's atomic CSS beats a plain inline
style) by 2x — the same 200% Android supports — and screenshotted the
result on `HomeScreen` and `SurahListScreen`. **The Noon `AyahBadge`
component** (`apps/mobile/src/components/AyahBadge.tsx` — the gold khatam-
star badge showing a surah/āyah number, used on `HomeScreen`,
`SurahListScreen`, `HifzDashboardScreen`, and `AyahView`) **visibly
overflows its fixed 40×40 container at 2x scale** — the number spills
outside the star outline, confirmed on both the Home "Continue reading"
card's surah badge and the surah-list row badges (65–69 tested).
Everything else observed (card text, translation lines, tab bar labels)
reflowed acceptably — wrapping to extra lines or growing card height
rather than clipping — which is the correct, expected behavior for
non-fixed-size containers.

**Fix:** capped `AyahBadge`'s number specifically with
`maxFontSizeMultiplier={1.3}` — the number still grows somewhat with the
user's accessibility setting (unlike disabling scaling outright, which
would be a worse regression), just not far enough to break its
40×40 decorative badge. The badge's number is a secondary ordinal marker;
the surah's actual name/text next to it is unaffected and continues to
scale fully.

**Verification, and an honest caveat on the test method:** `pnpm --filter
@ummahlibrary/mobile typecheck` clean (confirms `maxFontSizeMultiplier` is
a recognized `Text` prop); `test` 116/116 pass; `pnpm lint` — 0 errors,
same 13 pre-existing warnings. Confirmed no regression at normal scale via
`preview_start({name: "mobile"})`. **What the DOM-scaling simulation
can't verify**: `maxFontSizeMultiplier` is an RN-native concept keyed off
`PixelRatio.getFontScale()`, which my test method bypasses entirely (it
sets raw CSS `font-size` on every node, including the capped one) — so I
could use it to *find* the bug, but not to confirm the *fix* takes effect
through the real mechanism. That needs a real device (or Android's font-
scale accessibility setting via an emulator), which isn't available here.

**Commit:** `fix(mobile): cap AyahBadge's number so it doesn't overflow at
large accessibility text scale`.

---

## Iteration 26 — Screen-reader labels and focus order on every screen

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** every icon-only interactive element across every screen and
component for a missing `accessibilityLabel` — the pattern that leaves a
button meaningless (or silently unannounced) to TalkBack/VoiceOver.
Delegated the sweep to a research agent covering all 30 screens + 12
components, since exhaustively reading every `Pressable` by hand doesn't
scale well to a file count this size; verified its findings directly rather
than trusting the summary blind.

**Result: the codebase is already largely accessible — only 3 genuine
gaps found, all fixed and live-verified through the real accessibility
tree.**

- **`PrayerTimesScreen.tsx`** — the per-prayer reminder bell (×5,
  Fajr/Dhuhr/Asr/Maghrib/Isha) had `accessibilityRole="switch"` and
  `accessibilityState` but no `accessibilityLabel`, so TalkBack would
  announce just "bell, switch, on/off" with no indication of *which*
  prayer. The near-identical toggle in `HijriCalendarScreen.tsx` already
  had the correct pattern — this one just hadn't been brought in line.
  Fixed to match:
  `` `${reminders[name] ? "Turn off" : "Turn on"} reminder for ${PRAYER_LABELS[name]}` ``.
- **`TranslationManager.tsx`** and **`SearchScreen.tsx`** — both use a
  bare `"✕"` `Text` glyph (not the `Icon` component, so technically outside
  the agent's original search scope, but the same underlying gap) as the
  sole content of a `Pressable` — the modal-close button and the search-
  clear button. Added `accessibilityLabel="Close"` and `accessibilityLabel="Clear search"`
  respectively. Checked for more of the same bare-glyph pattern
  (`grep '>✕<'`) — one more hit in `CollectionsScreen.tsx`, already
  correctly labelled (`` `Remove ${key}` ``), so not a gap.

**Live-verified through the actual accessibility tree**, not just visually,
via `preview_start({name: "mobile"})` and `read_page`: after injecting
`ul.prayerCoords` directly into storage to reach the live prayer list
(this sandbox can't grant a real geolocation permission), the tree now
reports `switch "Turn on reminder for Fajr"`,
`switch "Turn on reminder for Dhuhr"`, etc. for all five prayers;
`generic "Clear search"` appears on `SearchScreen` once a query is typed;
`generic "Close"` appears on the Translations modal. This is the strongest
verification available short of a real screen reader — the accessibility
tree is exactly what TalkBack/VoiceOver read from.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass; `pnpm lint` — 0 errors, same 13 pre-existing warnings.

**Commit:** `fix(mobile): add missing accessibilityLabels to 3 icon/glyph-only buttons`.

---

## Iteration 27 — Touch target sizing (≥44×44dp) on icon buttons, steppers, tab bar

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** whether icon-only buttons and small controls meet the
44×44dp minimum touch-target guideline (Android accessibility / Material
Design), live-measuring real DOM bounding boxes in the running preview
rather than guessing from styles alone.

**Found and fixed two real, high-leverage gaps.** A first broad
measurement pass over every `role="button"/"switch"/"tab"` element
produced a huge, noisy result (~400 near-duplicate entries, almost
certainly per-āyah elements and other screens' DOM still mounted off-
screen by React Navigation) — not a useful way to work, and I didn't try to
salvage it; I went back to source instead, using the two genuinely small
measurements from that pass (a 40×20-ish "switch" and 68–79×31 toggle
chips) as leads to chase down directly in code:

- **`SaveToCollection.tsx`'s icon-only bookmark toggle** — an 18×18 `Icon`
  in a `Pressable` with `hitSlop={8}`, a 34×34 effective tap target. This
  component renders **once per āyah** via `AyahView.tsx` (i.e. constantly,
  throughout the entire reading experience) plus once on `HomeScreen`'s
  "Verse of the day" card — plausibly the single most-tapped icon-only
  control in the app. Bumped `hitSlop` to `13` (18 + 13 + 13 = 44, exactly
  at the guideline).
- **`ReaderControls.tsx`'s three reading-settings toggle chips**
  ("Transliteration", "Word transliteration", "Tap a word to hear") — text-
  labelled (not icon-only, so not an iteration-26-style gap), but only
  ~31px tall (`paddingVertical: 6` + text line-height) with no `hitSlop` at
  all. Added `hitSlop={7}` to each (31 + 7 + 7 = 45).

**Not attempting an exhaustive sweep of every icon button in the app** —
`hitSlop` fixes are low-risk (purely additive, no visual change) but the
codebase has dozens of icon-only `Pressable`s with varying `hitSlop`
values; auditing every one precisely would need the same kind of careful,
per-component measurement as these two, not a blind find-and-replace.
Fixed the two clearest, highest-reach instances found this iteration;
future iterations revisiting this catalogue entry on a later cycle should
continue the sweep rather than treating it as fully closed.

**Verification, with an honest gap:** `pnpm --filter @ummahlibrary/mobile
typecheck` clean; `test` 116/116 pass; `pnpm lint` — 0 errors, same 13
pre-existing warnings. Confirmed no regression — the bookmark button still
opens its modal on a normal click, verified live via
`preview_start({name: "mobile"})`. **What I could not reliably verify**:
clicking *just outside* the old 8px boundary but *inside* the new 13px one
to directly prove the expanded hit zone — `hitSlop` in `react-native-web`
isn't reflected in `getBoundingClientRect()` (it's implemented via JS-level
hit-testing, not a DOM size change), and the coordinate space my
measurement script read (`1024`-wide, from `read_page`'s reported viewport)
didn't line up cleanly with the `computer` tool's screenshot-pixel click
coordinates in this session, making a precise boundary-pixel test
unreliable rather than just re-confirming what regular clicks already
show. `hitSlop` itself is a standard, heavily-precedented RN API already
used successfully throughout this exact codebase — the change is a
well-understood, low-risk application of it, not a novel mechanism.

**Commit:** `fix(mobile): widen hitSlop on the per-āyah bookmark toggle and
reader-settings chips to meet the 44dp touch-target minimum`.

---

## Iteration 28 — Noor theme switching consistency across all 8 palettes, every screen, light+dark

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** every hardcoded color literal across `apps/mobile/src`
(bypassing the theme system is the main way a screen can look fine in the
one theme it was built/tested against and break in the other seven), then
live-verified the worst case.

**Found and fixed a real, calculated contrast failure affecting the
majority of themes.** `QiblaScreen.tsx`, `PrayerTimesScreen.tsx`, and
`MosqueFinderScreen.tsx` all hardcode their "Use my location" CTA button's
text as `color: "#fff"`, with the button's background set to `c.accent`
(which varies per theme). `packages/ui/src/themes.ts` already has a
purpose-built token for exactly this — `ink: string; // text colour on top
of the accent/gold surface` — calibrated per theme (dark, near-black `ink`
values for the light/vibrant-accent dark-mode themes; light, near-white
`ink` values for the dark-accent light-mode themes) and already used
correctly elsewhere (e.g. `CollectionsScreen.tsx`'s `emptyBtnText`). These
three files bypassed it.

Computed WCAG contrast ratios for white text against each theme's `accent`
to confirm this wasn't cosmetic nitpicking: **obsidian** (`#e6b855`) ≈
1.8:1, **midnight** (`#f0c868`) ≈ 1.6:1, **emerald** (`#e3b756`) ≈ 1.8:1,
**ocean** (`#45c7bd`) ≈ 2.1:1 — all badly fail even the minimum 3:1
large-text threshold, let alone the 4.5:1 normal-text one (this 15px bold
label doesn't qualify as WCAG "large text"). The four light-mode themes
(ivory/sepia/mint/rose) happen to have dark accents, so white text
accidentally looked fine there — which is exactly how this kind of bug
hides: correct in the themes someone tested, broken in the others. Since
the app defaults to `obsidian` on a dark-mode device, this plausibly
affected the majority of real users, not an edge case.

**Fix:** changed all three to `color: c.ink`.

**Live-verified in the actual worst-case theme**, not just calculated: via
`preview_start({name: "mobile"})`, switched to **Midnight** (the theme
with the lightest accent) in Settings, cleared `ul.prayerCoords` to reach
`QiblaScreen`'s "Use my location" CTA (its initial, coords-less state),
and confirmed the button text now renders dark and clearly legible against
the light-gold background — screenshotted before relying on the
calculation alone.

**Also checked and intentionally left alone**, confirmed correct: `shadowColor: "#000"` in `SurahReaderScreen.tsx` (shadows are conventionally dark
regardless of theme); `GRADE_GOOD`/`LATE` semantic status colors in
`HadithScreen.tsx`/`PrayerTrackerScreen.tsx` (intentionally
theme-independent semantic colors, not surface/text pairings).

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 116/116 pass; `pnpm lint` — 0 errors, same 13 pre-existing warnings.

**Commit:** `fix(mobile): use the theme's ink token instead of hardcoded
white for CTA button text`.

---

## Iteration 29 — Asset loading fallback (icons, interrupted offline audio downloads)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** app icon/image loading (already covered by
[iteration 24](#iteration-24--font-loading-fallback-and-flash-of-unstyled-text)'s
asset-loading audit — nothing new there) and, the perspective's other
named concern, what happens to an offline reciter-audio download that gets
interrupted partway through.

**Found and fixed a real bug in the offline-audio download path.**
[`audio-store.ts`](apps/mobile/src/audio/audio-store.ts)'s `save()` calls
`File.downloadFileAsync(remoteUrl, dest, …)`. Traced the native Android
implementation
(`node_modules/expo-file-system/android/.../FileSystemModule.kt`): it
streams the response body **directly to the final destination path**
(`FileOutputStream(destination).use { input.copyTo(it) }`) — there's no
temp-file-then-atomic-rename, and this version of `expo-file-system`'s
`File` API has **no `move`/`rename` method at all** (checked both the TS
wrapper and native Android/iOS sources), so implementing that pattern
myself isn't cleanly possible with what's installed. A download interrupted
by a network drop or cancellation mid-transfer leaves a **truncated file
sitting at the final path**. `has()`/`localUrl()` only check
`file.exists`, never validity, so:
- a retry's `has()` check would see the corrupt file and **skip
  re-downloading it**, believing it already succeeded;
- `isSurahDownloaded()` would eventually report the surah "complete" once
  the ayah count matches, corrupt file included;
- playback would hand the corrupt file to the audio player and fail, with
  nothing in the UI telling the user *why* — the app still thinks that
  ayah is safely downloaded for offline use.

**Fix:** wrapped the download in try/catch; on failure, delete `dest` if
it exists before re-throwing, so a failed/interrupted download never
leaves a phantom "looks downloaded" file behind, and a retry actually
retries.

**Added a regression test** distinct from the existing "fails cleanly
before writing anything" test (which doesn't exercise this path — its fake
throws *before* any file exists): `audio-store.test.ts` now also covers a
fetch that writes a partial file (`fsState.files.set(dest, 3)`) and *then*
throws, mimicking a connection dropping mid-transfer, and asserts the
partial file is gone afterward.

**Honest residual gap, not fixed:** this only catches failures the JS
runtime can actually observe (network errors, cancellation) — a hard OS-
level process kill mid-write can't be caught by any `try/catch`, so a
corrupt file from *that* specific scenario (or one left over from before
this fix existed) would still be silently trusted by `has()`. Closing that
completely would need either a real atomic-rename primitive (unavailable
in this `expo-file-system` version) or validating file size/integrity on
every `has()` check (a bigger, slower change affecting every read, not
just downloads) — flagging as a known limitation rather than
over-engineering a partial fix for it now.

**Related, out of scope:** `useSurahAudio.ts`'s bulk-download IIFE
(`void (async () => { try {...} finally {...} })()`) has no `.catch()`, so
*any* download failure — pre-existing, not something this iteration
introduced — produces an unhandled promise rejection with zero user-facing
error message. Surfacing a real "download failed" message is a UI addition,
a different scope than this iteration's storage-layer fix; noting it for a
future iteration.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean;
`test` 117/117 pass (116 + 1 new); `pnpm lint` — 0 errors, same 13
pre-existing warnings.

**Commit:** `fix(mobile): clean up a partially-downloaded audio file
instead of leaving it looking saved`.

---

## Iteration 30 — Navigation stack edge cases (deep back stacks, tab switch mid-flow, duplicate pushes)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-03`

**Checked:** whether rapid double/triple-tapping a navigation link
duplicates a screen on the stack, whether switching tabs mid-flow loses a
nested stack's position, and (structurally) whether deep back stacks have
anything app-specific that could break them.

**Clean, on strong structural evidence plus direct live testing.**
`grep -rn "navigation.push(\|nav.push("` across all of `apps/mobile/src`
returns nothing — every navigation call uses `navigate()`, not `push()`,
which is the duplicate-safe default in React Navigation (navigating to a
route already in the stack focuses the existing instance rather than
stacking a second one). Combined with [iteration 8](#iteration-8--android-hardware-back-button-handling-on-every-screenmodal)'s
finding that nothing in this codebase does any custom stack manipulation,
there's no app-specific mechanism that could produce a duplicate push or
corrupt a deep stack — the library's own well-established default handles
all three named scenarios.

**Live-verified via `preview_start({name: "mobile"})`, not just inferred
from the grep:**
- **Duplicate pushes:** triple-clicked the same surah row on `SurahList`
  with no delay between clicks — landed on that surah once, and a single
  tap on the back arrow returned directly to `SurahList` (not to another
  instance of the same surah, which is what a duplicate push would have
  produced).
- **Tab switch mid-flow:** opened `Al-Baqara` in the Read tab, switched to
  the Tools tab, switched back to Read — landed exactly back on
  `Al-Baqara`'s reader, in the same reading mode ("Reading" view, word
  transliteration still on) it was left in, confirming React Navigation's
  per-tab state preservation works correctly here with nothing overriding
  it.

**Commit:** none (clean iteration; no code changes).

## Iteration 31 — Error boundaries / crash resilience against malformed data

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** what happens when a screen throws during render — e.g. from
malformed data that slipped past a store's read-time validation (ADR 0028's
guards run at read time; they don't guarantee every downstream consumer
handles every shape correctly), a null a screen didn't expect, or any other
uncaught render error.

**Found and fixed a real gap: zero error boundary coverage anywhere in the
app.** Grepped the whole tree — no `getDerivedStateFromError`,
`componentDidCatch`, or third-party boundary library anywhere in
`apps/mobile` (and nothing to mirror from `apps/web` either, which has the
same gap but is out of scope here). An uncaught render error in *any*
screen or provider — including ones several layers deep in the provider
stack — unmounts the whole tree, leaving a **permanently blank screen**
with no recovery path short of a manual force-quit and relaunch.

**Fix:** added [`ErrorBoundary.tsx`](apps/mobile/src/ErrorBoundary.tsx), a
class component last-resort crash barrier with a fallback UI ("Something
went wrong" + a "Try again" button that resets the boundary's state) and
wired it into [`App.tsx`](apps/mobile/App.tsx) around the whole provider
tree (`SafeAreaProvider` and everything inside it). Deliberately built with
raw `react-native` primitives and hardcoded colors instead of this app's
own `Type`/theme layer — whatever crashed could in principle be inside
that layer, so the fallback stays independent of everything it exists to
catch failures in.

**Live-verified in the browser preview** (react-native-web faithfully
reproduces React error-boundary behavior — it's a pure React/JS mechanism,
not a native-only one, unlike most perspectives checked in this cycle).
Temporarily added an unconditional `throw` as the first line of
`HomeScreen`'s render to force a real crash, reloaded, and confirmed the
fallback rendered ("Something went wrong" / "Try again") instead of a
blank screen. Tapped "Try again" and confirmed the boundary resets and
re-renders cleanly (it re-throws immediately since the injected throw was
unconditional, so the same fallback correctly reappears rather than
anything crashing the boundary itself). Reverted the temporary throw
before running the test/lint gate — it was never committed.

**Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` clean,
`pnpm --filter @ummahlibrary/mobile test` 117/117 passing, `pnpm lint`
clean (13 pre-existing warnings, 0 errors, none from this change), plus
the live browser-preview crash/recover check above.

**Commit:** `apps/mobile/src/ErrorBoundary.tsx` (new), `apps/mobile/App.tsx`.

## Iteration 32 — Bundle/APK size audit for Play Store

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** what actually ships in the release Android artifact — asset
sizes, dependency bloat, and whether the standard Android release
optimizations (code shrinking, resource shrinking) are switched on.

**Assets are lean and not a concern:** `assets/fonts/` is 332 KB (one
IndoPak Nastaʿlīq `.ttf`; the Latin/Arabic Google Fonts are pulled in as
individual per-weight packages, not full families), icons/splash total
~68 KB. `tz-lookup` (the one non-Expo runtime dependency with an embedded
geo dataset) is 173 KB unpacked — not worth replacing. `eas.json`'s
production profile already builds `app-bundle` (AAB), so Play Store's own
dynamic delivery handles per-ABI/per-density splitting — no APK-side ABI
splitting needed.

**Found and fixed a real gap: release builds ship with R8 code shrinking
and resource shrinking both off.** Read the actual generated
`android/app/build.gradle` (from a fresh `expo prebuild`, not hand-edited —
`android/` is gitignored and regenerated per build) — `minifyEnabled` and
`shrinkResources` are both gated behind gradle properties
(`android.enableMinifyInReleaseBuilds`, `android.enableShrinkResourcesInReleaseBuilds`)
that default to `false` and were never set anywhere in this project: no
`expo-build-properties` plugin, no other way to set an Android gradle
property declaratively for a project that doesn't commit its native
`android/` folder. Every release build/bundle was therefore shipping
completely unminified, unobfuscated, unshrunk Java/Kotlin bytecode and
every resource whether referenced or not — pure avoidable bloat for a
Play Store submission.

**Fix:** installed `expo-build-properties` via `npx expo install` (which
resolves the exact version this SDK 54 project needs — `~1.0.10`, not the
version a naive `npm view` dist-tag search would suggest) and configured it
in [`app.json`](apps/mobile/app.json):
```json
["expo-build-properties", { "android": {
  "enableMinifyInReleaseBuilds": true,
  "enableShrinkResourcesInReleaseBuilds": true
} }]
```
Verified the property-name wiring is actually correct for this project's
installed React Native/Expo template version before trusting it (checked
two different `expo-build-properties` versions' source — an older one
still targets the legacy `android.enableProguardInReleaseBuilds` gradle
key, which this project's generated `build.gradle` no longer reads at
all; only the SDK-54-matched `~1.0.10` writes the current
`android.enableMinifyInReleaseBuilds`/`enableShrinkResourcesInReleaseBuilds`
keys this template actually checks — installing the wrong version would
have silently done nothing).

**Live-verified the fix actually reaches the native build**, the
strongest verification available without a full Android SDK/EAS build in
this environment: ran a real `expo prebuild --platform android --no-install`
and confirmed `android/gradle.properties` now contains
`android.enableMinifyInReleaseBuilds=true` and
`android.enableShrinkResourcesInReleaseBuilds=true`. The default
`proguard-rules.pro` this template ships is the standard Expo/RN one (plus
an inert `reanimated` rule — reanimated isn't a dependency here, harmless);
every installed native module (`async-storage`, `screens`,
`safe-area-context`, `svg`, `notifications`, `secure-store`, etc.) ships its
own consumer ProGuard rules bundled in its AAR, which the Android Gradle
Plugin merges in automatically, so minification is expected to be safe
with no custom keep rules needed — but **actually building and
smoke-testing a real minified release AAB/APK on a device is something
this environment can't do** (no Android SDK, no EAS credentials) and
should happen before the next Play Store upload, not be assumed clean.

**Also noticed** (not fixed — separate, unrelated, pre-existing, and
genuinely out of scope for a size audit): `expo prebuild` warns
`android: userInterfaceStyle: Install expo-system-ui in your project to
enable this feature` — `app.json` sets `"userInterfaceStyle": "dark"` but
the plugin needed to actually enforce that at the native level isn't
installed. Logging this for a future iteration (native-UI-consistency
perspective), not chasing it here.

**Verification:** `pnpm lint` and `pnpm typecheck` clean full-workspace;
`pnpm --filter @ummahlibrary/mobile test` 117/117 passing. Full-workspace
`pnpm test` and `pnpm build` both still fail, but confirmed (via `git
stash` + re-run) on the *pre-existing, unrelated* web/extension duplicate-
React-installs breakage documented in iteration 1 — reproduced identically
with this change stashed out, so it's not something this iteration
introduced or something a mobile-only change could fix.

**Commit:** `apps/mobile/app.json`, `apps/mobile/package.json`,
`pnpm-lock.yaml` (adds `expo-build-properties`).

## Iteration 33 — EAS build config correctness

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** the production EAS build profile, whether declared Android
permissions match what actually ends up in the merged release manifest
(permission minimalism), and whether `ITSAppUsesNonExemptEncryption: false`
is actually accurate given sync's E2EE crypto (ADR 0033).

**`eas.json`'s production profile is correct as-is:** `buildType:
"app-bundle"` (AAB, not APK) — Play Store's own dynamic delivery handles
per-ABI/per-density splitting, so no manual ABI-split config is needed.
`autoIncrement: true` handles versionCode bumps automatically.

**`ITSAppUsesNonExemptEncryption: false` is accurate, verified rather than
assumed.** Read every crypto primitive actually imported by the sync layer
([`noble-cipher.ts`](apps/mobile/src/lib/sync/noble-cipher.ts)): AES-GCM,
HKDF, HMAC, PBKDF2, SHA-256 — all standard, published, non-proprietary
algorithms, used only to protect the user's own synced data
(authentication/data-integrity use), and this isn't a cryptography
product. That's exactly Apple's Category 5 Part 2 exemption criteria, so
`false` (meaning "exempt, no export-compliance paperwork needed") is the
correct declaration, not an oversight.

**Found and fixed a real permission-minimalism gap.** Ran a real `expo
prebuild` and read the actual merged `AndroidManifest.xml` (not just
`app.json`'s permissions list, which only covers permissions the app
explicitly asks for — plenty more get merged in silently from the base
RN/Expo template and autolinked native modules). Found
`android.permission.SYSTEM_ALERT_WINDOW` ("draw over other apps") in the
release manifest — not declared anywhere in this app's own `app.json`,
coming from the base Expo/RN template's dev-tooling default, and with
**zero legitimate use** in a Quran/prayer-times app with no overlay/bubble
UI anywhere. This is one of Android's "special access" permissions Google
Play's Permissions Declaration form scrutinizes specifically, so shipping
it unused is pure unnecessary review-friction and attack surface.

**Fix:** added it to `app.json`'s existing `android.blockedPermissions`
array — same mechanism already proven in this file for stripping
`RECORD_AUDIO`. Live-verified via a fresh `expo prebuild` that the merged
manifest now marks it `tools:node="remove"`, identical to the existing
`RECORD_AUDIO` entry.

**Also checked but left alone:** `READ_EXTERNAL_STORAGE` /
`WRITE_EXTERNAL_STORAGE` also appear in the merged manifest, most likely
from `expo-document-picker`/`expo-sharing` (used by
[`backup.ts`](apps/mobile/src/backup.ts) for JSON backup import/export).
Didn't touch these: removing them risks breaking a real, working feature,
and on this project's targetSdkVersion (Android scoped storage applies),
they're effectively inert at runtime anyway — the OS doesn't grant broad
external-storage access to apps targeting a modern SDK regardless of this
manifest entry. Flagging for a closer look in a future "permissions
justification" pass (perspective B35) rather than guessing here.

**Verification:** `pnpm lint` and `pnpm typecheck` clean full-workspace,
`pnpm --filter @ummahlibrary/mobile test` 117/117 passing, plus the live
`expo prebuild` manifest check above.

**Commit:** `apps/mobile/app.json`.

## Iteration 34 — Play Store data-safety/permissions-justification accuracy

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** whether an accurate Play Console Data Safety disclosure is
even possible right now — what data the app actually collects, stores,
and (critically) transmits off-device, cross-referenced against the
codebase's actual behavior rather than assumed from ADR prose.

**No privacy policy exists anywhere in this repo.** Play Console requires
a hosted privacy policy URL for every app, unconditionally, and this app
additionally requests location permissions (`ACCESS_FINE_LOCATION`/
`ACCESS_COARSE_LOCATION` for Qibla/prayer times/mosque finder) which Play
Store scrutinizes specifically in the Data Safety flow. **This blocks
actual Play Store submission** — not a code bug, out of scope for this
loop to write (a privacy policy is a legal document requiring the
project owner's sign-off, and I'm not fabricating store-listing content
per this loop's guardrails), but flagging it clearly now rather than
letting it surface as a surprise at submission time.

**Found and fixed a real, separate bug while verifying the data
inventory: a misleading, stale doc-comment in the shared sync contract.**
[`packages/core/src/sync-keys.ts`](packages/core/src/sync-keys.ts)'s
comment block listed `ul.qada`/`ul.haid` (the qaḍāʾ and **ḥayḍ/menstrual
cycle log**) as "deliberately EXCLUDED" from sync. Reading the actual
`MANAGED_KEYS` array below the comment shows they're **not** excluded —
they're both present, added under ADR 0034's Phase 1 element-merge work,
and the comment was simply never updated afterward. This isn't cosmetic:
anyone (developer or compliance reviewer) auditing "does sync ever touch
menstrual-cycle data" to fill out a Data Safety form would read the
comment, trust it, and answer **wrong**. Confirmed the actual behavior:
when a user opts into cross-device sync (off by default, ADR 0033),
`ul.haid` and `ul.qada` entries **do** get transmitted off-device as
AES-256-GCM ciphertext to the sync backend — the server can't read them
or even tell which key they belong to (entry ids are
`HMAC(dataKey, keyName)`), but the data still **leaves the device**, which
is what Google's Data Safety disclosure asks about, independent of
encryption. Fixed the comment to state this accurately and added an
explicit note for future auditors.

**Data inventory for whoever fills out the real Data Safety form** (not
committed as a store-listing artifact, just documented here since I
verified it against the actual code rather than assumed it):
- **Sync is opt-in and off by default.** An install that never enables it
  transmits nothing anywhere except the existing prayer-times/mosque-search
  API calls (location coordinates sent to compute times/find nearby
  mosques — already covered by the existing `expo-location` permission
  rationale string).
- **If sync is enabled:** every `MANAGED_KEYS` entry
  ([`sync-keys.ts`](packages/core/src/sync-keys.ts)) syncs as E2EE
  ciphertext to the sync backend (Upstash Redis via `/api/sync`, per ADR
  0033). This includes bookmarks, reading/reciter/theme preferences, last-read
  position, prayer-calculation settings (and the **coordinates** used for
  them), ayah notes, collections, `asmaLearned`, badges, reading log,
  **prayer log, ramadan worship log, qaḍāʾ log, ḥayḍ log**, and hifz
  progress. Google Play's Data Safety form has a dedicated, more heavily
  scrutinized **Health and fitness → menstrual cycle** data-type category
  distinct from general "app activity" — `ul.haid` syncing means that
  category applies and needs its own accurate answer (collected: yes,
  shared: no, encrypted in transit: yes, user can request deletion: yes —
  the recovery-phrase teardown in `SyncSettings` deletes the account
  server-side).
- **No analytics, crash reporting, or ad SDKs anywhere** — confirmed by
  reading `package.json`: no Sentry/Firebase/Amplitude/etc. This is a
  genuinely strong, easy-to-state position for the Data Safety form's
  "no data shared with third parties" sections.
- **No identifiers, ever.** `accountId` (a bearer capability derived from
  the recovery phrase, ADR 0033 §1) names a ciphertext blob, not a person
  — there's no email, no login, no device ID sent anywhere.

**Verification:** `pnpm lint` and `pnpm typecheck` clean full-workspace,
`pnpm --filter @ummahlibrary/core test` 508/508 passing,
`pnpm --filter @ummahlibrary/mobile test` 117/117 passing.

**Commit:** `packages/core/src/sync-keys.ts` (comment fix only, no
behavior change).

## Iteration 35 — Correcting iteration 34, then fixing what it missed

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Correction to iteration 34: I was wrong that no privacy policy exists.**
Iteration 34's search only grepped top-level filenames for `*privacy*` and
missed `apps/mobile/src/screens/PrivacyScreen.tsx` and the shared
[`packages/core/src/privacy.ts`](packages/core/src/privacy.ts) it renders
from — the same content that also backs a real static `apps/web/src/app/privacy`
page, so once the web app is deployed there **is** a hostable privacy-policy
URL for Play Console. Logging this correction here per the QA log's
append-only rule (iteration 34's entry stands as originally written, in
context, rather than being silently edited) — the record needed a fix, so
here it is.

**I was also wrong, in that same iteration, that "the recovery-phrase
teardown in SyncSettings deletes the account server-side."** That was an
unverified assumption. Checked the actual code this time: `disableSync()`
(implemented identically on
[web](apps/web/src/lib/sync/sync-settings.ts),
[mobile](apps/mobile/src/lib/sync/sync-settings.ts), and the extension)
only forgets the secret **on the local device** — no network call, no
delete request. Checked the server side too:
[`apps/web/src/app/api/sync/route.ts`](apps/web/src/app/api/sync/route.ts)
implements `POST`/`OPTIONS` only, no `DELETE`, and
[`sync-store.ts`](apps/web/src/app/api/sync/sync-store.ts) sets no TTL on
stored entries. **There is genuinely no way — no UI, no API route — for a
user to get their synced ciphertext removed from the server.** It sits
there indefinitely under the anonymous `accountId`, unreadable but
undeletable.

**With that corrected understanding, fixed the actual gap the perspective
was after: the privacy policy's own text was stale relative to the sync
feature it never mentioned.** `PRIVACY_UPDATED` was "16 June 2026" — a
week *before* ADR 0033 (sync) was even accepted (2026-06-23) — and the
"Your data stays on your device" section flatly claimed "that data is
never sent to us and we cannot see it," which stopped being true the
moment sync shipped as an opt-in feature. Added a new "Cross-device sync
(optional)" section to
[`packages/core/src/privacy.ts`](packages/core/src/privacy.ts) (shared by
web and mobile, so both platforms' policy pages update from one place)
describing what actually happens: E2EE, the recovery phrase, what
`MANAGED_KEYS` can sync (explicitly naming the qaḍāʾ/ḥayḍ logs, matching
what iteration 34 verified), and — accurately, not overpromising a
support process that doesn't exist in code — that disabling sync doesn't
currently delete server-side data. Softened the earlier section's
"never sent to us" claim to "by default" with a pointer to the new
section, so the two don't flatly contradict each other.

**Live-verified** via the browser preview: navigated to the mobile
`Privacy` screen and confirmed the new section renders correctly —
bold emphasis, bullet list, and the updated date all correct — using the
exact same shared content the web `/privacy` page will render.

**Logged, not fixed (architectural, out of scope for this loop — needs
the project owner's decision):** the missing account-deletion capability
found above. Building it means a new authenticated `DELETE` (or similar)
`/api/sync` capability, a new `SyncBackend` port method, and UI on all
three platforms to trigger it — a real new capability surface that
deserves its own ADR per `AGENTS.md` rule 6, not something to bolt on
inside a QA-loop iteration. Options for the owner: build real deletion,
or document/commit to a manual support-request process and reflect that
honestly in the policy instead of silence. Left the policy's current
wording accurate to what exists today rather than promising either.

**Verification:** `pnpm lint` and `pnpm typecheck` clean full-workspace,
`pnpm --filter @ummahlibrary/core test` 508/508,
`pnpm --filter @ummahlibrary/mobile test` 117/117, plus the live
browser-preview render check above.

**Commit:** `packages/core/src/privacy.ts`.

## Iteration 36 — Empty and loading states on every screen

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** every screen that fetches data or holds a possibly-empty
collection, for three states: the loading flash (slow network), the
error/offline state (failed network), and the zero-data empty state
(first run or a cleared collection).

**Clean — traced every data-touching screen individually rather than
spot-checking, and this app is genuinely well-built here.** Grepped for
every screen calling `api.*` with no `ActivityIndicator` anywhere in the
file (a cheap first pass to catch an obvious blank-flash bug) — only
`HomeScreen` and `RamadanScreen` matched, and both are legitimate: they
treat their network data as progressive enhancement over an already-useful
screen (`HomeScreen`'s "Continue reading" card simply omits itself with no
last-read surah; `RamadanScreen` shows "Loading today's times…" text and a
"Set location" CTA instead of a spinner, which reads better for a
countdown widget than a bare spinner would).

Then read the full source of every screen most likely to have a gap:
- **`SurahListScreen`** (the very first screen a new install's user sees,
  before any network round-trip completes): spinner while loading, a
  proper error row with a **"Try again" retry button** on failure, and an
  empty state for a no-match search — the most first-run-critical screen
  in the app is fully covered, including offline recovery.
- **`CollectionsScreen`**, **`PlansScreen`**: real, designed empty states
  (icon + heading + body copy + a CTA), not just a blank list.
- **`SearchScreen`**: "Nothing found" for zero results.
- **`HadithScreen`**: traced end-to-end through the REST layer — a
  past-the-end/unknown section correctly 404s server-side
  ([`route.ts`](apps/web/src/app/api/v1/hadith/[collection]/sections/[section]/route.ts))
  and the client's retry-aware `getJson` throws on a non-2xx response, so
  it surfaces as the screen's existing error state ("You may have reached
  the end of the collection"), not a silent blank screen — traced this
  fully rather than assuming, since a `null`-returning repository method
  feeding straight into `data?.hadiths.map()` looked at first glance like
  it could render nothing with zero feedback.
- **`TafsirScreen`**: all three states present, including
  `FlatList`'s `ListEmptyComponent` for a surah with no tafsir in the
  selected edition.
- **`MosqueFinderScreen`**, **`AdhkarScreen`**, **`DuasScreen`**,
  **`NamesScreen`**, **`DownloadsScreen`**, **`MushafPageScreen`**,
  **`JuzReaderScreen`**, **`SurahReaderScreen`**: all have the relevant
  loading indicator and/or empty-state message for their data shape.

No fix needed this iteration — a genuinely clean perspective after
verifying it properly, not skimming it.

**Verification:** read-only iteration, no code changed; full test/lint
gate from iteration 35 still holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 37 — Copy/microcopy consistency and correctness vs web

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** shared-feature copy between mobile and web for wording
drift — Zakat, mosque finder, prayer times, Qibla, location-permission
messaging, and the previously-fixed "āyahāt"/"āyāt" typo (regression
check, still clean).

**Mostly consistent, with good platform-appropriate adaptation where it
should differ.** "Location permission was denied" messaging matches
verbatim across `MosqueFinderScreen`, `PrayerTimesScreen`, `QiblaScreen`
and their web equivalents, correctly adapted for the platform ("Enable it
in **Settings**" on mobile vs "Enable it in **your browser**" on web) —
that's the right kind of difference, not a bug. Zakat's "Reset amounts"
copy and behavior match exactly (same shared comment in both files).

**Found and fixed one small, real wording drift.**
`MosqueFinderScreen`'s generic network-error message read "Couldn't load
nearby mosques. Check your connection." — missing web's trailing "**and
retry**" (`MosqueFinder.tsx`: "Check your connection and retry."). Synced
the wording.

**Noted, not fixed (a capability gap, not a copy bug — out of scope for
this perspective):** web's `MosqueFinder` has a distinct `"offline"`
status with its own message ("You're offline. Mosque search needs an
internet connection...") detected via a browser-only API
(`navigator.onLine`); mobile has no equivalent (`@react-native-community/netinfo`
isn't installed) and collapses every network failure into the generic
`"error"` state. The existing message already says "check your
connection," which substantially covers the same need, so this isn't
urgent — but building real offline detection would mean adding a new
native dependency, which is a feature addition, not a text fix. Logging
for a future iteration if it's judged worth the dependency.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 117/117.

**Commit:** `apps/mobile/src/screens/MosqueFinderScreen.tsx`.

## Iteration 38 — Push notification content correctness

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** the actual title/body text of every reminder type (prayer,
adhkar, reading plan, Sunnah fast, Islamic event) for correctness,
consistency, and truncation risk.

**Clean.** All five reminder families build their content in one shared,
platform-neutral module —
[`packages/core/src/reminders.ts`](packages/core/src/reminders.ts) (plus
[`planReminderContent`](packages/core/src/reading-plans.ts) for the plan
reminder's progress-aware copy) — so web and mobile schedule byte-identical
notification text; there's no mobile-only copy to drift from web's.

- **Prayer:** `${PRAYER_LABELS[prayer]} — time to pray`, correct label per
  prayer.
- **Adhkar:** `Time for ${morning|evening} adhkar` with the matching
  emoji, correctly keyed per occasion.
- **Reading plan:** three distinct, well-designed states (today's portion
  done, behind schedule, still due) with correct singular/plural handling
  via `unitWord()` (checked the switch: `page`/`sūrah`/`ayah` pluralize in
  English correctly; `juzʾ`/`ḥizb` are invariant transliterations, which
  is linguistically correct — they don't take an English "-s").
- **Sunnah fast / Islamic event:** both include the specific fast/event
  name, not a generic placeholder.
- **Truncation risk:** checked every bundled plan template's `name` (the
  only unbounded-length input feeding a title) — all six are short
  (≤20 chars; plans aren't user-authored per AGENTS.md, so there's no
  arbitrary-length user input here at all).

All four non-plan reminder types already have direct content assertions
in [`reminders.test.ts`](packages/core/src/reminders.test.ts) (exact
title/body string checks, not just scheduling-logic checks), and the plan
reminder's three states are covered in
[`reading-plans.test.ts`](packages/core/src/reading-plans.test.ts) — this
perspective already had real regression protection before this iteration,
not just correct-by-luck code.

No fix needed.

**Verification:** read-only iteration, no code changed; prior gate holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 39 — Mosque finder live-location accuracy and permission-denied fallback

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** the distance/sorting math, location-permission-denied
recovery flow, and how a backend/network failure is actually represented
to the user (does "no results" always mean "genuinely no results"?).

**Distance math and permission fallback are solid.**
`distanceKm`/`sortByDistance` use a correct, tested Haversine
implementation shared with web (11 existing tests). `Location.Accuracy.Low`
is used consistently across `MosqueFinderScreen`, `PrayerTimesScreen`, and
`QiblaScreen` — a deliberate, uniform tradeoff (network-location accuracy
is entirely adequate at km-scale radii; no reason to burn battery/prompt
for GPS precision here). The permission-denied state already has both
"Try again" and "Open Settings" — correctly anticipates Android's silent
re-denial after "Don't ask again" (a repeat `requestForegroundPermissionsAsync()`
call there returns denied with no dialog at all, so a settings deep-link
is the only real recovery path — already present).

**Found a real accuracy concern, deliberately not code-fixed — it's a
tested, intentional tradeoff, not an oversight.** Traced the request path
end to end:
[`OverpassPlacesProvider.nearbyMosques`](packages/adapters/src/places.ts)
has `if (!res.ok) return [];` — a non-OK Overpass response (rate-limited,
timeout, 5xx) is indistinguishable from a genuine "no mosques here."
Confirmed via [`places.test.ts`](packages/adapters/src/places.test.ts)
line 107 — `"degrades to [] on a non-OK response rather than throwing"`,
fixtured explicitly with `{ error: "rate limited" }` — this was a
**deliberate, tested design choice**, not a bug slipping through. The
same shape exists in
[`hadith.ts`](packages/adapters/src/hadith.ts)`.getSection` (`if
(!response.ok) return null`, surfacing as "you may have reached the end
of the collection" even on a transient CDN blip) and
[`translation-catalog.ts`](packages/adapters/src/translation-catalog.ts).
Not reversing this pattern — I don't have the operational context that
motivated it (Overpass's public instance is known to rate-limit
aggressively under load; the original author may have deliberately traded
"never show a scary error for a routine Overpass hiccup" against "a false
'no mosques' is occasionally misleading"), and the loop's own guardrails
are to fix bugs, not override a tested, intentional decision without that
context. Flagging for the project owner to weigh: for mosque-finder
specifically, a false "no mosques within 20km" is a stronger claim than
"no tafsir available," since a Muslim relying on it to find the nearest
place to pray could plausibly stop looking on wrong information.

**Fix made in the one place this doesn't require touching that policy:**
the "No mosques found" branch had **no retry affordance at all** — unlike
every other terminal state on this screen (`denied`, `error` both have a
"Try again" chip). Added a "Search again" button there too. This doesn't
resolve the ambiguity above, but it does mean a user who suspects the
result might be wrong (or who just wants to double-check) now has a
one-tap way to re-query, whether the original result was a real empty set
or a transient Overpass hiccup — strictly additive, no change to the
degrade-to-empty policy itself.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 117/117.
Live-verification of the specific empty-results branch wasn't practical
in the browser preview (it requires either a genuinely mosque-free
coordinate or mocking Overpass's live response, and stale navigation refs
in the RN-web preview made reaching the screen unreliable this session) —
noting the gap honestly rather than claiming a screenshot check that
didn't happen. The change itself mirrors the file's own existing,
already-verified `denied`/`error` retry-chip pattern exactly.

**Commit:** `apps/mobile/src/screens/MosqueFinderScreen.tsx`.

## Iteration 40 — Test coverage audit (closes out batch 4)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-04`

**Checked:** which `apps/mobile/src` modules have no matching `.test.ts`
file, then judged each one on whether that's a real gap or just a
correctly-thin file whose logic is actually tested elsewhere.

**Most "untested" files are false positives, verified rather than
assumed.** A dozen store files (`qada-store.ts`, `haid-store.ts`,
`tasbih-store.ts`, `plan-store.ts`, etc.) have no dedicated test file, but
each is a 3-line `read`/`write` pass-through to the shared `getJSON`/
`setJSON` primitives (ADR 0024 port pattern — persistence only, the real
logic lives in `@ummahlibrary/core`), and
[`stores-corrupt.test.ts`](apps/mobile/src/stores-corrupt.test.ts)
already exercises every one of them for the corrupt-value path. A
dedicated test per store would just re-test `getJSON` under a different
key name — no real coverage gained.

**Found and fixed the actual gap: the shared primitive underneath every
one of those stores had zero direct test file.**
[`storage.ts`](apps/mobile/src/storage.ts) — `getJSON`/`setJSON`/
`getString`/`setString` plus four validator predicates
(`isObjectRecord`/`isFiniteNumber`/`isStringArray`/`isBoolean`) used
throughout the app to guard every read — had never been tested directly.
`stores-corrupt.test.ts` only exercises the "wrong shape" branch through
each store's specific key; it never covers **malformed JSON**
(`JSON.parse` throwing), **a throwing `AsyncStorage.setItem`** (device
storage full — `setJSON`/`setString` are supposed to swallow this
silently rather than crash a caller, per the `try/catch` in the source,
but nothing asserted that), or the validator predicates' own edge cases
(`NaN`/`Infinity` for `isFiniteNumber`, a mixed-type array for
`isStringArray`, `null`/array for `isObjectRecord`).

**Added** [`storage.test.ts`](apps/mobile/src/storage.test.ts) (14 new
tests, same in-memory `AsyncStorage` mock pattern as
`stores-corrupt.test.ts`): `getJSON`'s three fallback paths (missing key,
malformed JSON, validator rejection) plus its two success paths,
`setJSON`/`setString` actually swallowing a write failure (asserted, not
assumed), `getString`/`setString` round-tripping, and every validator's
accept/reject boundary.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` — 131/131
passing (117 prior + 14 new).

**Commit:** `apps/mobile/src/storage.test.ts` (new).

---

## Batch 4 summary (iterations 31–40, branch `mobile-stabilization-04`)

Ten iterations, seven with real fixes, three clean-but-thoroughly-verified:

- **31:** added the app's first-ever error boundary — a render crash
  anywhere used to blank the whole app with no recovery.
- **32:** Android release builds had R8 minification and resource
  shrinking both off; enabled via `expo-build-properties`.
- **33:** stripped an unused, Play-Store-scrutinized `SYSTEM_ALERT_WINDOW`
  permission from the release manifest.
- **34–35:** a genuine correction loop — iteration 34's claims about the
  privacy policy were wrong (caught and fixed in 35), and along the way
  found the privacy policy itself was stale relative to the shipped sync
  feature (fixed) and that there's no server-side sync-data deletion
  capability anywhere (logged for the owner, not built — architectural).
- **36:** empty/loading states audited clean across every data-fetching
  screen.
- **37:** synced one wording drift between mobile and web.
- **38:** push notification content audited clean (shared, tested code).
- **39:** mosque-finder distance math and permission fallback confirmed
  solid; found (and deliberately did not reverse) a tested tradeoff where
  a degraded Overpass response reads as "no mosques found," and added a
  retry affordance either way.
- **40:** closed a real test-coverage gap in the shared storage primitive
  every store in the app depends on.

Full detail for each is above, under its own `## Iteration N` heading.

---

# Cycle 2 — deepening pass

Iteration 41 begins a second full pass through the perspective catalogue.
Per the loop's own protocol, cycle 2 goes deeper on each perspective
rather than re-skimming: stress-testing fixes made quickly the first time,
adding tests that were skipped, and (in the final ~10-15 iterations)
starting a Play Store readiness pass.

## Iteration 41 — A1 revisited: prayer-time timezone-of-location, deepened

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 1 confirmed `fmtPrayerTime`/`timeZoneFor` correctly
render prayer times in the *location's* timezone rather than the device's
(web's bug #1), and removed a dangerous unused duplicate. This pass
re-examined whether that fix is actually as robust as it looked, rather
than re-confirming the same single test case still passes.

**Confirmed DST correctness is structural, not incidental.**
`fmtPrayerTime` never does manual local-time arithmetic — it holds a
`Date` (always an absolute UTC instant) and only ever formats it via
`toLocaleTimeString({ timeZone })`, delegating all DST-transition logic to
the JS engine's ICU implementation. There's no code path where this app
could get DST wrong, because it never computes wall-clock time itself.

**Confirmed the `coords === null` device-timezone fallback is intentional,
not a footgun.** `timeZoneFor` returns `undefined` when there's no saved
location, which `fmtPrayerTime` correctly treats as "omit `timeZone`,
let `toLocaleTimeString` use the device's own zone" — the only sane
behavior when there's no location to derive a zone from, and already
documented as deliberate in the source.

**Found a real, if narrow, test-coverage gap.** The existing test suite
only exercised one coordinate (London) and one date, so a distinct code
path — `tz-lookup`'s geographic resolution for a **Southern Hemisphere,
DST-observing** location, and a **half-hour UTC-offset** timezone (both
meaningfully different from a single Northern-Hemisphere, whole-hour-offset
test case) — had never actually been exercised. Added two tests to
[`utils.test.ts`](apps/mobile/src/utils.test.ts): Sydney (opposite-season
DST) and Mumbai (UTC+5:30) — both pass, confirming the implementation
already handled these correctly; the gap was in coverage, not behavior.

**Noted, not actionable:** all screens use `Location.Accuracy.Low`
(network-based location, error up to a few km) — near a timezone border,
this could in principle resolve the wrong IANA zone. This is an inherent
tradeoff of the accuracy level already deliberately chosen consistently
app-wide (checked in iteration 39), not a bug to fix here, and web has the
same fundamental limitation with any location-derived timezone.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` — 133/133
passing (131 prior + 2 new).

**Commit:** `apps/mobile/src/utils.test.ts`.

## Iteration 42 — A2 revisited: extending Zakat's sanitization check app-wide

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 2 confirmed Zakat's own fields are sanitized
correctly; the catalogue item also asks to "extend the same class of
check to every other numeric input" app-wide, which iteration 2 didn't
do. This pass did that sweep.

**Exhaustive result: Zakat's four fields are the *only* free-text numeric
inputs in the entire mobile app.** Grepped every `TextInput` in
`apps/mobile/src/screens` and `components` (8 files) — every other
free-text field is non-numeric (search queries, collection/note names, a
recovery phrase). Every other numeric *value* in the app (qada counts,
tasbih, prayer tracker, reading-goal pages) is entered via steppers or
toggles, never free text — a design choice that structurally avoids this
whole bug class rather than needing a sanitizer to catch it after the
fact. This wasn't obviously true going in; confirming it required
actually finding and reading every `TextInput` site, not assuming.

**Investigated a plausible-sounding concern, then ruled it out with
evidence rather than assuming either way.** `sanitizeDecimal` only keeps
`[0-9.]`, silently dropping a comma — a real problem in a comma-decimal
locale (many European/Middle Eastern locales use "," not "." for
decimals), which would silently turn "75,5" into "755", a wrong Zakat
figure. Checked: (1) mobile's implementation is byte-identical to web's
`sanitizeAmount` — not a mobile-specific gap, so there's no web fix to
mirror; (2) more importantly, all four fields use
`keyboardType="decimal-pad"`, and both iOS's and Android's native
decimal-pad keyboards only offer digits and "." regardless of device
locale — a user literally cannot type a comma through this app's own UI
on mobile. The theoretical concern doesn't apply here; no fix needed, and
none manufactured.

**Verification:** read-only iteration (no code changed beyond
confirming); prior gate (133/133 mobile tests) holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 43 — A3 revisited: tasbih counter, rapid-tap race deepened

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 3 confirmed switching the dhikr chip can't clobber
another phrase's count. This pass checked the other realistic failure
mode for a *tap counter specifically* — rapid, repeated taps in quick
succession (the dial's actual primary usage pattern) racing on a stale
closure and silently dropping increments.

**Already correctly handled, and well.** `TasbihScreen.tsx`'s `tap()`
uses the React functional-`setState` form
(`setState(prev => ...)`), computing each increment from `prev`, not
from a closed-over `progress` value — the source comment even names this
exact failure mode as the reason. React guarantees queued functional
updaters for one state setter apply sequentially against each other's
output, so N taps queued before a re-render each land correctly instead
of all applying "+1" against the same stale total (the bug this pattern
specifically avoids). The `store.write(next)` persistence call is issued
from inside that same updater with the already-correct, monotonically
increasing `next` value, in dispatch order — not a separate effect that
could re-read stale state.

Also checked: switching chips mid-"lap" (right after a phrase hits its
target and visually wraps to 0) can't leave a stale "just completed"
flash on the new phrase, since `justLapped`/`progress`/`view` are all
derived fresh from `state` every render, not cached in separate local
state.

No fix needed — this was already exemplary, not merely adequate.

**Verification:** read-only iteration; prior gate holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 44 — A4 revisited: closing the sync-reload race deferred in iteration 22

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 4 confirmed the qaḍāʾ stepper itself can't lose a
rapid tap; iteration 22 (sync edge cases) then found and deliberately
**deferred** a related race — `PrayerTrackerScreen`'s `load()`, triggered
on every `onSyncApplied` event, does a plain `store.read().then(setState)`
for four stores (qada/prayer log/ḥayḍ/fasting), racing an in-flight local
write. If a sync event's reload resolves *after* a local tap has already
updated state but the read itself started *before* that tap, the reload
silently reverts the tap. Iteration 22 didn't fix it because verifying a
fix seemed to need real multi-device sync timing this environment can't
reliably simulate.

**Revisited that call and found it was overcautious — the race is pure
async sequencing, reproducible deterministically without any real
network or multi-device timing at all.** The failure mode only depends on
the *order two promises resolve in*, which a unit test can control
precisely by driving the sequencing directly — no live sync required.

**Fix:** added a generation-counter guard. Every local write
(`adjustQadaFor`, `toggleHaid`, `adjustFasting`, `cycleDate`) bumps a
`writeGen` ref; `load()`'s four reads each capture the generation they
were dispatched at and discard their result if a newer local write has
landed by the time they resolve, instead of overwriting fresher state
with a stale reload. Extracted the guard itself as a small, pure,
directly-testable helper —
[`ignoreStale`](apps/mobile/src/utils.ts) — rather than leaving it
inline, matching this codebase's existing convention of pulling
reusable pure logic into `utils.ts` (this project has no
component-rendering test infrastructure at all, so a pure extraction was
the only way to get real, precise coverage of the exact mechanism without
introducing a new, precedent-setting test harness for one fix).

**Added three tests** to
[`utils.test.ts`](apps/mobile/src/utils.test.ts): the normal case
(no race, value applies), the exact race iteration 22 described (a local
write lands between an async call's dispatch and resolution — the stale
result is discarded), and confirmation that a *later* reload dispatched
after the write still applies normally (the guard doesn't get stuck
rejecting everything after one write).

**Verification:** `pnpm lint` clean (after fixing one `prefer-const`
catch on a first draft), `pnpm --filter @ummahlibrary/mobile typecheck`
clean, `pnpm --filter @ummahlibrary/mobile test` — 136/136 passing (133
prior + 3 new), including the precise race scenario. Attempted a live
click-through of `PrayerTrackerScreen` in the browser preview to sanity-
check the common (non-racing) tap/reload paths still behave normally;
the preview session's navigation state was unreliable this run (stale
element references, one stale-bundle false alarm from tab reuse resolved
by a hard reload) and I couldn't complete it cleanly within reasonable
effort — noting this honestly rather than claiming a click-through that
didn't actually finish. The deterministic unit tests are the real
verification for this fix; they exercise the exact mechanism precisely,
which a live click couldn't do anyway (reproducing millisecond-scale
promise-ordering by hand isn't practical either way).

**Commit:** `apps/mobile/src/screens/PrayerTrackerScreen.tsx`,
`apps/mobile/src/utils.ts`, `apps/mobile/src/utils.test.ts`.

## Iteration 45 — A5 revisited: Hifz pluralization, checked beyond the one string

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 5 confirmed the specific "āyahāt" typo doesn't
exist on mobile. This pass re-confirmed that (re-grepped both ternaries —
still correctly `count === 1 ? "āyah" : "āyāt"`) and checked whether the
*class* of bug (a singular/plural mismatch in a counted-noun string) shows
up anywhere else in the same two screens that the original narrow grep
wouldn't have caught.

**Clean.** Every counted-noun string in `HifzDashboardScreen.tsx` and
`HifzReviewScreen.tsx` pluralizes correctly, including one the original
check didn't specifically look at: `Longest streak: {n} day{n === 1 ? ""
: "s"}`.

**Deliberately not adding a test here**, unlike iteration 44's extraction:
this is a trivial inline ternary, not logic worth pulling into a shared
helper just to make it unit-testable — this codebase has no
component-rendering test harness, and manufacturing an abstraction whose
only purpose is to dodge that gap would be exactly the kind of premature
engineering this project's own conventions warn against. A repo-wide
grep for the wrong string (already exhaustive, already run twice now) is
the proportionate check for a static string literal.

**Commit:** none (clean iteration; no code changes).

## Iteration 46 — A6 revisited: khatm completion, the undo/reset paths deepened

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 6 confirmed the 604/604 completion card itself
renders correctly (unlike web's still-open equivalent bug). This pass
checked the two interactions that card exposes — the "−1" undo and "Start
a new khatm" — for the two failure classes already found elsewhere this
cycle: an unrelated-field wipe (Zakat's "Reset amounts" bug) and a
stepper race (Qada/tasbih).

**Clean on all three checks.**
- **Overshoot safety:** `adjustKhatma`'s `Math.min(totalPages, ...)` clamp
  means the app's own +1/−1 controls can never push `currentPage` past
  `totalPages` — but the completion check itself is `>=`, not `===`, so
  even a hypothetical overshoot (e.g. corrupted/merged sync data) would
  still correctly read as "complete" rather than rendering broken.
- **No unrelated-field wipe:** `clearKhatmaAndRefresh` (`"Start a new
  khatm"`) does `{ ...prev, khatma: null }` — only the khatm itself.
  `goal`, `log`, and `pagesToday` (the daily-goal streak and reading
  history) are untouched, confirmed by reading the full state shape —
  this screen doesn't have Zakat's bug.
- **Race safety:** `adjustKhatma` already uses the functional-`setState`-
  with-write-inside-updater pattern (the source comment names it as
  mirroring the Qada-tracker fix directly) — the same class of fix
  iteration 44 had to *add* to `PrayerTrackerScreen` was already present
  here from the start.
- **Undo correctness:** tapping "−1" from the complete state decrements
  `currentPage` below `totalPages`, which flips the `>=` check and
  correctly falls through to the normal mid-progress view — not a dead
  end.

No fix needed.

**Verification:** read-only iteration; prior gate holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 47 — A7/A8 revisited: Zakat reset scope and negative-amount defense in depth

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 7 cross-referenced iteration 2's live-verified
findings without new investigation. This pass actually went further:
confirmed `reset()`'s exact field scope by reading the source
(`assets`/`liabilities` only — matches the documented intent exactly),
then asked a question iteration 2 didn't: negative amounts can't be
*typed*, because `sanitizeDecimal` runs on every keystroke — but is that
the *only* place this is defended, or does the actual Zakat math have its
own protection if a negative value reached the stored state some other
way (synced from another device, hand-edited storage, a future bug)?

**Found real defense-in-depth already in place at the calculation
layer, confirmed by reading `packages/core/src/zakat.ts`, not
assumed.** `calculateZakat`'s `liabilities` input is clamped
(`> 0 ? input.liabilities : 0`), and `sumValues` (which totals the asset
categories) filters `v > 0` per entry — a negative asset value is
silently excluded from the total, not subtracted. **The actual zakat
figure can't be corrupted by a negative value reaching storage through a
path other than this screen's own keystroke sanitizer** — core defends
the math independent of any one UI.

**Found and fixed a real, if narrower, display-layer gap.** The
load-time hydration (`useEffect` reading `ul.zakat`) only self-healed
`currency` (an existing, already-documented fix for a past bug) —
`goldPricePerGram`, `silverPricePerGram`, `liabilities`, and each asset
value were loaded **raw**, with no equivalent self-heal. The maths was
always safe (per the above), but the **displayed field** could show a
value the app's own UI would never let a user type — a raw `"-50"`
sitting in the Liabilities box, for instance, until the user next edited
it. Extended the same self-heal pattern from `currency` to every decimal
field.

**Live-verified the fix**, not just the reasoning: wrote a corrupted
state directly into storage (`{ goldPricePerGram: "-75.5.2abc", assets:
{ cash: "-500", gold: "100" }, liabilities: "-50" }`, simulating exactly
what a stray sync/corruption path could produce), reloaded, and read
every input's actual DOM `value` (not `read_page`'s placeholder-based
name, per the ground-truth lesson from iteration 2). Every field
self-healed to precisely what typing the same raw text would have
produced: gold price `"75.52"`, cash `"500"`, liabilities `"50"` — and
the displayed totals (`Total assets $600.00`, `Net wealth $550.00`)
matched, confirming the healed values, not the raw ones, feed the
calculation.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136,
plus the live corrupted-storage self-heal check above.

**Commit:** `apps/mobile/src/screens/ZakatScreen.tsx`.

## Iteration 48 — B9 revisited: back-button handling re-checked after 40 iterations of changes, plus the ErrorBoundary interaction

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** re-ran iteration 8's exhaustive grep (`BackHandler`,
`Modal`, `presentation:`, `beforeRemove`/`preventRemove`) across the
whole `apps/mobile/src` tree as it stands now, after ~40 iterations of
changes since — including this loop's own `ErrorBoundary` addition — to
confirm the "zero custom back-handling" invariant iteration 8 found still
holds and wasn't quietly broken by later work. Still zero matches.

**New angle this pass:** does the `ErrorBoundary` (added iteration 31, a
component this perspective's original check predates) interact correctly
with navigation state? Since it wraps the entire tree including
`NavigationContainer`, catching a crash unmounts the whole navigation
stack; tapping "Try again" remounts everything fresh, which means the
user lands back at the app's initial route (Home) rather than wherever
they were when the crash happened — navigation position is **not**
preserved across a recovery. Concluded this is the correct, deliberate
tradeoff for a last-resort crash barrier, not a bug: resetting to a known
-good state avoids "Try again" immediately re-rendering whatever crashing
state caused the problem in the first place, which could just loop.

**One plausible, native-only-unverifiable observation, not acted on:**
while the fallback UI is showing, there's no `NavigationContainer`
mounted at all (the crash was caught above it), so Android's hardware
back button has nothing registered to intercept it — it would likely fall
through to the OS default (background/exit the app) rather than doing
nothing or dismissing the fallback. Can't verify either way in this
environment (no Android emulator; `react-native-web` has no `BackHandler`
equivalent — the same honest limitation iteration 8 already documented).
Not fixing speculatively: this is an edge case of an edge case (only
reachable after an actual uncaught crash), and "back exits a crashed app"
isn't obviously wrong behavior anyway.

**Verification:** read-only iteration; prior gate holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 49 — B10 revisited: deep-link handling, closing the cosmetic gap left open

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** re-confirmed no new param-taking deep-link routes were added
to `App.tsx`'s `linking` config in the ~40 iterations since (still just
`surah/:surah`, `juz/:juz`, `page/:page`, `plans/:id`) — the original
exhaustive per-screen audit still covers everything reachable. Then
revisited the one thing iteration 9 explicitly left as "cosmetic, not
worth fixing": `MushafPageScreen`'s title bar flashing "Page NaN" for a
malformed `/page/xyz` link, set by a `useLayoutEffect` one step ahead of
the param-validity check.

**Fixed it anyway** — later iterations in this cycle have consistently
closed small, safe, same-shaped gaps once re-examined (the mosque-finder
retry button, the wording sync), and this one is a one-line, zero-risk
change: `navigation.setOptions({ title: isValidPageNumber(n) ? \`Page
${n}\` : "Page" })`.

**Live-verified both paths** in the browser preview: `/page/xyz` now
shows a clean "Page" tab title (was "Page NaN") while the body correctly
still shows "Couldn't load page NaN." (the diagnostic detail belongs in
the error body, not the chrome); `/page/5` still shows "Page 5" — no
regression to the valid path.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136,
plus the live before/after title check above.

**Commit:** `apps/mobile/src/screens/MushafPageScreen.tsx`.

## Iteration 50 — B11 revisited: the ErrorBoundary can leave the splash screen stuck forever (closes out batch 5)

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-05`

**Checked:** iteration 10 fixed the splash screen to hide once fonts and
the onboarding check both resolve, via `AppGate`'s own `useEffect`. This
pass asked a question only possible to ask *after* iteration 31 (much
later in this same loop) added the `ErrorBoundary`: what happens if a
crash is caught **before `AppGate` ever mounts** — during
`SafeAreaProvider`/`ThemeProvider`/`I18nProvider`/`SettingsProvider`/
`LibraryProvider` initialization, several of which read from persisted
storage on mount, i.e. exactly the kind of state the `ErrorBoundary`
itself exists to protect against?

**Found and fixed a real, serious gap: this was possible, and it would
have hung the app forever with no visible recovery.**
`SplashScreen.hideAsync()` is called in exactly one place —
`AppGate`'s `useEffect`. If the crash happens anywhere in the provider
tree *above* `AppGate`, that effect never runs. `expo-splash-screen`'s
`preventAutoHideAsync()` keeps the native splash **covering the RN
content** until `hideAsync()` is explicitly called — so the
`ErrorBoundary`'s fallback UI ("Something went wrong" / "Try again")
would render successfully, entirely correctly, **invisibly**, behind a
splash screen that never goes away. The one feature built specifically to
give a crashing app a recovery path would be unreachable for crashes in
exactly the startup window most likely to produce one.

**Fix:** [`ErrorBoundary.tsx`](apps/mobile/src/ErrorBoundary.tsx)'s
`componentDidCatch` now also calls `SplashScreen.hideAsync().catch(() =>
{})` — guaranteed the moment any crash is caught, regardless of where in
the tree it happened, and a no-op if the splash was already hidden by the
normal path. This is the one deliberate exception to the file's own
"stay independent of everything it might be catching" design principle
(stated in its header comment): `expo-splash-screen` is a leaf native
module, not app logic that could itself be the thing crashing, so
importing it doesn't compromise that independence.

**Live-verified the mechanism still works correctly** with the new
import in place, reusing iteration 31's exact temporary-throw-and-revert
method: forced a real crash in `HomeScreen`, confirmed the fallback still
renders with no new errors from the `SplashScreen` import, reverted
before committing. Couldn't verify the actual splash-hide timing itself
on web — same honest limitation iteration 10 already documented
(`expo-splash-screen` has no native splash to control in a browser) —
this needs a real-device check before the next Play Store build.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136,
plus the live crash/fallback re-check above.

**Commit:** `apps/mobile/src/ErrorBoundary.tsx`.

---

## Batch 5 summary (iterations 41–50, branch `mobile-stabilization-05`)

Cycle 2 of the perspective catalogue — deepening rather than re-skimming.
Ten iterations, six with real fixes:

- **41:** confirmed prayer-time DST correctness is structural; added
  Southern Hemisphere and half-hour-offset timezone test coverage.
- **42:** confirmed Zakat's four fields are the only free-text numeric
  inputs in the entire app; ruled out a comma-locale concern.
- **43:** confirmed the tasbih counter's rapid-tap handling was already
  exemplary.
- **44:** closed a real sync-reload race in `PrayerTrackerScreen`
  deferred since iteration 22 — a generation-counter guard, verified with
  deterministic tests reproducing the exact race.
- **45:** confirmed Hifz pluralization correctness beyond the one
  originally-reported string.
- **46:** confirmed the khatm completion card's undo/reset paths avoid
  both the Zakat-reset and stepper-race bug classes.
- **47:** confirmed Zakat's calculation layer already defends against
  negative values regardless of path; extended the currency-only
  load-time self-heal to every decimal field; live-verified against a
  corrupted-storage scenario.
- **48:** re-confirmed zero custom back-handling after 40 more iterations
  of changes; examined the `ErrorBoundary`'s navigation-reset behavior.
- **49:** closed the "Page NaN" title-flash cosmetic gap iteration 9 had
  deliberately deferred.
- **50:** found and fixed a real gap in the `ErrorBoundary` itself — a
  crash during startup could leave the splash screen stuck forever,
  hiding the recovery UI it exists to show.

Full detail for each is above, under its own `## Iteration N` heading.

## Iteration 51 — B12 revisited: the exact race fixed in PrayerTracker was also live in LibraryContext, app-wide

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 11 confirmed app background/foreground handling
was clean via three purpose-built mechanisms, with an honest note that it
couldn't be tested on a real device. This pass took a different angle:
having just fixed a sync-reload-vs-local-write race in `PrayerTrackerScreen`
(iteration 44), and confirmed here that `AppState` foregrounding and a
sync round both funnel through the same `onSyncApplied` signal
(`App.tsx`'s foreground listener → `syncIfEnabled()` →
`emitSyncApplied()`), the natural question was: does any *other*
`onSyncApplied` consumer have local writes that could race the exact same
way?

**Found the same bug, at much higher stakes.**
[`LibraryContext.tsx`](apps/mobile/src/state/LibraryContext.tsx) — a
provider mounted for the app's **entire lifetime**, wrapping every screen
— has a `load()` that unconditionally overwrites 7 pieces of state
(`bookmarks`, `lastRead`, `hifz`, `streak`, `reviewLog`, `collections`,
`notes`) on every `onSyncApplied` event, and **8 separate writer
functions** (`toggleBookmark`, `setLastRead`, `setHifzCard`,
`removeHifzCard`, `touchStreak`, `recordReview`, `updateCollections`,
`setNote`) that could each race it exactly the way `PrayerTrackerScreen`
did — a reload's read starting before a tap's write lands, resolving
after, silently reverting it. Unlike the prayer tracker (a single
screen), this is the app's most heavily-used shared state: **hifz review
progress, a bookmark toggle, a saved note, or a new collection could all
be silently reverted** by an ill-timed sync or foreground event — a
correctness bug in the app's core memorization-tracking feature, not a
cosmetic one.

**Fix:** applied the identical `writeGen`/`ignoreStale` pattern from
iteration 44 — a generation counter bumped by all 8 writers, with
`load()`'s 7 reads each discarding their result if a newer local write
landed since they were dispatched. No new abstraction needed: `ignoreStale`
(added to [`utils.ts`](apps/mobile/src/utils.ts) in iteration 44) is
already generic and directly reusable here.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136 (the
mechanism itself is already covered by iteration 44's 3 deterministic
`ignoreStale` tests — this iteration is a new *consumer* of an
already-tested guard, not new logic needing its own test). Live-verified
the normal, non-racing paths still work in the browser preview:
navigating to a surah correctly wrote `ul.lastRead`, and triggering a
collection save correctly persisted to `ul.collections` — no new console
errors, only pre-existing unrelated noise already documented earlier in
this log.

**Commit:** `apps/mobile/src/state/LibraryContext.tsx`.

## Iteration 52 — B12 continued: the same race, a third time, in SettingsContext

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** having found the sync-reload-vs-local-write race in two
places now (`PrayerTrackerScreen`, `LibraryContext`), checked every
remaining `onSyncApplied` consumer for the same shape. Of the 11
consumers, most are pure read/refresh screens (Home, mosque finder,
names, prayer times, Qibla — no local writes to race). One more had it.

**Found and fixed the same bug a third time.**
[`SettingsContext.tsx`](apps/mobile/src/state/SettingsContext.tsx) —
another app-lifetime provider — has `loadPrefs()` conditionally
overwriting 9 preference fields on every `onSyncApplied` event, and 10 of
its 11 writer functions (every one except `setTafsirCompare`, which
isn't reloaded on sync at all — confirmed `ul.tafsirCompare` isn't a
`MANAGED_KEYS` entry, so there's nothing for it to race) could each have
their tap silently reverted by a reload that started before the tap's
write landed. Lower stakes than `LibraryContext` (a reverted preference
toggle, not lost hifz progress), but the same real bug, and by now a
recognizable pattern worth closing everywhere it appears rather than
leaving it half-fixed.

**Fix:** the same `writeGen`/`ignoreStale` pattern, applied precisely —
guarded every setter `loadPrefs` touches, left `setTafsirCompare`
unguarded since it genuinely has nothing to race.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136.
Live-verified in the browser preview that the app still boots and
renders correctly with `SettingsProvider` (which wraps the entire app)
initializing without error — no new console errors beyond the same
pre-existing, already-documented noise. Couldn't complete a full toggle-
by-toggle click-through this session (the RN-web preview's navigation
state has been unreliable for click-based navigation throughout this
session, documented honestly rather than claiming a check that didn't
finish) — the mechanism itself is the same one already proven correct by
iteration 44's deterministic tests and this iteration's own static
verification.

**Commit:** `apps/mobile/src/state/SettingsContext.tsx`.

## Iteration 53 — B13 revisited: kill-and-restore, re-verified through the race-guard changes just made

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 12 found strong, structural corruption protection
(every read goes through `getJSON`'s try/catch + shape-validator, lint-
enforced by ADR 0028) and live-verified it by writing truncated/wrong-
shape JSON and cold-reloading. This pass asked whether the `writeGen`/
`ignoreStale` guard just added to `LibraryContext` and `SettingsContext`
(iterations 51-52) could have disturbed that — a legitimate question,
since `stores-corrupt.test.ts` tests the *store* layer
(`library-store.ts`) directly, not the *React context* layer where the
new wrapping code actually lives, so nothing in the existing test suite
directly exercises `load()`'s corruption handling through the new guard.

**Reasoned through it first, then verified live rather than trusting the
reasoning alone.** `writeGen` is an in-memory `useRef`, always `0` on a
fresh mount; `ignoreStale`'s check (`currentGen() === gen`) is trivially
true on the very first `load()` call since nothing could have written
locally yet — so the guard is a no-op for a cold start by construction,
and the existing corruption-fallback behavior should flow through
untouched. Confirmed this live: wrote the same class of corruption
iteration 12 used, through the exact fields the new guard now wraps
(truncated `ul.hifz`, wrong-shape `ul.bookmarks`, empty `ul.editions`,
wrong-type `ul.scale`), cold-reloaded, and got the same clean result —
Home rendered fully and correctly, including "Continue reading" from the
still-valid `ul.lastRead`, no new console errors.

No fix needed; the two recent changes don't interact badly.

**Verification:** live corrupted-storage check above; no code changed
this iteration, prior gate (136/136) holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 54 — B14 revisited: the ErrorBoundary's own fallback has no safe-area awareness

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 14 confirmed every screen's safe-area handling is
correct — 5 screens with custom headers manage their own insets, every
other screen relies on native-stack's built-in handling. This pass asked
about a component that didn't exist yet at the time: the `ErrorBoundary`
(added iteration 31). Its fallback is raw `View`/`Text`/`Pressable` with
hardcoded `padding: 28` — no safe-area awareness at all.

**Found a real gap, structural not cosmetic.** `App.tsx` mounts
`ErrorBoundary` **outside** `SafeAreaProvider`
(`<ErrorBoundary><SafeAreaProvider>...`). When the boundary catches a
crash anywhere in the tree, its fallback renders with **zero safe-area
context available at all** — not just unstyled, but structurally cut off
from ever getting real inset values, since `useSafeAreaInsets()`/
`SafeAreaView` need to be inside the Provider to work. On a real device,
the "Something went wrong" title could render under a notch/status bar,
and the "Try again" button could sit under the home indicator/gesture
bar — exactly when the user most needs to reliably tap it.

**Fix, two parts:**
1. **Reordered `App.tsx`** so `SafeAreaProvider` wraps `ErrorBoundary`,
   not the other way around. Same reasoning as importing
   `expo-splash-screen` into the boundary (iteration 50):
   `react-native-safe-area-context` is a stable, widely-used third-party
   layout primitive, not app logic that could itself be the thing
   crashing, so it's safe to keep it outside the boundary's protection
   scope, and doing so is what actually lets the fallback use it.
2. **`ErrorBoundary.tsx`** now renders its container as `SafeAreaView`
   (from `react-native-safe-area-context`, matching every other screen in
   this app) instead of a plain `View` — usable directly in a class
   component's `render()` without needing the `useSafeAreaInsets` hook,
   which a class component can't call anyway.

**Live-verified** via the browser preview, reusing the established crash-
test method: forced a real crash, confirmed the fallback still renders
correctly with the reordered providers and `SafeAreaView` in place (no
new errors — specifically no "used outside a Provider" failure, which
would have been the direct evidence a reordering mistake produces), then
reverted the temporary throw and confirmed normal app boot still works
unchanged.

**Verification:** `pnpm lint` clean (after removing the now-unused
`View` import), `pnpm --filter @ummahlibrary/mobile typecheck` clean,
`pnpm --filter @ummahlibrary/mobile test` 136/136, plus the live
crash/recovery and normal-boot checks above.

**Commit:** `apps/mobile/App.tsx`, `apps/mobile/src/ErrorBoundary.tsx`.

## Iteration 55 — B15 revisited: two more keyboard-avoiding gaps, and a correction to iterations 8/48

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Correction to iterations 8 and 48: "zero `Modal` usage" was wrong,
found while re-grepping `TextInput` sites for this pass.** Both searched
for a direct `from "react-native"` import or a literal `"Modal }"`
substring — neither matches how this app actually imports RN components:
through [`Type.tsx`](apps/mobile/src/Type.tsx)'s `export * from
"react-native"` wildcard, `import { Modal, ... } from "../Type"`. Two
components genuinely use `Modal`:
[`SaveToCollection.tsx`](apps/mobile/src/components/SaveToCollection.tsx)
and
[`TranslationManager.tsx`](apps/mobile/src/components/TranslationManager.tsx).
Checked whether this actually matters for the back-button conclusion
those iterations drew: it doesn't — both already pass `onRequestClose`
(`SaveToCollection`: `() => setOpen(false)`; `TranslationManager`:
`onClose`), which is what Android's hardware back needs to close a
`Modal` at all. The underlying finding (back-button handling is fine)
turns out to still hold, but the search that was supposed to prove it
had a real blind spot — noting this here rather than letting a wrong
"zero usage" claim stand uncorrected in two separate entries.

**Checked those same two `Modal`s — plus `SyncSection`'s `TextInput`,
also missed by iteration 15's original 5-screen list — for the keyboard-
avoiding question this perspective is actually about.**

- **`TranslationManager`**: search field sits at the very top of the
  modal panel, above its `ScrollView` — same "search bar can't be
  obscured" exemption iteration 15 already established for
  `SearchScreen`/`SurahListScreen`. No fix needed.
- **`SaveToCollection`**: found a real gap. Its "New collection…" input
  sits near the *bottom* of a bottom-sheet modal
  (`justifyContent: "flex-end"` — pinned to the screen's bottom edge,
  where an opening keyboard would land directly on top of it), with zero
  keyboard-avoiding treatment. This is the exact risk shape iteration 15
  already fixed for `CollectionsScreen`/`PlansScreen`.
- **`SyncSection`**: found a second real gap. It's a plain component
  rendered inside `SettingsScreen`'s `ScrollView`, past the halfway point
  of a 519-line screen (theme, language, reading, then sync, then data —
  confirmed by reading the render order) — same shape, and
  `SettingsScreen` itself had no `KeyboardAvoidingView` at all.

**Fix:** wrapped `SaveToCollection`'s modal sheet, and `SettingsScreen`'s
top-level `ScrollView`, in `KeyboardAvoidingView` — the identical,
already-established `behavior={Platform.OS === "ios" ? "padding" :
undefined}` pattern from every prior fix of this exact class.

**Process note, caught before it did damage:** ran `pnpm format`
(workspace-wide `prettier --write`) intending to format just these two
edited files, and it reformatted **~285 files across the entire
monorepo** — the shared prettier config apparently differs from what's
currently checked in for a large swath of the repo, unrelated to this
change. Caught it via `git status` before committing, reverted every file
except the two actually touched (`git checkout -- <explicit file list>`,
excluding the two intended ones), and re-verified the gate afterward.
Noting this as a real trap for a mobile-scoped loop to watch for:
`pnpm format`/`prettier --write` with no path argument formats
everything, not just what changed.

**Live verification:** typecheck/lint/tests all pass and the diffs were
confirmed to be exactly the intended change (the large line count in
`SettingsScreen.tsx`'s diff is the expected, unavoidable re-indentation
cascade from wrapping the top-level returned JSX, not stray
reformatting). Couldn't complete a click-through of the actual modal in
the browser preview this session — the same stale-navigation-ref
unreliability documented in iterations 44 and 52 recurred — so this
one rests on strong static verification rather than an in-browser
click-test; noting the gap honestly rather than claiming a check that
didn't finish.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136.

**Commit:** `apps/mobile/src/components/SaveToCollection.tsx`,
`apps/mobile/src/screens/SettingsScreen.tsx`.

## Iteration 56 — B16 revisited: closing the notification-permission feedback gap logged in iteration 16

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 16 found and fixed the location-permission gap
(added "Open Settings"), and explicitly logged a smaller, related gap as
a deliberate follow-up rather than bundling it in: notification-permission
denial gives *zero* feedback beyond a switch silently not flipping on.
This pass closed that follow-up.

**Scope was bigger than the original note implied — same silent-failure
shape at 5 call sites, not the "one smaller gap" it read as.** Grepped
every `expoNotifier.permission()` check app-wide:
`PlanReminderToggle`, `AdhkarReminderToggle`, `SunnahFastReminderToggle`,
and per-toggle handlers in `HijriCalendarScreen` and `PrayerTimesScreen`
all have the identical `if (... !== "granted") return;` — permission
denied, switch snaps back off, nothing explains why or what to do about
it.

**Fix:** added
[`notification-permission-alert.ts`](apps/mobile/src/notification-permission-alert.ts)
— a small shared `Alert.alert` with an "Open Settings" action
(`Linking.openSettings()`, same mechanism iteration 16 already
established for the location screens), parameterized by a short reminder
label so each of the 5 call sites keeps its own accurate copy ("daily
reading reminder", "adhkar reminder", "Sunnah fast reminder", "event
reminder", `` `${PRAYER_LABELS[name]} reminder` `` for the per-prayer
case) instead of one generic message. Kept this out of `notifier.ts`
deliberately — that file is a clean `Notifier` port adapter with no UI
concerns, and mixing in `Alert`/`Linking` would cross that layering on
purpose for no real gain.

**Verification:** `pnpm lint` clean, `pnpm --filter @ummahlibrary/mobile
typecheck` clean, `pnpm --filter @ummahlibrary/mobile test` 136/136.
Live-verified the app still boots normally with the new imports across
all 5 touched files — no new console errors. **Not verified live:** the
actual Alert dialog itself, for the same reason iteration 16 couldn't —
inducing a real permission denial isn't reliably scriptable against a
desktop browser. Confirmed `git status` shows only the intended files
before committing, after the accidental workspace-wide format in the
previous iteration.

**Commit:** `apps/mobile/src/notification-permission-alert.ts` (new),
`apps/mobile/src/components/PlanReminderToggle.tsx`,
`apps/mobile/src/components/AdhkarReminderToggle.tsx`,
`apps/mobile/src/components/SunnahFastReminderToggle.tsx`,
`apps/mobile/src/screens/HijriCalendarScreen.tsx`,
`apps/mobile/src/screens/PrayerTimesScreen.tsx`.

## Iteration 57 — B17 revisited: audio interruption handling confirmed uniform across both reader screens and both audio sources

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 17 found `useSurahAudio.ts`'s interruption
handling (pausing the stall watchdog during a call/audio-focus loss
instead of skipping ahead) to be unusually well-engineered, verified
against `SurahReaderScreen` specifically. This pass checked two things
that finding didn't explicitly rule out: does `JuzReaderScreen` (the
other audio-playing screen) share the same protection, or does it have
its own, separately-implemented audio logic that could have its own
gaps? And does the interruption handling apply the same way to offline
(downloaded) playback as it does to streaming — iteration 29 fixed a
corrupted-download bug in the same audio subsystem since this perspective
was last checked, so it's worth confirming that later work didn't
introduce a divergent code path.

**Both confirmed clean, by construction rather than by inspecting two
separate implementations.** `JuzReaderScreen` and `SurahReaderScreen`
both call the exact same `useSurahAudio(reciter)` hook — not a duplicated
or screen-specific copy — so iteration 17's finding covers both screens
automatically; there's only one interruption-handling implementation to
have a bug in, and it's already been audited. For the offline-vs-
streaming question: traced the source resolution directly —
`const src = local ?? timing.url` picks between a downloaded file:// path
and a remote https:// stream URL, but both feed into the same
`ensurePlayer(src)` call and the same `playbackStatusUpdate` listener
downstream. The interruption-handling code operates on player *status
events*, not the source URL, so there's no branch point where offline
playback could have ended up with weaker protection than streaming.

No fix needed.

**Verification:** read-only iteration; prior gate (136/136) holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 58 — B18 revisited: mosque search and sync's offline behavior

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** iteration 18 traced `readThrough`'s graceful-degradation
design across content screens (surahs, tafsir, hadith, names). This pass
checked two things outside that scope: `getNearbyMosques` (deliberately
audited for accuracy, not offline behavior, back in iteration 39), and
the sync feature (added well after iteration 18's original check, and
the subject of three of this loop's own recent fixes).

**Both clean, and both by deliberate design already documented
elsewhere.** `getNearbyMosques` calls `getJson` directly, not
`readThrough` — same as `getPrayerTimes`, and for the same reason
`api.ts`'s own header comment states for prayer times: this is live,
location-dependent data, not stable content a reader "opened," so caching
it risks silently serving a stale/wrong result rather than a clear
"unavailable." Going offline surfaces through the same already-audited
`getJson` retry/error path iteration 39 confirmed `MosqueFinderScreen`
handles cleanly (with a retry option on every terminal state, iteration
39's own fix).

For sync: **background auto-sync** (`App.tsx`'s foreground trigger)
swallows a network failure completely silently
(`.catch(() => {})`) — deliberate, matching ADR 0033's documented intent
("failures are swallowed"), and correct for a non-blocking background
operation the user never explicitly triggered. **Manual "Sync now"**
(`SyncSection.tsx`) is the opposite, correctly: wrapped in try/catch,
sets an explicit `SERVER_DOWN` status message on failure — the right
distinction, since a user-initiated action needs feedback a silent
background one doesn't.

No fix needed.

**Verification:** read-only iteration; prior gate (136/136) holds.

**Commit:** none (clean iteration; no code changes).

## Iteration 59 — B19 revisited: reminder re-sync race safety and the ErrorBoundary's effect-execution question

**Date:** 2026-09-22
**Branch:** `mobile-stabilization-06`

**Checked:** two things downstream of this cycle's own earlier fixes.
First: `App.tsx`'s `syncAll()` re-runs every reminder family's sync on
every `AppState` foreground event — the exact same trigger shape as the
`onSyncApplied`-driven reload race iterations 44/51/52 found and fixed
elsewhere. Does `syncPrayerReminders`/`syncAdhkarReminder`/
`syncPlanReminder` have the same vulnerability if foreground events fire
in quick succession (a rapid app-switch-away-and-back)? Second: does the
`ErrorBoundary` (added iteration 31, wraps everything *below* `App()`'s
own top-level `useEffect`) risk re-running that effect — and re-triggering
`syncAll()` redundantly — every time its "Try again" resets state?

**Both confirmed clean, for different reasons than the state-race
fixes.** The reminder-sync functions are **idempotent by construction**,
not merely lucky: each does `notifier.cancel(id)` then conditionally
`notifier.schedule({ id, ... })`, and `notifier.ts`'s `schedule()` always
replaces any existing notification under that same stable `id`
(`identifier: n.id`). Two overlapping calls converge to whichever
prefs-read resolved last — never a duplicate, never a crash, unlike the
React-state race class this cycle found (which specifically caused **data
loss** by clobbering fresher in-memory state with a stale reload). This
is a fundamentally different shape: no in-memory state to clobber, since
each call reads storage fresh and the notifier's own replace-by-id
semantics absorb any interleaving harmlessly.

For the `ErrorBoundary` question: re-traced the actual component tree.
`App()`'s top-level `useEffect` (which calls `syncAll()`) belongs to
`App()` itself, which sits *outside* what the boundary wraps — the
boundary's `render()` swapping to its fallback and back only re-renders
`this.props.children`, never `App()` itself, so `App()`'s effects run
once per real app mount, not once per boundary reset. No redundant
`syncAll()` risk from the recovery flow.

**Verification:** read-only iteration; prior gate (136/136) holds.

**Commit:** none (clean iteration; no code changes).
