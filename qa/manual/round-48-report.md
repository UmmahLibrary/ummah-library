# Manual E2E QA — Round 48 (2026-11-23)

Juzʾ reader, Collections, Hadith, and — after round 37 found unlabelled goal
pills — an app-wide sweep for groups of selectable buttons that show their
selection only by colour.

## Findings

### 1. Four more choice groups didn't expose the selected option — FIXED

- **Where:** [HadithBrowser.tsx](../../apps/web/src/components/HadithBrowser.tsx)
  (book and grade filters), [SearchView.tsx](../../apps/web/src/components/SearchView.tsx)
  (All / Quran / Adhkār… filters), [HijriCalendar.tsx](../../apps/web/src/components/HijriCalendar.tsx)
  (−2…+2 date adjustment), [TasbihPageClient.tsx](../../apps/web/src/components/TasbihPageClient.tsx)
  (dhikr picker)
- **Symptom:** a DOM sweep of 17 pages for sibling button groups whose
  styling differs but that carry no `aria-pressed`/`-checked`/`-selected`
  found these four. A screen-reader user couldn't tell which filter, grade,
  adjustment or dhikr was active.
- **Fix:** `aria-pressed` (and `type="button"`) on each; the date adjustment
  group is also a labelled `role="group"` so "−1" has context.
- **Regression tests:** [HadithBrowser.test.tsx](../../apps/web/src/components/HadithBrowser.test.tsx),
  a new case in [TasbihPageClient.test.tsx](../../apps/web/src/components/TasbihPageClient.test.tsx).

### 2. Collections empty state pointed at a "☆ Save" button that doesn't exist on web — FIXED

- **Where:** [CollectionsView.tsx](../../apps/web/src/components/CollectionsView.tsx)
- **Symptom:** "tap ☆ Save under an āyah" — the web reader's button is a
  bookmark icon labelled "Save" (mobile does use ☆, so mobile is unchanged).
- **Fix:** the copy says "tap **Save** under an āyah".

## Investigated, no bug found

- Juzʾ 30 renders all 564 āyāt (78:1–114:6) with links to the juzʾ index and
  Juzʾ 29 only.
- Sweep found no unlabelled choice groups on Duas, Adhkār, Names, Zakat,
  Prayer Times, Tracker or Settings.

## Verification

- Web `tsc` clean; prettier clean; Hadith, Tasbih and Search tests pass.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
