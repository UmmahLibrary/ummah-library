import { getPublishedArticles } from "../../../lib/blog/articles";
import { buildRssFeed } from "../../../lib/blog/feed";
import { SITE_URL } from "../../../lib/site";

// Prerendered at build time, like every other content route (ADR 0003) —
// republishing an article means a rebuild, not a runtime request.
export const dynamic = "force-static";

export function GET() {
  const xml = buildRssFeed(getPublishedArticles(), SITE_URL);
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
