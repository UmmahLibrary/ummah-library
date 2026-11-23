# Manual E2E QA — Round 44 (2026-11-23)

The smaller tools and data paths not yet touched in this loop: Tasbih, a
runtime-error sweep of every remaining page, and backup coverage of the
settings added in PR #293.

## Findings

None this round.

## Investigated, no bug found

- **Tasbih:** the dial is a focusable `role="button"` named "Count — n of
  33"; Enter and Space count; 2 key presses + 40 taps → "1 cycle complete,
  9 of 33, 42 total today".
- **Runtime errors:** loaded `/names`, `/duas`, `/adhkar`, `/hadith`,
  `/calendar`, `/zakat`, `/downloads`, `/collections`, `/tafsir`, `/juz`,
  `/learn`, `/more`, `/tools`, `/mosques`, `/offline`, `/privacy`, `/goals`,
  `/plans`, `/profile` with `error`, `unhandledrejection` and `console.error`
  hooked — none fired.
- **Backup coverage:** `collectLocalData` exports every `ul.*` key, so the new
  comfort settings, interface language, reading path, plan reminder and
  setup state are all included in an export and restored on import.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 1/3.
