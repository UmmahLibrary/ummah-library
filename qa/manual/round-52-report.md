# Manual E2E QA — Round 52 (2026-11-23)

Re-checked round 51 on a fresh production build: one `<h1>` per page across
33 routes, plus a visual check that the new headings look unchanged.

## Findings

### 1. Juzʾ reader, Mushaf page view and the 404 page still had no `<h1>` — FIXED

- **Where:** [juz/[number]/page.tsx](../../apps/web/src/app/juz/[number]/page.tsx),
  [page/[number]/page.tsx](../../apps/web/src/app/page/[number]/page.tsx),
  [not-found.tsx](../../apps/web/src/app/not-found.tsx), [globals.css](../../apps/web/src/app/globals.css)
- **Symptom:** of 33 production routes checked, `/juz/1` and `/page/1` had no
  `<h1>`; the not-found page shares their header markup.
- **Root cause:** these use the older `.reader-head` header with a `<div
class="name-en">` title, not the page frame fixed in round 51.
- **Fix:** the title is an `<h1 class="name-en">` (margin reset in CSS so the
  look is unchanged).

## Investigated, no bug found

- All other 31 routes have exactly one `<h1>`.
- Hifz on the production build: the frame title renders exactly as before
  (same size, weight and spacing) now that it's an `<h1>`.

## Verification

- Web `tsc` clean; changed files formatted (the Mushaf page file has a
  pre-existing indentation difference from Prettier on `main`, left alone to
  keep the diff minimal).

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
