# Manual E2E QA — Round 23 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the "More" menu's scholarly-content screens: Tafsir, Hadith,
99 Names, and Your Journey.

## Findings

### 1. Tafsir screen near-freezes the app for 1-2 minutes on long editions/surahs - FIXED

- **Where:** [apps/mobile/src/screens/TafsirScreen.tsx](../../apps/mobile/src/screens/TafsirScreen.tsx)
- **Symptom:** Opening Tafsir → selecting the "Tafsir al-Tabari" edition (the
  unabridged classical commentary, much longer per-āyah than the default
  "Tafsir Ibn Kathir (abridged)") → then switching to Sūrah 2 (Al-Baqarah,
  286 āyāt) caused the screen to spin its loading indicator far longer than
  any other screen in the app, and while it did, the whole app stopped
  responding — even the hardware Back button's effect didn't land until
  well over a minute later. `adb logcat` confirmed this wasn't perception:
  `Choreographer: Skipped 6484 frames!` — at 60fps that's roughly 108
  seconds of the main thread being completely blocked, a near-ANR. A real
  user hitting this combination (a very plausible one — al-Tabari on any of
  the Qur'an's longer sūrahs) would reasonably conclude the app had crashed
  or frozen.
- **Root cause:** `TafsirScreen` rendered every fetched entry via
  `entries.map(...)` inside a plain `ScrollView`, i.e. fully unvirtualized —
  every āyah's tafsir text for the whole sūrah was mounted as native views
  simultaneously, all at once, the moment the fetch resolved. For a short
  sūrah or a concise edition (Muyassar, or Ibn Kathir abridged) this is a
  few dozen `Text` nodes and unnoticeable. For al-Tabari × Al-Baqarah it's
  286 entries of often multi-paragraph, heavily-punctuated classical Arabic
  — thousands of `Text` nodes laid out in one synchronous pass, which is
  exactly the kind of workload React Native's `FlatList`/virtualization
  exists to avoid.
- **Fix:** Replaced the `ScrollView` + `.map()` body with a `FlatList`
  (already an established pattern in this codebase — `SurahReaderScreen.tsx`
  uses the same approach for its translation view), with the sūrah
  title/edition name moved into `ListHeaderComponent` and the "no tafsir for
  this sūrah" message moved into `ListEmptyComponent`. Only visible items
  are mounted now, regardless of edition length or sūrah size. The loading
  and error states (`entries === null` / `error`) are unaffected — they
  still render in a plain `ScrollView` since there's no list to virtualize
  in those states.
- **Verification:** `pnpm lint` (0 errors; 1 pre-existing warning in the
  file, unrelated to this change — `useEffect` missing `edition` dep, same
  warning present before this fix), `pnpm typecheck` (clean), `pnpm
  --filter @ummahlibrary/mobile test` (105/105 passed). Live re-verification
  on the native build: reproduced the exact freeze first (confirmed via
  `Choreographer: Skipped 6484 frames!` in logcat and a Back-button press
  that took over a minute to register), then re-tested the identical
  Tafsir al-Tabari + Al-Baqarah combination after the fix — content
  appeared in ~4 seconds, `adb logcat` showed **zero** skipped-frame
  warnings for that load, and scrolling through the list was immediate and
  smooth.
- **Regression test:** None added — this is a rendering-performance fix
  with no pure-`core` logic to unit-test, and the existing test suite has
  no React Native Testing Library harness for mobile screens (unlike the
  web app's `*.test.tsx` files). The live re-verification above is the
  practical regression check available for this class of bug on this
  platform.

## Investigated, no bug found

- **Tafsir edition/sūrah switching (functional correctness):** chip
  selection, content refetch, and the loading/error/empty states all update
  correctly and independently of the performance bug above — confirmed by
  switching editions (Muyassar → al-Tabari) and sūrahs (1 → 2) and checking
  the displayed content, title, and edition byline matched each selection.
- **Hadith screen:** shares the same `ScrollView` + `.map()` rendering
  pattern as the old Tafsir screen, but is paginated per **book/chapter**
  (e.g. "Book 1 · Revelation" had a single hadith) rather than per whole
  collection, so an individual page never approaches the hundreds-of-entries
  scale that triggered the Tafsir bug. Spot-checked Sahih al-Bukhari Book 1
  — loaded instantly, Arabic/English rendered correctly, Prev/Next
  navigation worked. Not converted to `FlatList`; no freeze reproduced, and
  doing so speculatively would be scope creep beyond what's actually broken.

## Environment note (carried over, not re-investigated this round)

The web unit-test suite's pre-existing duplicate-React-instances issue
(documented in round 22) was not touched this round — no web changes were
made.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above, including a logcat-level
  confirmation of both the bug (6484 skipped frames) and the fix (0 skipped
  frames on the identical repro).

## Verdict

One real, high-severity bug found and fixed this round (a near-ANR that
could easily be mistaken for an app crash by a real user). Restarting the
3-in-a-row clean-streak count at zero.
