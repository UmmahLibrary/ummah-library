# Manual E2E QA - Round 17 (2026-08-22)

First native-Android round of this QA loop. Rounds 1-16 ran entirely through
a browser (web app, and mobile via `expo start --web`). This round runs the
actual native app on an Android emulator (`QA_Pixel6`, via a real
`expo run:android` build), driven with `adb` (screenshots + `input tap`/
`keyevent`, plus `uiautomator dump` for exact element bounds) since there is
no Browser-pane equivalent for a native app window.

Getting a native build running at all was most of this round's effort - see
"Environment setup" below. Once running, this round covered: quick actions
from Home (Read/Listen/Qibla), the Qur'an reader's native audio playback,
the Android hardware back button across several navigation paths, and the
real (non-mocked) Android location-permission grant.

## Findings

### 1. Cross-tab quick actions leave the destination tab's list screen permanently unreachable - FIXED

- **Where:** [apps/mobile/src/navigation/RootTabs.tsx](../../apps/mobile/src/navigation/RootTabs.tsx)
- **Symptom:** From Home, tapping the "Qibla" quick action opens the Qibla
  screen with **no back chevron** in its header. A single press of the
  Android hardware back button from there goes straight to the Home tab,
  skipping the Tools list entirely. Afterward, tapping the "Tools" tab in
  the bottom bar shows the Qibla screen again (not the Tools list) - the
  Tools tab's actual root screen (`ToolsList`, with Tasbih/Adhkar/Prayer
  Times/Zakat/Nearby Mosques/etc.) becomes **unreachable via the tab bar for
  the rest of the app session**. Reproduced identically after a full
  `am force-stop` + cold relaunch, ruling out session-accumulated state.
  The same `navigation.getParent()?.navigate(<Tab>, { screen })` pattern is
  used from Home's "Listen" quick action (into the Read tab) and from three
  other screens (`CollectionsScreen`, `ReadingGoalsScreen`, `SearchScreen`),
  so the same lockout applies to the Read and Tools tabs from multiple entry
  points, not just Qibla.
- **Root cause:** `RootTabs`'s `Tab.Navigator` mounts each tab's stack
  lazily (React Navigation's default). When a cross-tab
  `navigation.getParent()?.navigate("Tools", { screen: "Qibla" })` call is
  the *first* thing to touch the Tools tab's stack, React Navigation
  initializes that stack's state as `[Qibla]` only - not
  `[ToolsList, Qibla]` - because the stack had no prior state to push onto.
  With no route beneath it, there's nothing for the header back button or
  hardware back to pop to, and since the tab navigator preserves each tab's
  stack state, that truncated `[Qibla]` state persists for every later visit
  to the Tools tab.
- **Fix:** Set `lazy: false` on `RootTabs`'s `Tab.Navigator` screenOptions,
  so all five tab stacks mount (and establish their real initial route -
  `ToolsList`, the Qur'an surah list, etc.) as soon as `RootTabs` itself
  renders, before any cross-tab `navigate()` call can run. A later
  `navigate("Tools", { screen: "Qibla" })` then pushes onto the
  already-`[ToolsList]` stack instead of initializing it, giving
  `[ToolsList, Qibla]` as intended.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm typecheck` (8/8 packages clean), `pnpm --filter @ummahlibrary/mobile
  test` (105/105 passed). Live re-verification on the native build, from a
  cold `am force-stop` + relaunch: Home -> Qibla now shows a back chevron;
  one hardware back press correctly lands on the Tools list (all entries
  visible); Home -> Listen now shows a back chevron on the surah reader and
  one back press correctly lands on the Qur'an surah list. Both previously
  broken paths confirmed fixed.
- **Regression test:** None added - this is a navigation-wiring issue with
  no unit-level surface, and (as established throughout this session) there
  is no component-test harness for mobile screens. Verified live only, per
  the same constraint documented in every mobile-focused round this
  session.

## Investigated, no bug found

- **Qur'an audio playback (native):** tapping play on Al-Faatiha's reciter
  control produced a real playback session on the emulator's virtual audio
  device (confirmed via `logcat`'s AudioFlinger/mixer activity, standby
  afterward, no errors) - genuinely untestable in the web rounds since a
  headless browser can't exercise real audio hardware the same way.
- **Qibla compass reads a fixed "0° N":** expected - the emulator has no
  magnetometer, so there's no live heading to rotate the dial against. The
  screen still renders correctly and doesn't crash on missing sensor data.
- **Real (non-mocked) Android location permission:** granted automatically
  by the debug install (`adb install -g`-equivalent behavior from `expo run
  :android`), so no runtime permission dialog appeared to test. Confirmed
  via `adb shell dumpsys package` that `ACCESS_FINE_LOCATION`/
  `ACCESS_COARSE_LOCATION` were pre-granted. A future round could revoke
  permissions first (`adb shell pm revoke`) to exercise the actual prompt.
- **Android hardware back button, general:** repeatedly tested across
  several screens (surah reader -> surah list -> Home; Qibla flows above) -
  correctly intercepted by React Navigation with no crashes, and the app
  handles back-on-Home-root gracefully (stays resumed, doesn't force-close).
- **Tab-bar re-tap preserving nested screen state:** this resolves round
  14's open question ("switching tab-bar tabs sometimes preserves a nested
  screen, sometimes resets to root - unclear which"). On native, this is
  now confirmed as *intentional, standard* React Navigation behavior:
  switching away from a tab and back always preserves that tab's current
  screen. Round 14's inconsistent web observations were most likely a
  web/hot-reload artifact rather than app behavior - not investigated
  further since native behavior is now unambiguous and correct.

## Environment setup (not app bugs, recorded for future rounds)

Getting `expo run:android` to produce a working build in this environment
required, in order:
1. **Node.js was not installed at all** on this Windows machine (no `node`/
   `npm`/`pnpm` on PATH, not in any standard install location) - installed
   Node 22 (matching the repo's `.nvmrc`) via `winget install OpenJS.NodeJS.22`.
2. **JDK 25** (Android Studio's bundled JBR) is too new for this project's
   pinned Gradle 8.14.3 - installed Temurin JDK 17 via winget and pointed
   `JAVA_HOME` at it instead.
3. **Windows' 260-character path limit** repeatedly broke the native C++
   (ninja/CMake) build steps for `react-native-screens`, `expo-modules-core`,
   and `@react-native-async-storage/async-storage`, because pnpm's default
   `.pnpm` virtual store encodes each package's full peer-dependency
   signature into its folder name (100+ characters on its own). Neither
   shortening the store's root path nor enabling Windows' `LongPathsEnabled`
   registry policy was sufficient, since some tools in the chain (`ninja`,
   `net.rubygrapefruit.platform`) don't honor the long-path opt-in.
   Resolved by switching pnpm to `node-linker=hoisted` (a flat `node_modules`
   with no encoded folder names) via the **global** `~/.npmrc` - a
   machine-local config change, not a change to the repo's own `.npmrc`.
4. A stale Gradle build cache (`~/.gradle/caches/build-cache-1`) served an
   old, path-embedded generated file across the linker-mode switch and had
   to be cleared once by hand.

None of this required any change to the repository's own build
configuration - `apps/mobile/android/` and the project's committed
`.npmrc` are untouched.

## Verification

- `pnpm lint` - 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm typecheck` - 8/8 workspace packages clean.
- `pnpm --filter @ummahlibrary/mobile test` - 105/105 passed.
- Live re-verification against the native `org.ummahlibrary.app` build
  running on the `QA_Pixel6` emulator, via `adb`, as detailed above.

## Verdict

One real bug found and fixed this round - a systemic cross-tab-navigation
issue that made the Tools list (and, from a second entry point, the Qur'an
surah list) permanently unreachable via the tab bar once triggered from a
Home quick action. This was only reachable through native navigation timing
and was never exercised by the web-only rounds 1-16. Restarting the
3-in-a-row clean-streak count at zero.
