"use client";
import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";

/** Thin reading-progress bar under the sticky header, filling as the reader scrolls the article. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div style={{ position: "sticky", top: 64, zIndex: 19, height: 3, background: N.borderSoft }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: N.goldGrad,
          transition: "width 80ms linear",
        }}
      />
    </div>
  );
}
