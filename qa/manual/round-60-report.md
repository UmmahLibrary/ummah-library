# Manual E2E QA — Round 60 (2026-11-23)

A stricter phone-width sweep on the production build: on 30 pages (18 in
English, 12 in Arabic) at 375px, any button, link or field whose box crosses
the screen edge — even when an ancestor clips it — unless it sits inside a
horizontal scroller.

## Findings

### 1. Search's Clear button was half off-screen in Arabic on phones — FIXED

- **Where:** [SearchView.tsx](../../apps/web/src/components/SearchView.tsx),
  and the same pattern in [HadithBrowser.tsx](../../apps/web/src/components/HadithBrowser.tsx)
- **Symptom:** `/search?q=mercy` in Arabic at 375px: "Clear search" at
  −9…9px.
- **Root cause:** the search input is `flex: 1` without `min-width: 0`, so it
  can't shrink below its intrinsic width (307px here) and pushes the Clear
  button past the edge.
- **Fix:** `minWidth: 0` on both search inputs.
- **Verification:** applying the style on the live page moves Clear to
  45–63px.
- **Regression test:** "lets the search box shrink…" in
  [SearchView.test.tsx](../../apps/web/src/components/SearchView.test.tsx).

## Investigated, no bug found

- All other pages clean in both languages: Today, Quran, Al-Baqara, Settings,
  Plans, Goals, Hifz, Prayer Times, Tracker, Zakat, Calendar, Tasbih, Hadith,
  Names, Listen, Kids reader (English); Today, Quran, Al-Baqara, Settings,
  Plans, Goals, Hifz, Prayer Times, Listen, Kids reader, Zakat (Arabic).

## Verification

- Web `tsc` clean; prettier clean; Search and Hadith tests pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
