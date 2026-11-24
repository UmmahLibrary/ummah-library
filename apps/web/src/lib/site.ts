/**
 * The canonical public origin of the web app — the single source of truth for
 * every absolute URL we emit (metadataBase, sitemap, robots, OpenGraph URLs,
 * the OpenAPI server, and the share-image watermark).
 *
 * Override per environment with `NEXT_PUBLIC_SITE_URL` (e.g. a preview deploy);
 * defaults to production. `NEXT_PUBLIC_` is inlined at build time, so this is
 * safe to read from both server and client (canvas) code.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ummahlibrary.org";

/** Host without the scheme — for display (e.g. the share-image watermark). */
/**
 * The site-wide share image (`app/opengraph-image.tsx`). A page that sets its own
 * `openGraph`/`twitter` object replaces the inherited one wholesale — images
 * included — so those pages must list it again.
 */
export const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Ummah Library — open-source Quran reader & Islamic knowledge",
};

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
