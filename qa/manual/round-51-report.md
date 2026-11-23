# Manual E2E QA — Round 51 (2026-11-23)

Main journeys on the production build (`next start`): first run → read →
Today, Settings theme and language, plus a heading-structure check of the
served HTML.

## Findings

### 1. Most pages had no `<h1>` — FIXED

- **Where:** [NoorPageFrame.tsx](../../apps/web/src/components/NoorPageFrame.tsx)
  (shared frame of 23 pages), [SurahReaderClient.tsx](../../apps/web/src/components/SurahReaderClient.tsx),
  [ListenClient.tsx](../../apps/web/src/components/ListenClient.tsx),
  [KidsReader.tsx](../../apps/web/src/components/KidsReader.tsx)
- **Symptom:** served HTML had zero `<h1>` on Settings, Prayer Times, Hifz,
  Plans, Goals, Search, Tasbih, Profile, Zakat, Names and the other framed
  pages, and on the surah, Listen and Kids readers. Screen-reader users who
  jump to the page heading (or by level 1) found nothing; Settings started at
  nine `<h2>`s with no title above them.
- **Root cause:** the shared page frame rendered its title as `<h2>`; the
  readers' titles were plain `<div>`s.
- **Fix:** the frame title is an `<h1>` (no framed page has its own `h1`, so
  none gets two); the readers' surah titles are `<h1>` with the same styling.
- **Regression tests:** level-1 assertion in
  [NoorPageFrame.test.tsx](../../apps/web/src/components/NoorPageFrame.test.tsx)
  and [ReaderLandmarks.test.tsx](../../apps/web/src/components/ReaderLandmarks.test.tsx).

## Investigated, no bug found

- Production first run: "Skip, use these settings" closes setup and sets
  `ul.onboarded`; Today offers "Read Al-Fātiḥah"; reading to āyah 4 then
  returning shows "Continue reading · Āyah 4 of 7 · 1 of 4 pages · 1 of 7
  days"; no console errors.
- Settings (production): Sepia applies and is `aria-pressed`; Türkçe sets
  `lang="tr"` and the tab title "Ayarlar"; switching back restores English.

## Verification

- Web `tsc` clean; prettier clean; frame, landmark and Listen tests pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
