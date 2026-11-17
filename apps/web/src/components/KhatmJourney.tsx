"use client";

import Link from "next/link";
import { JUZ_START_PAGES, khatmJourney } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";

/**
 * The khatm journey (ADR 0041): thirty juz as a path, filled as the reader
 * moves through the Quran. A journey, not a scoreboard — no percentages of
 * reward, no comparison with anyone else.
 */
export function KhatmJourney({ currentPage, active }: { currentPage: number; active: boolean }) {
  const states = khatmJourney(currentPage);
  const done = states.filter((s) => s === "done").length;
  return (
    <section
      aria-labelledby="khatm-journey-title"
      className="nf-card"
      style={{ marginTop: 22, gap: 14 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          id="khatm-journey-title"
          style={{ margin: 0, fontFamily: N.ui, fontSize: 18, fontWeight: 800, color: N.fg }}
        >
          Khatm journey
        </h2>
        <span style={{ fontFamily: N.ui, fontSize: 14.5, color: N.muted }}>
          {active ? `${done} of 30 juz complete` : "Start a khatma above to follow your path"}
        </span>
      </div>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
          gap: 8,
        }}
      >
        {states.map((s, i) => (
          <li key={i}>
            <Link
              href={`/page/${JUZ_START_PAGES[i]}`}
              aria-label={`Juz ${i + 1}: ${s === "done" ? "complete" : s === "now" ? "reading now" : "not started"}`}
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 52,
                borderRadius: 12,
                border: `${s === "now" ? 2 : 1}px solid ${s === "todo" ? N.border : N.gold}`,
                background: s === "done" ? N.goldGrad : s === "now" ? N.goldSoft : "transparent",
                color: s === "done" ? N.ink : N.fg,
                fontFamily: N.ui,
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {i + 1}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
