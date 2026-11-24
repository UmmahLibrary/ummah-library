# Manual E2E QA — Round 72 (2026-11-24)

Iteration 4/100. Area: each page's `<title>`, description and canonical link,
read from the server HTML of 41 routes.

## Findings

### 1. The Prayer, Learn, Tools and More hubs had no title of their own — FIXED

- **Where:** `apps/web/src/app/{prayer,learn,tools,more}/layout.tsx` (new)
- **Symptom:** the tab, history entry and search snippet for these four pages read
  just "Ummah Library" with the generic site description — the same as Today.
- **Root cause:** the pages are client components (`"use client"`), which cannot
  export `metadata`, and no layout supplied it.
- **Fix:** a small server layout per hub exporting title, description and
  canonical.

### 2. Canonical/description missing on Juzʾ, Hifz, Hadith, For children and plan pages — FIXED

- **Where:** `juz/page.tsx`, `hifz/page.tsx`, `hadith/page.tsx`, `kids/page.tsx`,
  `plans/[id]/page.tsx`
- **Symptom:** no `<link rel="canonical">` (so `?collection=` deep links from
  round 69 would be indexed separately); Juzʾ, Hifz and plan pages used the
  generic description.
- **Fix:** added canonical + descriptions; plan pages use the template's own
  `desc`. The `custom` plan page (personal) stays without one.

**Regression test:** [`app/metadata.test.ts`](../../apps/web/src/app/metadata.test.ts)
— every public static page in the sitemap must define a title and a canonical
in its page or layout.

## Investigated, no bug found

Reader routes (`/surah`, `/juz/n`, `/page/n`, `/listen/n`) and the tool pages
already had specific titles, descriptions and canonicals.

## Verification

Live HTML re-checked for all ten changed routes. Tests, web `tsc`, ESLint clean.

## Verdict

Two real bugs, fixed.
