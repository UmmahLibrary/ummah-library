"use client";

import { useEffect, useState } from "react";
import { computeStreak, longestStreak, prayerStreak, totalSavedAyahs } from "@ummahlibrary/core";
import { N, Khatam } from "@ummahlibrary/ui";
import { allRecords, surahProgressMap } from "../lib/hifz-store";
import { getStreak } from "../lib/hifz-streak";
import { readPrayerLog, today } from "../lib/prayer-tracker";
import { readReadingState } from "../lib/reading-goals";
import { readCollections } from "../lib/collections";

interface Stats {
  hifzStreak: number;
  memorized: number;
  surahsStarted: number;
  prayerStreak: number;
  names: number;
  saved: number;
  bestStreak: number;
}

const ZERO: Stats = {
  hifzStreak: 0,
  memorized: 0,
  surahsStarted: 0,
  prayerStreak: 0,
  names: 0,
  saved: 0,
  bestStreak: 0,
};

function namesLearned(): number {
  try {
    return Object.keys(JSON.parse(localStorage.getItem("ul.asmaLearned") ?? "{}") as object).length;
  } catch {
    return 0;
  }
}

/**
 * "Your journey" — a progress dashboard built entirely from the local-first data
 * the app already keeps (Hifz, prayer log, reading log, names learned,
 * collections). No account — honest for a local-first app (ADR 0006), and a
 * match for the mobile Profile screen.
 */
export function ProfileView() {
  const [s, setS] = useState<Stats>(ZERO);

  useEffect(() => {
    const t = today();
    const log = readPrayerLog();
    const hifzStreak = getStreak().count;
    const prayer = prayerStreak(log, t);
    void Promise.all([readReadingState(), readCollections()]).then(([reading, collections]) =>
      setS({
        hifzStreak,
        memorized: allRecords().length,
        surahsStarted: surahProgressMap(new Date()).size,
        prayerStreak: prayer,
        names: namesLearned(),
        saved: totalSavedAyahs(collections),
        bestStreak: Math.max(hifzStreak, prayer, longestStreak(log), computeStreak(reading.activeDates, t)),
      }),
    );
  }, []);

  const statCards: [string, string][] = [
    [`${s.hifzStreak} 🔥`, "Hifz streak"],
    [String(s.memorized), "Āyāt memorized"],
    [String(s.surahsStarted), "Surahs started"],
    [String(s.prayerStreak), "Prayer streak"],
    [`${s.names}/99`, "Names learned"],
    [String(s.saved), "Saved verses"],
  ];

  const badges: [string, string, boolean][] = [
    ["✦", "First āyah", s.memorized > 0],
    ["📖", "Memorizer", s.surahsStarted >= 1],
    ["🔥", "7-day streak", s.bestStreak >= 7],
    ["🌙", "30-day streak", s.bestStreak >= 30],
    ["✨", "Ten Names", s.names >= 10],
    ["🔖", "Collector", s.saved >= 5],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Identity hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
          border: `1px solid ${N.border}`,
          borderRadius: 16,
          padding: 22,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", right: -34, bottom: -40, pointerEvents: "none" }}>
          <Khatam size={150} color={N.gold} sw={1.1} opacity={0.08} />
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: N.goldGrad,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Khatam size={34} color={N.ink} sw={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5, color: N.fg, fontFamily: N.ui }}>
            Your journey
          </div>
          <div style={{ fontSize: 13.5, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
            Local-first — saved on this device
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {statCards.map(([v, l]) => (
          <div
            key={l}
            style={{ background: N.card, border: `1px solid ${N.border}`, borderRadius: 14, padding: "16px 18px" }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: N.gold, fontFamily: N.ui }}>
              {v}
            </div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 4, fontFamily: N.ui }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: N.faint,
            fontWeight: 700,
            marginBottom: 12,
            fontFamily: N.ui,
          }}
        >
          Achievements
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {badges.map(([glyph, name, got]) => (
            <div
              key={name}
              style={{
                background: N.card,
                border: `1px solid ${N.border}`,
                borderRadius: 14,
                padding: "18px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                opacity: got ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  background: got ? N.goldSoft : "transparent",
                  border: `1px solid ${got ? N.gold : N.border}`,
                }}
              >
                {glyph}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: N.fg, textAlign: "center", fontFamily: N.ui }}>
                {name}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: got ? N.gold : N.faint,
                  fontFamily: N.ui,
                }}
              >
                {got ? "Unlocked" : "Locked"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
