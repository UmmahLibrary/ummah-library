"use client";
import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import type { Heading } from "../../lib/blog/blocks";

const SCROLL_PROBE_PX = 120;
const SCROLL_OFFSET_PX = 84;

export function ArticleTOC({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      let current = headings[0]?.id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top - SCROLL_PROBE_PX <= 0) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET_PX;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Table of contents"
      style={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: N.faint,
          marginBottom: 10,
        }}
      >
        On this page
      </div>
      {headings.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => jump(h.id)}
          style={{
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: N.ui,
            padding: "6px 0 6px 12px",
            borderLeft: `2px solid ${active === h.id ? N.gold : N.borderSoft}`,
            fontSize: 13,
            lineHeight: 1.4,
            fontWeight: active === h.id ? 700 : 500,
            color: active === h.id ? N.fg : N.faint,
          }}
        >
          {h.text}
        </button>
      ))}
    </nav>
  );
}
