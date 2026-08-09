import type { Metadata } from "next";
import { N } from "@ummahlibrary/ui";
import { getPublishedArticles } from "../../lib/blog/articles";
import { BlogIndexClient } from "../../components/blog/BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Ideas, architecture write-ups, and lessons from building Ummah Library in the open.",
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    title: "Building Ummah Library",
    description:
      "Ideas, architecture write-ups, and lessons from building Ummah Library in the open.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const articles = getPublishedArticles();

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ marginBottom: 40, maxWidth: 680 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: N.gold,
            marginBottom: 12,
          }}
        >
          Blog
        </div>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: -0.9,
            lineHeight: 1.1,
            color: N.fg,
          }}
        >
          Building Ummah Library
        </h1>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, color: N.muted }}>
          Ideas, architecture write-ups, and lessons from building Ummah Library in the open.
        </p>
      </div>
      <BlogIndexClient articles={articles} />
    </div>
  );
}
