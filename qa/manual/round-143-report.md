# Manual E2E QA — Round 143 (2026-11-24)

Iteration 75/100. Area: completeness of the translations — every bundled
edition checked āyah by āyah against the 6,236-āyah Arabic text, then the
reader with the gap.

## Findings

### 1. A translation's missing text showed as nothing at all — FIXED (web + mobile)

- **Data (not edited):** the bundled `urd-tahirulqadri` (Irfan-ul-Quran) and the
  runtime catalogue's `urd-muhammadtahirul` have **empty text for all 206 āyāt
  of Al-Aʿrāf and all 11 of Al-ʿĀdiyāt** — a gap in the upstream source. The
  other five bundled editions are complete (6,236/6,236, none empty).
- **Where:** [`AyahTranslations.tsx`](../../apps/web/src/components/AyahTranslations.tsx),
  [`ReadingTranslationFlow.tsx`](../../apps/web/src/components/ReadingTranslationFlow.tsx),
  mobile [`AyahView.tsx`](../../apps/mobile/src/components/AyahView.tsx)
- **Symptom:** with that edition chosen, Al-Aʿrāf showed Arabic only on web (the
  empty line was filtered out) and an edition label over a blank on mobile — no
  hint why.
- **Fix:** an edition that loaded but is blank for an āyah now says "Muhammad
  Tahir Ul Qadri has no translation for this āyah." (Reading mode: "…for this
  surah."); an edition that *failed to load* is still skipped silently. New
  strings in six languages on web (`tr.missingAyah`, `tr.missingSurah`) and
  mobile (`rd.trMissing`).
- **Verification:** live on `/surah/7` with `urd-muhammadtahirul`.
- **Regression test:** new `AyahTranslations.test.tsx` (blank → note; failed load → skipped).
- **Follow-up for the data owner:** report the gap upstream (fawazahmed0
  quran-api, `urd-muhammadtahirul` surahs 7 and 100) or re-source the edition.

## Verification

Tests 2/2; web + mobile `tsc` clean; mobile 204/204; ESLint clean.

## Verdict

One real bug, fixed on both apps; one upstream data gap recorded.
