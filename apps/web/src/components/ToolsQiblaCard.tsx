"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Coordinates, compassPoint, qiblaDirection } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { webPrayerSettingsStore } from "../lib/prayer-settings-store";

const cardStyle = {
  borderRadius: 18,
  padding: 24,
  background: N.card,
  border: `1px solid ${N.border}`,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  textDecoration: "none",
};

/** The Tools "Qibla" featured card — the real bearing from the saved location
 *  (shared with Prayer Times/Qibla via `webPrayerSettingsStore`), or a neutral
 *  prompt when no location is set yet. Mirrors `ToolsPrayerCard`'s ready/CTA
 *  split so this card never shows a number that isn't actually computed. */
export function ToolsQiblaCard() {
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    void webPrayerSettingsStore.read().then(({ coords: saved }) => {
      if (saved) setCoords(saved);
    });
  }, []);

  const bearing = coords ? qiblaDirection(coords) : null;

  return (
    <Link href="/qibla" style={cardStyle}>
      {/* Compass decoration */}
      <div style={{ position: "relative", width: 150, height: 150, marginBottom: 16 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${N.border}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            border: `1px dashed ${N.borderSoft}`,
          }}
        />
        {(["N", "E", "S", "W"] as const).map((d, i) => (
          <span
            key={d}
            style={{
              position: "absolute",
              fontSize: 11,
              color: N.faint,
              top: i === 0 ? 6 : i === 2 ? "auto" : "50%",
              bottom: i === 2 ? 6 : "auto",
              left: i === 3 ? 8 : i === 1 ? "auto" : "50%",
              right: i === 1 ? 8 : "auto",
              transform: i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)",
            }}
          >
            {d}
          </span>
        ))}
        {/* Needle — only drawn once we have a real bearing to point it at */}
        {bearing !== null && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 4,
              height: 56,
              background: N.goldGrad,
              borderRadius: 2,
              transformOrigin: "bottom center",
              transform: `translate(-50%, -100%) rotate(${bearing}deg)`,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 12,
            height: 12,
            borderRadius: 6,
            background: N.gold,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      {bearing !== null ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
            Qibla · {Math.round(bearing)}° {compassPoint(bearing)}
          </div>
          <div style={{ fontSize: 13, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
            Direction to the Kaʿbah
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>Qibla</div>
          <div style={{ fontSize: 13, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
            Set your location to see the direction
          </div>
        </>
      )}
    </Link>
  );
}
