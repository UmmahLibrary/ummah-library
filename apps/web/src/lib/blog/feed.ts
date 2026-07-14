/** Builds the blog's RSS 2.0 feed XML from published articles (build-time only). */
import type { Article } from "./articles";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

export function buildRssFeed(published: readonly Article[], siteUrl: string): string {
  const items = published
    .map((a) => {
      const url = `${siteUrl}/blog/${a.slug}`;
      return [
        "<item>",
        `<title>${escapeXml(a.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid>${escapeXml(url)}</guid>`,
        `<pubDate>${rfc822(a.date!)}</pubDate>`,
        `<description>${escapeXml(a.description)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const latest = published[0]?.date;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0"><channel>' +
    "<title>Building Ummah Library</title>" +
    `<link>${escapeXml(`${siteUrl}/blog`)}</link>` +
    "<description>Ideas, architecture write-ups, and lessons from building Ummah Library in the open.</description>" +
    (latest ? `<lastBuildDate>${rfc822(latest)}</lastBuildDate>` : "") +
    items +
    "</channel></rss>"
  );
}
