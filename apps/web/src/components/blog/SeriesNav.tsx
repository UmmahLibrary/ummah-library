import Link from "next/link";
import { Icon, N } from "@ummahlibrary/ui";
import type { Article } from "../../lib/blog/articles";

const cardStyle = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
  flex: 1,
  padding: 16,
  display: "flex" as const,
  flexDirection: "column" as const,
  gap: 6,
  textDecoration: "none",
  color: "inherit",
};

/**
 * prev/next are each either an article or null — a missing neighbor renders no
 * control at all (no dead link, no placeholder). If neither exists, only the
 * "back to all posts" link shows.
 */
export function SeriesNav({ prev, next }: { prev: Article | null; next: Article | null }) {
  return (
    <div style={{ margin: "8px 0 40px", display: "flex", flexDirection: "column", gap: 14 }}>
      {(prev || next) && (
        <div style={{ display: "flex", gap: 14 }}>
          {prev && (
            <Link href={`/blog/${prev.slug}`} style={{ ...cardStyle, textAlign: "left" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: N.faint,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                <Icon name="arrowL" size={13} color={N.faint} />
                Previous in series
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: N.fg }}>{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link
              href={`/blog/${next.slug}`}
              style={{ ...cardStyle, textAlign: "right", alignItems: "flex-end" }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: N.faint,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Next in series
                <Icon name="arrowR" size={13} color={N.faint} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: N.fg }}>{next.title}</span>
            </Link>
          )}
        </div>
      )}
      <Link
        href="/blog"
        style={{
          alignSelf: "center",
          fontSize: 13.5,
          fontWeight: 600,
          color: N.gold,
          fontFamily: N.ui,
          textDecoration: "none",
        }}
      >
        ← Back to all posts
      </Link>
    </div>
  );
}
