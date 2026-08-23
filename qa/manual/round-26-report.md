# Manual E2E QA — Round 26 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Qur'ān index screen's search box (Surah/Juzʾ/Revelation
tabs) and Reading Plans' remaining actions.

## Findings

### 1. The Qur'ān index search box promises "surah, juz or verse" but the Juzʾ tab ignored the query entirely - FIXED

- **Where:** [apps/mobile/src/screens/SurahListScreen.tsx:116-135](../../apps/mobile/src/screens/SurahListScreen.tsx#L116-L135)
- **Symptom:** The search field's placeholder reads "Search surah, juz or
  verse". Typing a query and switching to the **Surah** tab filters
  correctly (name/number match); switching to **Revelation** also filters
  correctly (it reuses the same filtered surah list, grouped by
  Meccan/Medinan). But switching to the **Juzʾ** tab with any query typed —
  a number like "15" or a surah name like "baqa" — showed all 30 juzʾ,
  completely unfiltered, silently ignoring what the user had typed.
- **Root cause:** `rows`'s `tab === "juz"` branch was hardcoded to
  `Array.from({ length: TOTAL_JUZ }, ...)`, never reading `filtered` or the
  query at all — the only one of the three tabs that didn't.
- **Fix:** When a query is present, a juzʾ now matches if its own number
  starts with the query (mirroring how a surah matches by number) or if it
  spans a surah that matches the text query (via the same folded
  name-matching used for the Surah/Revelation tabs) — so searching "15"
  surfaces Juzʾ 15 (and Juzʾ 14, which also touches Sūrah 15/Al-Ḥijr) and
  searching "baqa" surfaces Juzʾ 1–3 (all of which touch Al-Baqarah). Also
  fixed the empty-state message, which was hardcoded to "No surahs match…"
  even on the Juzʾ tab — it now says "No juzʾ match…" there.
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification: reproduced the bug first (typed "15", switched to Juzʾ,
  saw all 30 unfiltered), then re-tested after the fix — Juzʾ tab now shows
  only Juzʾ 14 and 15; typing "baqa" instead shows Juzʾ 1, 2, 3.
- **Regression test:** None added — no test harness exists for mobile
  screen components in this repo (confirmed in round 23); the live
  re-verification above is the practical check available.

## Investigated, no bug found

- **Surah-tab and Revelation-tab search:** both correctly filter by folded
  surah name (diacritic/hamza-insensitive) and by numeric prefix; confirmed
  "baqa" → Al-Baqara and "15" → Al-Hijr (Revelation tab) both worked
  correctly before this round's fix, establishing the Juzʾ tab was the
  outlier.
- **Search result navigation:** tapping a filtered Surah-tab result
  correctly navigates to that sūrah's reader. (Two of my own taps missed
  the row during this check — a `uiautomator dump`-confirmed coordinate
  miss on my end, not an app bug — the row is a normal `Pressable` that
  worked once tapped correctly.)
- **Reading Plans "Details" screen** (carried over from round 25): the
  reminder time picker (native `TimePickerDialog`) opens and cancels
  correctly without altering the stored time.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.

## Verdict

One real bug found and fixed this round (search box silently not honoring
its own "juz" promise on one of its three tabs). Restarting the 3-in-a-row
clean-streak count at zero.
