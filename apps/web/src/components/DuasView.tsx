"use client";

import { useEffect, useState } from "react";
import { DUAS, DUA_CATEGORIES, type Dua, duaOfToday } from "@ummahlibrary/core";
import { N, Khatam } from "@ummahlibrary/ui";

const refStyle = { fontSize: 13, color: N.gold, fontWeight: 600, fontFamily: N.ui } as const;
const arStyle = {
  fontSize: 23,
  lineHeight: 2,
  textAlign: "right",
  color: N.fg,
} as const;

/** Qurʾānic duʿās — a featured duʿā of the day plus the collection grouped by
 *  moment. Shares the curated set with mobile via core. */
export function DuasView() {
  // Deterministic-by-date; resolved on the client so it advances without a
  // rebuild and never mismatches the server render.
  const [featured, setFeatured] = useState<Dua>(DUAS[0]!);
  useEffect(() => setFeatured(duaOfToday()), []);

  return (
    <div>
      {/* Duʿā of the day */}
      <div
        style={{
          background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
          border: `1px solid ${N.border}`,
          borderRadius: 16,
          padding: "22px 26px",
          position: "relative",
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", right: -34, top: -40, pointerEvents: "none" }}>
          <Khatam size={140} color={N.gold} sw={1.1} opacity={0.07} />
        </div>
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: N.gold,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 12,
          }}
        >
          Duʿā of the day
        </div>
        <div className="noor-ar" dir="rtl" lang="ar" style={{ ...arStyle, fontSize: 25 }}>
          {featured.ar}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.65, color: N.muted, margin: "12px 0 10px", fontFamily: N.ui }}>
          “{featured.en}”
        </div>
        <div style={refStyle}>{featured.ref}</div>
      </div>

      {DUA_CATEGORIES.map((cat) => {
        const list = DUAS.filter((d) => d.category === cat);
        if (list.length === 0) return null;
        return (
          <div key={cat}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: N.faint,
                fontWeight: 700,
                fontFamily: N.ui,
                margin: "24px 0 12px",
              }}
            >
              {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.map((d) => (
                <div
                  key={d.ref}
                  style={{ background: N.card, border: `1px solid ${N.border}`, borderRadius: 14, padding: "16px 18px" }}
                >
                  <div className="noor-ar" dir="rtl" lang="ar" style={arStyle}>
                    {d.ar}
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, color: N.muted, margin: "10px 0 8px", fontFamily: N.ui }}>
                    {d.en}
                  </div>
                  <div style={refStyle}>{d.ref}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 12.5, color: N.faint, textAlign: "center", lineHeight: 1.6, marginTop: 20, fontFamily: N.ui }}>
        Qurʾānic supplications · recite with presence of heart and certainty of response.
      </div>
    </div>
  );
}
