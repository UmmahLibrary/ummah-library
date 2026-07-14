import Link from "next/link";
import { Logo, N } from "@ummahlibrary/ui";
import { RssIcon } from "./RssIcon";

/** Slim editorial header — no app sidebar/tool nav (the blog route is shell-excluded). */
export function BlogHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: N.bg,
        borderBottom: `1px solid ${N.borderSoft}`,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "0 28px",
        }}
      >
        <Link href="/blog" style={{ textDecoration: "none" }}>
          <Logo scale={0.92} />
        </Link>
        <div style={{ flex: 1 }} />
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link
            href="/blog"
            style={{
              fontFamily: N.ui,
              fontSize: 14,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              color: N.gold,
              textDecoration: "none",
            }}
          >
            Blog
          </Link>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: 8,
              color: N.muted,
              textDecoration: "none",
            }}
          >
            Open the app
          </Link>
        </nav>
        <Link
          href="/blog/rss.xml"
          title="RSS feed"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: N.card,
            border: `1px solid ${N.border}`,
            display: "grid",
            placeItems: "center",
            color: N.muted,
          }}
        >
          <RssIcon size={15} color={N.muted} />
        </Link>
      </div>
    </header>
  );
}
