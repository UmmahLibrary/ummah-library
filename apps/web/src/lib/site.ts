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
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
