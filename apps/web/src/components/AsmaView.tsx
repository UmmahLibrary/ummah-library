"use client";

import { useEffect, useState } from "react";
import type { DivineName } from "@ummahlibrary/core";
import { N } from "./noor";

const KEY = "ul.asmaLearned";

export function AsmaView({ names }: { names: readonly DivineName[] }) {
  const [learned, setLearned] = useState<Record<number, true>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLearned(JSON.parse(raw) as Record<number, true>);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggle(n: number) {
    setLearned((prev) => {
      const next = { ...prev };
      if (next[n]) delete next[n];
      else next[n] = true;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const count = Object.keys(learned).length;

  return (
    <div>
      {/* Marked progress — shown only once you start marking, so the default view stays clean */}
      {ready && count > 0 && (
        <div style={{ fontSize: 12.5, color: N.faint, marginBottom: 16, fontFamily: N.ui }}>
          {count} / {names.length} marked
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {names.map((n) => {
          const isMarked = ready && Boolean(learned[n.number]);
          return (
            <button
              key={n.number}
              type="button"
              onClick={() => toggle(n.number)}
              aria-pressed={isMarked}
              className="noor-press"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "16px 18px",
                borderRadius: 16,
                border: `1px solid ${isMarked ? N.gold : N.border}`,
                background: isMarked ? N.goldSoft : N.card,
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 12, color: N.faint, fontWeight: 700, fontFamily: N.ui }}>
                  {n.number}
                </span>
                <span
                  className="noor-ar"
                  dir="rtl"
                  lang="ar"
                  style={{ fontSize: 24, color: N.gold, lineHeight: 1.4 }}
                >
                  {n.arabic}
                </span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.2, color: N.fg, fontFamily: N.ui }}>
                {n.transliteration}
              </div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 4, lineHeight: 1.45, fontFamily: N.ui }}>
                {n.meaning}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
