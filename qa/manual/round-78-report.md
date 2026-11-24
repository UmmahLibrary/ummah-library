# Manual E2E QA — Round 78 (2026-11-24)

Iteration 10/100. Area: links and share previews — every internal link on the
hubs and blog (171 URLs, all 200), then the OpenGraph/Twitter tags a chat app or
social network reads when a page is shared.

## Findings

### 1. Shared links to most pages announced, and pointed to, the home page — FIXED

- **Where:** [`app/layout.tsx`](../../apps/web/src/app/layout.tsx), [`app/page.tsx`](../../apps/web/src/app/page.tsx)
- **Symptom:** `/hadith`, `/names`, `/settings`, `/prayer` … carried
  `og:url="https://ummahlibrary.org"` and the site's own og:title. Facebook and
  LinkedIn treat `og:url` as the canonical object, so sharing `/names` showed
  (and counted as) the home page.
- **Root cause:** the root layout's `openGraph`/`twitter` set `url`, `title` and
  `description`, which every page without its own `openGraph` inherits.
- **Fix:** the layout keeps only site-wide fields (type, siteName, locale,
  card); the home page sets its own share title/description/url. Next now fills
  og:title from each page's `<title>` ("99 Names of Allah · Ummah Library").

### 2. Surah, juzʾ, mushaf-page and blog shares had no image — FIXED

- **Where:** `surah/[number]`, `juz/[number]`, `page/[number]`, `blog`, `blog/[slug]`
- **Symptom:** no `og:image` / `twitter:image` on exactly the pages people share most.
- **Root cause:** a page's own `openGraph` replaces the inherited one wholesale,
  dropping the file-based `opengraph-image`.
- **Fix:** `SHARE_IMAGE` in [`lib/site.ts`](../../apps/web/src/lib/site.ts),
  listed by each of those pages.

**Regression tests:** [`app/metadata.test.ts`](../../apps/web/src/app/metadata.test.ts)
"share previews" — no url/title in the root openGraph; any page with its own
openGraph lists `SHARE_IMAGE`. Both fail on the old code.

## Investigated, no bug found

171 internal links from hubs, Settings, Privacy and the blog: all 200. Blog
post: one h1, images have alt, RSS linked and 200.

## Verification

Live HTML for 8 routes: correct og:url, og:title, og:image, twitter:image.
Tests, `tsc`, ESLint clean.

## Verdict

Two real bugs, fixed.
