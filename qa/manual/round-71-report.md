# Manual E2E QA — Round 71 (2026-11-24)

Iteration 3/100. Area: what search engines and installers see — `robots.txt`,
`sitemap.xml`, the web manifest, and a status sweep of every 15th sitemap URL.

## Findings

### 1. The sitemap left out the pages added by the five-places redesign — FIXED

- **Where:** [`app/sitemap.ts`](../../apps/web/src/app/sitemap.ts)
- **Symptom:** `sitemap.xml` (766 URLs) had none of `/quran`, `/prayer`,
  `/learn`, `/tools`, `/tafsir`, `/duas`, `/plans`, the plan pages,
  `/ramadan`, `/kids`, `/privacy`.
- **Root cause:** a hand-kept list that nothing checked against the app's routes.
- **Fix:** added them (plus one entry per reading-plan template). 782 URLs now.
- **Regression test:** [`app/sitemap.test.ts`](../../apps/web/src/app/sitemap.test.ts)
  walks `src/app` and fails if a static page is neither in the sitemap nor in a
  short list of personal pages (bookmarks, profile, tracker, downloads, offline,
  more, hifz review). It fails on the old sitemap.

## Investigated, no bug found

- `robots.txt` allows all and points at the sitemap; the manifest has 192/512/
  maskable icons, standalone display and scope `/`. 51 sampled sitemap URLs: all 200.

## Verification

Sitemap tests pass; web `tsc`, ESLint clean; dev `sitemap.xml` now 782 URLs.

## Verdict

One real bug, fixed.
