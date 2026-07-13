import Link from "next/link";
import { N } from "@ummahlibrary/ui";
import type { Article } from "../../lib/blog/articles";
import { PostMeta } from "./PostMeta";
import { SeriesBadge } from "./SeriesBadge";
import { TagPill } from "./TagPill";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      style={{
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {article.series && <SeriesBadge series={article.series} size="sm" />}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: -0.3,
            lineHeight: 1.32,
            color: N.fg,
          }}
        >
          {article.title}
        </h3>
        <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.6, color: N.muted }}>
          {article.description}
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <PostMeta date={article.date!} mins={article.readingMinutes} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {article.tags.slice(0, 5).map((t) => (
          <TagPill key={t}>{t}</TagPill>
        ))}
      </div>
    </Link>
  );
}
