# Manual E2E QA — Round 53 (2026-11-23)

Automated accessibility sweep of 36 production pages: controls without an
accessible name, inputs without a label, images without `alt`, duplicate
`id`s.

## Findings

### 1. Zakat calculator fields had no programmatic labels — FIXED

- **Where:** [ZakatCalculator.tsx](../../apps/web/src/components/ZakatCalculator.tsx)
- **Symptom:** the sweep flagged every Zakat input: a screen reader announced
  "e.g. 75", "e.g. 0.85", "$" or "0" — the placeholder — instead of "Gold /
  gram", "Silver / gram", "Currency" or the asset name shown above each one.
- **Root cause:** the shared `Field` rendered its label as a `<span>` next to
  the input, with no association.
- **Fix:** a `<label htmlFor>` tied to the input with `useId`, and the hint
  linked via `aria-describedby`.
- **Regression test:** "every amount field is reachable by its visible label"
  in [ZakatCalculator.test.tsx](../../apps/web/src/components/ZakatCalculator.test.tsx).

## Investigated, no bug found

- No unnamed controls, unlabelled inputs, `alt`-less images or duplicate ids
  on: Today, Settings, Search, Plans, the surah reader, Listen, Kids, Goals,
  Prayer Times, Tracker, Calendar, Hadith, Names, Duas, Adhkār, Tasbih, Qibla,
  Ramadan, Profile, Bookmarks, More, Learn, Tools, Downloads, Collections,
  Tafsir, Juzʾ index, Mosques, Hifz review, Blog.
- Settings' file input is `hidden` and opened by the labelled "Import a
  backup" button — a sweep false positive.

## Verification

- Web `tsc` clean; prettier clean; Zakat tests (4) pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
