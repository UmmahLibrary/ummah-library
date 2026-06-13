"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import {
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerStatus,
  type PrayerTrackerLog,
  longestStreak,
  onTimeRate,
  prayedCount,
  prayerStreak,
  recentDays,
  statusFor,
} from "@ummahlibrary/core";
import { Icon, N } from "./noor";
import { PRAYER_TRACKER_EVENT, cyclePrayer, readPrayerLog, today } from "../lib/prayer-tracker";

// A warm bronze for "late", distinct from the gold used for "on time".
const LATE = "#C98A57";

const statusColor = (s: PrayerStatus): string =>
  s === "ontime" ? N.gold : s === "late" ? LATE : N.border;
const statusLabel = (s: PrayerStatus): string =>
  s === "ontime" ? "On time" : s === "late" ? "Late" : "Not yet";

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

function weekdayInitial(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "narrow" });
}

export function PrayerTracker() {
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<PrayerTrackerLog>({});
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(today());
    setLog(readPrayerLog());
    setReady(true);
    const onChange = () => setLog(readPrayerLog());
    window.addEventListener(PRAYER_TRACKER_EVENT, onChange);
    return () => window.removeEventListener(PRAYER_TRACKER_EVENT, onChange);
  }, []);

  if (!ready) return null;

  const todayLog = log[todayStr];
  const days = recentDays(log, todayStr, 7);

  const stats: [string, string][] = [
    [`${prayedCount(todayLog)}/5`, "Prayed today"],
    [`${prayerStreak(log, todayStr)} 🔥`, "Day streak"],
    [`${onTimeRate(log, todayStr)}%`, "On time (30d)"],
    [`${longestStreak(log)}`, "Best streak"],
  ];

  return (
    <>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {stats.map(([value, label]) => (
          <div key={label} style={{ ...card, padding: "18px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>
              {value}
            </div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Today — tap to log */}
      <div style={{ ...card, padding: 24, marginBottom: 18 }}>
        <div style={{ ...sectionLabel, marginBottom: 16 }}>Today · tap to log</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {OBLIGATORY_PRAYERS.map((p) => {
            const st = statusFor(todayLog, p);
            const lit = st !== "none";
            return (
              <button
                key={p}
                type="button"
                onClick={() => setLog(cyclePrayer(todayStr, p))}
                aria-label={`${PRAYER_LABELS[p]}: ${statusLabel(st)} — tap to change`}
                style={{
                  padding: "16px 6px",
                  borderRadius: 13,
                  border: `1px solid ${lit ? statusColor(st) : N.border}`,
                  background: lit ? N.goldSoft : "transparent",
                  cursor: "pointer",
                  fontFamily: N.ui,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    display: "grid",
                    placeItems: "center",
                    background: st === "ontime" ? N.goldGrad : "transparent",
                    border: st === "ontime" ? "none" : `1.5px solid ${statusColor(st)}`,
                  }}
                >
                  {st === "ontime" ? (
                    <Icon name="check" size={18} color={N.ink} />
                  ) : st === "late" ? (
                    <Icon name="check" size={16} color={LATE} />
                  ) : (
                    <span
                      style={{ width: 8, height: 8, borderRadius: 4, background: N.border }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: N.fg }}>{PRAYER_LABELS[p]}</span>
                <span style={{ fontSize: 11, color: lit ? N.gold : N.faint, fontWeight: 600 }}>
                  {statusLabel(st)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Last 7 days */}
      <div style={{ ...card, padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={sectionLabel}>Last 7 days</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: N.faint }}>
            <Legend swatch={{ background: N.gold }}>On time</Legend>
            <Legend swatch={{ background: LATE }}>Late</Legend>
            <Legend swatch={{ border: `1px solid ${N.border}` }}>Missed</Legend>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto repeat(7, 1fr)",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div />
          {days.map((d) => (
            <div
              key={d.date}
              style={{ textAlign: "center", fontSize: 11.5, color: N.faint, fontWeight: 700 }}
            >
              {weekdayInitial(d.date)}
            </div>
          ))}
          {OBLIGATORY_PRAYERS.map((p, pi) => (
            <FragmentRow key={p}>
              <div style={{ fontSize: 12.5, color: N.muted, fontWeight: 600, paddingRight: 8 }}>
                {PRAYER_LABELS[p]}
              </div>
              {days.map((d) => {
                const st = d.statuses[pi] ?? "none";
                return (
                  <div
                    key={d.date}
                    title={`${PRAYER_LABELS[p]} · ${weekdayInitial(d.date)}: ${statusLabel(st)}`}
                    style={{
                      aspectRatio: "1",
                      width: "100%",
                      maxWidth: 30,
                      margin: "0 auto",
                      borderRadius: 7,
                      background: st === "none" ? "transparent" : statusColor(st),
                      border: st === "none" ? `1px solid ${N.border}` : "none",
                    }}
                  />
                );
              })}
            </FragmentRow>
          ))}
        </div>
      </div>
    </>
  );
}

function Legend({ swatch, children }: { swatch: CSSProperties; children: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, ...swatch }} />
      {children}
    </span>
  );
}

// A row of grid children (the prayer label + its seven day cells) without an
// extra wrapper element, so they flow into the parent grid.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
