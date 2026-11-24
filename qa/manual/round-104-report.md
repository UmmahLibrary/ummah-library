# Manual E2E QA — Round 104 (2026-11-24)

Iteration 36/100. Area: the Search and Hadith pages in the Arabic interface
(`ul.locale = ar`).

## Findings

None fixed this round — see the scope note.

## Scope note (not a regression; for the roadmap)

With Arabic selected the shell, `<title>` ("البحث", "الحديث") and direction are
Arabic, but the page bodies of Search, Hadith, Duʿās, Tafsir, Zakat, Hijri
calendar, Downloads, 99 Names, Adhkār and Tasbih are English: 63 of 92 web
components never call `useT`/`useIntl`. PR #293 localised the shell, reader,
Today, Settings and the progress screens; these tool pages were outside that
pass. Translating them is a content project (six languages, native review), not
a QA fix — recorded so it isn't mistaken for a regression later.

## Investigated, no bug found

Round 81's "Go to Al-Baqara 2:255" result renders under RTL without layout
breakage; `dir="rtl"` set before paint.

## Verification

No code changes. Locale reset to `en`.

## Verdict

Clean (scope gap recorded).
