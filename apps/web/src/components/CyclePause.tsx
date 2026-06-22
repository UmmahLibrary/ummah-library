"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { type HaidLog, currentPeriod, periodLength } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { HAID_EVENT, readHaid, togglePause } from "../lib/haid";
import { today } from "../lib/prayer-tracker";

const card: CSSProperties = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
};
const sectionLabel: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
};

const fmt = (d: string): string =>
  new Date(`${d}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });

export function CyclePause() {
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<HaidLog>([]);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(today());
    void readHaid().then(setLog);
    setReady(true);
    const onChange = () => void readHaid().then(setLog);
    window.addEventListener(HAID_EVENT, onChange);
    return () => window.removeEventListener(HAID_EVENT, onChange);
  }, []);

  if (!ready) return null;

  const current = currentPeriod(log);
  const days = current ? periodLength(current, todayStr) : 0;

  return (
    <div style={{ ...card, padding: 24, marginTop: 18 }}>
      <div style={{ ...sectionLabel, marginBottom: 12 }}>Cycle pause · ḥayḍ</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: current ? N.gold : N.fg }}>
            {current ? `Paused — day ${days}` : "Tracking active"}
          </div>
          <div style={{ fontSize: 13, color: N.faint, marginTop: 4, maxWidth: 460 }}>
            {current
              ? `Since ${fmt(current.start)}. Prayers aren’t counted as missed and your streak is held.`
              : "On your period? Start a pause — those days won’t break your streak or count as missed."}
          </div>
        </div>
        <button
          type="button"
          aria-label={current ? "End cycle pause" : "Start cycle pause"}
          onClick={() => void togglePause(todayStr).then(setLog)}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: `1px solid ${current ? N.border : "transparent"}`,
            background: current ? "transparent" : N.goldSoft,
            color: current ? N.fg : N.gold,
            cursor: "pointer",
            fontFamily: N.ui,
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {current ? "End pause" : "Start pause"}
        </button>
      </div>
      <p style={{ fontSize: 12, color: N.faint, marginTop: 14, marginBottom: 0 }}>
        Any missed fasts in this time are made up later. Stored on your device.
      </p>
    </div>
  );
}
