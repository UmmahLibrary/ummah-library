# Manual E2E QA — Round 19 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator (the user
launched the app fresh for this session; round 17-18 established the native
build/adb workflow). This round covered the Hifz (memorization) feature
end-to-end — dashboard, adding an āyah from the reader, the spaced-repetition
review flow, and post-review dashboard consistency — plus a resolution of
round 18's blocked Nearby Mosques item.

## Findings

### 1. Hifz dashboard's "Review queue" and "Needs attention" go stale immediately after completing a review - FIXED

- **Where:** [apps/mobile/src/screens/HifzDashboardScreen.tsx:55-87](../../apps/mobile/src/screens/HifzDashboardScreen.tsx#L55-L87)
- **Symptom:** Mark an āyah for Ḥifẓ (star icon in the reader's Verse view),
  then from the Memorize tab's dashboard tap "Start review", reveal the āyah,
  and rate it (Again/Hard/Good/Easy). Tapping "Back to dashboard" returns to
  the *same* dashboard screen instance showing **"Due today: 0"** (correct)
  right next to a **"Review queue"** card still reading **"Al-Faatiha · 1
  due"** (stale) — two widgets on the same screen disagreeing about whether
  there's anything left to review. A "Needs attention" section also appears
  using the same stale per-surah data. The inconsistency only clears if the
  screen remounts (tab switch away-and-back does *not* remount it, since
  `RootTabs` uses `lazy: false` per round 17's fix; only a full app
  relaunch, or another add/remove of a tracked āyah, forced a fresh render).
- **Root cause:** The `queue` and `weak` (Needs Attention) `useMemo` hooks
  depended on `[surahs, trackedCount]`, where `trackedCount =
  Object.keys(hifz).length` from `LibraryContext`. Rating a review card calls
  `setHifzCard(ref, updatedCard)`, which replaces the value for an
  **existing** key — the number of keys doesn't change, so `trackedCount`
  stays numerically identical before and after a review, and the memo never
  recomputes. The top-level "Due today" stat is unaffected because it's
  computed directly in the render body (`dueRecords(now).length`), not
  memoized — so it alone updates, producing the mismatch. The inline comment
  above the memo ("trackedCount changes whenever the hifz store mutates")
  was the mistaken assumption baked into the bug: true for add/remove, false
  for a review rating.
- **Fix:** Depend on `allRecords` (the `useCallback` from `LibraryContext`,
  which has `[hifz]` as its own dependency and so gets a new identity on
  *every* `hifz` mutation, including a rating update) instead of
  `trackedCount`, for both the `queue` and `weak` memos. Removed the
  now-stale comment and the `eslint-disable-next-line` that was masking a
  different exhaustive-deps warning on the `weak` memo (unrelated —
  regarding `now` — which is a pre-existing, harmless pattern shared with
  the file's heatmap memos).
- **Verification:** `pnpm lint` (0 errors; the 4 pre-existing `now`-related
  `react-hooks/exhaustive-deps` warnings are unchanged), `pnpm typecheck`
  (clean), `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on the native build: repeated the exact repro (mark Al-
  Faatiha āyah 2 for Ḥifẓ, review it, rate "Good", tap "Back to dashboard"
  without navigating away) — "Due today" and the "Review queue" card now
  agree immediately (both show 0 due / "Tomorrow"), with no app relaunch
  needed.
- **Regression test:** None added. Mobile screens have no component-test
  harness in this repo (established in round 17/18) and the underlying pure
  logic (`surahProgressMap`, `weakestSurahs` in `packages/core`) was already
  correct and tested — the bug was purely in this screen's React memoization,
  which isn't unit-testable without introducing new test infrastructure
  beyond this fix's scope. Verified live only, per the same constraint noted
  in prior native-testing rounds.

## Investigated, no bug found

- **Hifz end-to-end flow, otherwise:** marking/unmarking an āyah from the
  reader's Verse view (star icon), the dashboard's empty state, "Start
  review" → "Reveal āyah" → rating → "All caught up!" completion screen, and
  the review-activity heatmap/streak counters all worked correctly and
  matched expectations on native.
- **Nearby Mosques — resolves round 18's blocked item:** unlike round 18
  (where `adb emu geo fix` had no effect on this Play-Store AVD's fused
  location provider, leaving it stuck at the emulator's default boot
  coordinates), this round's attempt against that same frozen location
  (21.42, 39.83 — right at the Kaaba) returned live, real results from the
  Overpass/OSM-backed API: a correctly distance-sorted list of nearby
  mosques starting with "الكعبة · 3 m". The "Directions" button on a result
  correctly opens Google Maps (confirmed via logcat's package-role handoff
  to `com.google.android.apps.maps` and Maps' own location-permission
  dialog appearing with the right destination coordinates pre-filled) — round
  18 hadn't been able to test this because the list was empty. No app bug
  in either round; round 18's "No mosques found" was a correct rendering of
  a real (if untestably fixed) location.
- **Reading Goals screen:** loads correctly with today's progress ring,
  streak, weekly bar chart, and daily-goal selector all rendering sensibly
  against pre-existing local state from earlier in this native session.

## Verification

- `pnpm lint` — 0 errors (4 pre-existing warnings in the touched file,
  unrelated to this round's fix; consistent with prior rounds' "12
  pre-existing warnings" baseline for the repo as a whole).
- `pnpm typecheck` — 8/8 workspace packages clean.
- `pnpm --filter @ummahlibrary/mobile test` — 105/105 passed.
- Live re-verification against the native `org.ummahlibrary.app` build on
  the `QA_Pixel6` emulator, via `adb`, as detailed above.

## Verdict

One real bug found and fixed this round — a cross-widget staleness bug in
the Hifz dashboard that only surfaces on the native review flow (completing
a review and returning to the same screen instance without a remount).
Restarting the 3-in-a-row clean-streak count at zero.
