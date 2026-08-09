# ADR 0037 — Engineering blog: Markdown at build time, gated by frontmatter

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Issue #226 asks for a real, ongoing engineering blog at `/blog` — architecture
write-ups and open-source recruitment content, growing indefinitely as new
posts are written, not a fixed series. A Noor-styled design prototype for it
was vendored at `docs/design/noor-prototype-blog` (#227): a standalone React
mockup with its own hand-written JS data (`blog/blogdata.js`) using a typed
block shape (`{type: "p" | "h2" | "ul" | "table" | "code" | "diagram" | ...}`).

The real content is **Markdown**, written one article at a time in
`docs/articles/*.md` as the project grows — not hand-authored JS block arrays.
Something has to turn Markdown into that block shape, and something has to
decide which articles are public.

## Decision

**1. A build-time Markdown → block pipeline, not a runtime one.**
`apps/web/src/lib/blog/parse-markdown.ts` parses an article's Markdown body
with `unified` + `remark-parse` + `remark-gfm` (tables) + `remark-directive`
(the inline Arabic-term syntax below) into the design's `Block[]` shape
(`apps/web/src/lib/blog/blocks.ts`). This runs once per article at build time,
inside `generateStaticParams`/page rendering — never at request time, matching
the static-first stance (ADR 0003). No port is added for this: it's a build
step with one clear implementation and nothing to swap (see AGENTS.md, "when
not to add a port"), the same reasoning that keeps ADR generation and other
build-time-only Markdown reads unwrapped.

**Inline Arabic terms** use a small `remark-directive` syntax rather than a
bespoke regex: `:ar[قِبْلَة]{translit=qibla}` parses as a `textDirective` node
and renders as the design's `ArTerm` (Arabic + parenthetical transliteration).
**Mermaid diagrams** are an ordinary fenced code block tagged `mermaid`; an
optional `caption="..."` in the fence's meta string is threaded through to the
`DiagramFrame` chrome. A blockquote's optional citation is its own last
paragraph, prefixed with an em dash (`— Citation`) — stripped from the quoted
text and rendered as the design's small-caps attribution line. All three
conventions are documented for contributors in `docs/articles/README.md`.

**2. Frontmatter gates visibility — the actual "hide an article" mechanism.**
Every article's frontmatter carries `title, description, tags, series, order,
date, canonical_url, status` (`status: "draft" | "published"`). An article is
**published** — and only then reachable — iff it has **both** a real `date`
**and** `status: "published"` (`isPublished` in `articles.ts`). This is not
just a filter on the index: `/blog/[slug]/page.tsx` sets
`generateStaticParams` to the published slugs only and `dynamicParams = false`,
so Next.js never builds a page — and 404s any request — for a draft slug, even
a guessed one. A draft with a `date` but `status: "draft"` (or vice versa)
stays hidden; both conditions are required. The same `getPublishedArticles()`
feeds the index, the RSS feed, and `sitemap.ts`, so there is exactly one
gating rule enforced in exactly one place.

Frontmatter is validated at build time (`parseArticleFile` in `articles.ts`):
a missing/malformed required field, or two articles sharing a
`canonical_url`, throws with a file-specific message rather than silently
producing a broken or ambiguous page — matching the "fails loudly" preference
elsewhere in the codebase (e.g. the module-boundary lint rule).

**3. The blog is a fully shell-excluded, standalone editorial surface.**
`/blog` is added to `AppShellWrapper`'s `SHELL_EXCLUDED` list (joining
`/landing` and `/surah`) — no app sidebar/tool nav. `apps/web/src/app/blog/layout.tsx`
wraps the index and article routes in the design's own slim header/footer and
loads the editorial serif face (`Source Serif 4`, via `next/font/google`,
scoped to this layout only) alongside the app's existing Hanken
Grotesk/IBM Plex Arabic. Blog-specific prose/editorial components
(`ArticleBody`, `CodeBlock`, `DiagramFrame`, `ArticleTOC`, `SeriesNav`,
`ContributeCallout`, `ScrollProgress`, etc.) live under
`apps/web/src/components/blog/` rather than `packages/ui` — the blog is
web-only (no mobile reader planned) and these aren't cross-platform Noor
primitives (ADR 0023 reserves `packages/ui` for those). They do reuse the
existing `Btn`, `Icon`, `Logo`, `Khatam`, and `N` tokens from `packages/ui`, and
inherit the site-wide Noor theme automatically via the existing
`[data-theme]` CSS variables — no separate theme toggle is added.

**4. Pagination is static-data + client-side state, not infinite scroll.**
The index page (`app/blog/page.tsx`, a server component) calls
`getPublishedArticles()` once at build time and hands the full array to
`BlogIndexClient`, a small client component holding only UI state (active
series/tag filter, how many cards are shown so far, "Load more" appends a
page). No dynamic data fetching, matching the static-first philosophy
(ADR 0003) — the entire post list is already in the page's static payload.

**5. `series` stays optional, per-post metadata — never a fixed set.**
A post with `series: null` is a first-class standalone post, not a fallback
case. Prev/next navigation (`getSeriesNeighbors`) only ever looks within the
same series, ordered by date; a missing neighbor (or no series at all) simply
renders nothing on that side — never a placeholder or dead link.

## Consequences

- **Zero new runtime surface.** Everything blog-related is `force-static`
  (`[slug]/page.tsx`, `blog/page.tsx`, `blog/rss.xml/route.ts`) — republishing
  an article is a commit + rebuild, not a database write. No entry is needed
  in `next.config.mjs`'s `outputFileTracingIncludes` since nothing reads
  `docs/articles` at request time.
- **New dependencies:** `gray-matter` (frontmatter), `unified` + `remark-parse`
  - `remark-gfm` + `remark-directive` + `mdast-util-to-string` (Markdown →
    blocks), `mermaid` (client-side diagram rendering only, dynamically
    imported so it never runs during the server/static render pass).
- **Mermaid is best-effort at render time.** If `mermaid.render()` throws (a
  malformed diagram), `DiagramFrame` shows a fallback frame instead of crashing
  the article — it never blocks a build, since rendering happens client-side
  after hydration, not during static generation.
- **This ADR does not ship any of the 12 planned articles.** `docs/articles/`
  starts empty except for `README.md` (the frontmatter schema for
  contributors); the index and feed both handle zero published articles
  cleanly ("No posts yet"). Articles are added one at a time as separate,
  reviewable commits — each one is exactly the "publish gating" flip described
  in #226.
