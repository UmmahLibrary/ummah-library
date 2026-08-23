# Manual E2E QA — Round 27 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round set out to test the unified Search screen (verses/names/adhkār) and
found it had no way to be reached at all.

## Findings

### 1. The full-text Search screen was completely unreachable from the UI - FIXED

- **Where:** [apps/mobile/src/navigation/ReadStack.tsx:36](../../apps/mobile/src/navigation/ReadStack.tsx#L36),
  fixed in [apps/mobile/src/screens/SurahListScreen.tsx](../../apps/mobile/src/screens/SurahListScreen.tsx)
- **Symptom:** `SearchScreen` — a fully-built feature with a unified index
  over Qur'ān verses (Arabic + English), the 99 Names, and Adhkār, complete
  with search history, topic-suggestion chips ("mercy", "patience", "Mulk",
  "forgiveness", "knowledge", "guidance", "light"), type filters, and
  highlighted matches — is registered as the `"Search"` route on the Read
  stack, but **nothing in the app ever calls `navigation.navigate("Search")`**.
  Confirmed by grepping the entire `apps/mobile/src` tree for any call
  site: none exists, on any screen, tab, icon, or menu. A user could never
  discover or open this screen through the UI, no matter how they explored
  the app — it was fully dead code from a navigation standpoint despite
  being functionally complete.
- **Root cause:** the screen and its route were built and wired into
  `ReadStack`'s navigator, but the entry-point UI element (a button/icon
  somewhere that calls `navigate("Search")`) was never added.
- **Fix:** Added a search icon button next to the "Qur'ān" title on the
  Read tab's landing screen (`SurahListScreen`, the one screen every user
  passes through to browse the Qur'ān) that calls
  `navigation.navigate("Search")`. Placed there specifically because that
  screen already has its own smaller "Search surah, juz or verse" reference
  lookup immediately below it — the two are visually adjacent so a user
  who wants to search verse *content* (not just jump to a known
  surah/juzʾ) has an obvious next place to look, distinct from the local
  filter box.
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on the native build: the search icon now appears next to
  "Qur'ān"; tapping it opens the Search screen with topic chips and a
  "Building search index…" indicator; tapping the "mercy" topic chip
  returned "60 results for 'mercy'" with highlighted matches across
  verses (e.g. Al-Baqara 2:64, 2:105, 2:157); tapping a result correctly
  navigated to that verse's sūrah in the reader.
- **Regression test:** None added — no test harness exists for mobile
  screen/navigation components in this repo (confirmed in round 23); the
  live re-verification above is the practical check available.

## Investigated, no bug found

- **Search screen's own mechanics**, once reachable: index building,
  topic-chip shortcuts, result highlighting, type badges ("Verse"), and
  result-tap navigation all worked correctly on first real use.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.

## Verdict

One real, significant bug found and fixed this round (a fully-built search
feature that no user could ever reach). Restarting the 3-in-a-row
clean-streak count at zero.
