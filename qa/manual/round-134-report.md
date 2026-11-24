# Manual E2E QA — Round 134 (2026-11-24)

Iteration 66/100. Area: language tagging — `<html lang>` and the language of the
Quran text in the Urdu interface.

## Findings

### 1. The reader's Quran text wasn't marked as Arabic — FIXED

- **Where:** [`SurahReaderClient.tsx`](../../apps/web/src/components/SurahReaderClient.tsx)
  (verse, reading and muṣḥaf modes, both basmalas), `app/juz/[number]/page.tsx`,
  `app/page/[number]/page.tsx`, surah names in `SurahIndex.tsx`, `juz/page.tsx`,
  the 404 numerals, `HifzReview.tsx`, `WordByWord.tsx`.
- **Symptom:** in the Urdu interface `<html lang="ur">`, and `.ayah-ar` had no
  `lang` of its own, so the Quran inherited **ur** — screen readers voiced the
  Arabic with an Urdu voice, and language-aware text features treated it as
  Urdu (WCAG 3.1.2). The Kids, Listen and Tafsir views already set `lang="ar"`.
- **Fix:** `lang="ar" dir="rtl"` on every element that renders Arabic with the
  `.arabic` class.
- **Verification:** live in Urdu: html `ur`, Quran text resolves to `ar`, the
  translation keeps its own `lang`.
- **Regression test:** new `components/arabic-lang.test.ts` — every JSX element
  whose class includes `arabic` must carry `lang` (it lists the four reader
  lines on the old code).

## Verification

All 59 component test files pass; `tsc`, ESLint clean.

## Verdict

One real accessibility/i18n bug, fixed across the readers.
