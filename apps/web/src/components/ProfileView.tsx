"use client";

import { type CSSProperties, useEffect, useState } from "react";
import {
  type BadgeStats,
  computeStreak,
  evaluateBadges,
  longestStreak,
  newlyUnlocked,
  prayerStreak,
  totalSavedAyahs,
  unlockedIds,
} from "@ummahlibrary/core";
import { N, Khatam } from "@ummahlibrary/ui";
import { countLearned } from "../lib/asma-store";
import { allRecords, surahProgressMap } from "../lib/hifz-store";
import { getStreak } from "../lib/hifz-streak";
import { readPrayerLog, today } from "../lib/prayer-tracker";
import { readReadingState } from "../lib/reading-goals";
import { readCollections } from "../lib/collections";
import { acknowledge, readAcknowledged } from "../lib/achievements";

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

const toBadgeStats = (s: Stats): BadgeStats => ({
  memorized: s.memorized,
  surahsStarted: s.surahsStarted,
  prayerStreak: s.prayerStreak,
  bestStreak: s.bestStreak,
  namesLearned: s.names,
  savedVerses: s.saved,
});

const toastStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 24,
  transform: "translateX(-50%)",
  background: N.goldGrad,
  color: N.ink,
  fontWeight: 800,
  fontSize: 14,
  padding: "12px 20px",
  borderRadius: 999,
  boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
  zIndex: 50,
  fontFamily: N.ui,
};

/**
 * "Your journey" — a progress dashboard built entirely from the local-first data
 * the app already keeps (Hifz, prayer log, reading log, names learned,
 * collections). No account — honest for a local-first app (ADR 0006), and a
 * match for the mobile Profile screen.
 */
export function ProfileView() {
  const [s, setS] = useState<Stats>(ZERO);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = today();
    const hifzStreak = getStreak().count;
    void Promise.all([readReadingState(), readCollections(), readPrayerLog(), readAcknowledged()]).then(
      ([reading, collections, log, ack]) => {
        const prayer = prayerStreak(log, t);
        const next: Stats = {
          hifzStreak,
          memorized: allRecords().length,
          surahsStarted: surahProgressMap(allRecords(), new Date()).size,
          prayerStreak: prayer,
          names: countLearned(),
          saved: totalSavedAyahs(collections),
          bestStreak: Math.max(hifzStreak, prayer, longestStreak(log), computeStreak(reading.activeDates, t)),
        };
        setS(next);

        const bs = toBadgeStats(next);
        const fresh = newlyUnlocked(bs, ack);
        if (fresh.length > 0) {
          const first = fresh[0];
          setToast(
            fresh.length === 1 && first
              ? `🎉 Unlocked: ${first.name}`
              : `🎉 ${fresh.length} new badges unlocked!`,
          );
          void acknowledge(unlockedIds(bs));
        }
      },
    );
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const badgeProgress = evaluateBadges(toBadgeStats(s));
  const earned = badgeProgress.filter((b) => b.unlocked).length;

  const statCards: [string, string][] = [
    [`${s.hifzStreak} 🔥`, "Hifz streak"],
    [String(s.memorized), "Āyāt memorized"],
    [String(s.surahsStarted), "Surahs started"],
    [String(s.prayerStreak), "Prayer streak"],
    [`${s.names}/99`, "Names learned"],
    [String(s.saved), "Saved verses"],
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
          Achievements · {earned}/{badgeProgress.length}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {badgeProgress.map(({ badge, unlocked }) => (
            <div
              key={badge.id}
              title={badge.description}
              style={{
                background: N.card,
                border: `1px solid ${N.border}`,
                borderRadius: 14,
                padding: "18px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                opacity: unlocked ? 1 : 0.55,
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
                  background: unlocked ? N.goldSoft : "transparent",
                  border: `1px solid ${unlocked ? N.gold : N.border}`,
                }}
              >
                {badge.glyph}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: N.fg, textAlign: "center", fontFamily: N.ui }}>
                {badge.name}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: unlocked ? N.gold : N.faint,
                  fontFamily: N.ui,
                }}
              >
                {unlocked ? "Unlocked" : "Locked"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div role="status" style={toastStyle}>
          {toast}
        </div>
      )}
    </div>
  );
}
