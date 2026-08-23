# Manual E2E QA — Round 24 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the remaining "More" menu screens: Bookmarks, 99 Names, Your
Journey, and Privacy.

## Findings

None this round.

## Investigated, no bug found

- **Bookmarks:** "+ New" creates an empty collection correctly; "Open in
  reader" on a saved āyah navigates to the correct sūrah/āyah on the Read
  tab; removing a single saved āyah (✕) and deleting a whole collection
  (with its "Delete collection" confirmation dialog) both work correctly.
  One methodology note: a screenshot taken exactly 1s after confirming a
  collection delete showed the stale (pre-delete) list — re-checking via a
  fresh `uiautomator dump` a moment later confirmed the deletion had in
  fact succeeded; this was an `adb screencap` timing artifact, not an app
  bug.
- **99 Names:** all 99 entries render correctly with Arabic, transliteration,
  and meaning; the "learned" highlight state (gold border) matches the
  "X of 99 learned" counter; scrolled through the full list checking logcat
  for the frame-skip pattern found in round 23's Tafsir bug — none seen,
  confirming this screen (a fixed 99-item list, not hundreds of paragraphs
  per item) doesn't hit the same threshold even though it also uses a plain
  `ScrollView`.
- **Your Journey:** streak/stat counters (Hifz streak, āyāt memorized,
  sūrahs started, prayer streak, names learned, saved verses) all matched
  the actual state from prior rounds' testing activity. The 13-achievement
  grid's unlocked count (2/13) matched the two cards actually showing
  "Unlocked". A "2 new badges unlocked!" toast appeared on first open;
  re-entering the screen afterward did **not** re-show the toast, confirming
  the "seen" state persists correctly rather than re-firing on every visit.
- **Privacy:** static policy text renders correctly and reads accurately
  against the app's actual behavior (local-first storage, on-permission
  location use for Prayer Times/Qibla, content fetched from the API) —
  cross-checked against what round 22/23 already established about how
  those features actually work.
- **Hadith** (carried over from round 23's investigation) — no further
  testing this round.

## Verification

No code changes this round — investigation only, no fix needed.

## Verdict

No bugs found this round. Clean-streak: 1/3 (round 23 found a bug, so
rounds 24, 25, 26 must all be clean to reach the 3-in-a-row stop
condition).
