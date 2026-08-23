"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Coordinates, type PrayerTimings, gregorianToHijri, hijriMonth } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { fmtPrayerTime } from "../lib/prayer-time-format";
import { webPrayerSettingsStore } from "../lib/prayer-settings-store";
import { webPrayerTimingsProvider } from "../lib/prayer-timings-provider";
import { RAMADAN_EVENT, readFasts, readWorship, toggleFast, toggleWorship } from "../lib/ramadan";
import { readReadingState } from "../lib/reading-goals";
import { HIJRI_ADJUST_KEY, readHijriAdjust } from "../lib/hijri";

const WORSHIP: { key: string; label: string; icon: IconName }[] = [
  { key: "suhur", label: "Suhūr", icon: "sun" },
  { key: "fajr", label: "Fajr in jamāʿah", icon: "moon" },
  { key: "quran", label: "Qurʾān juzʾ", icon: "book" },
  { key: "tarawih", label: "Tarāwīḥ", icon: "moon" },
];

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function countdown(target: Date, now: Date): string {
  if (Number.isNaN(target.getTime())) return "—";
  let s = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const statCard = {
  flex: "1 1 140px",
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 14,
  padding: "15px 18px",
} as const;
const sectionLabel = {
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
  fontFamily: N.ui,
  margin: "22px 0 12px",
} as const;

/** Ramaḍān hub — live ifṭār countdown, fasting progress, and a daily worship
 *  checklist. Mirrors the mobile screen; local-first (ADR 0006). */
export function RamadanView() {
  const [now, setNow] = useState(() => new Date());
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [fasts, setFasts] = useState<Record<number, true>>({});
  const [worship, setWorship] = useState<Record<string, true>>({});
  const [pagesRead, setPagesRead] = useState(0);
  const [hijriAdjust, setHijriAdjust] = useState(0);
  const today = localDate(new Date());

  useEffect(() => {
    const sync = () => {
      setFasts(readFasts());
      setWorship(readWorship(today));
      void readReadingState().then((s) => setPagesRead(Object.values(s.log).reduce((a, b) => a + b, 0)));
    };
    sync();
    window.addEventListener(RAMADAN_EVENT, sync);

    void webPrayerSettingsStore.read().then(({ coords: c }) => setCoords(c));
    void webPrayerTimingsProvider.getTodaysTimings().then((t) => {
      if (t) setTimings(t);
    });
    return () => window.removeEventListener(RAMADAN_EVENT, sync);
  }, [today]);

  useEffect(() => {
    setHijriAdjust(readHijriAdjust());
    const onAdjust = () => setHijriAdjust(readHijriAdjust());
    window.addEventListener(HIJRI_ADJUST_KEY, onAdjust);
    return () => window.removeEventListener(HIJRI_ADJUST_KEY, onAdjust);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hijri = gregorianToHijri(
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
    hijriAdjust,
  );
  const isRamadan = hijri.month === 9;
  const ramadanDay = isRamadan ? hijri.day : null;

  const fastsKept = Object.keys(fasts).length;
  const worshipDone = Object.keys(worship).length;
  const khatmPct = Math.min(100, Math.round((pagesRead / 604) * 100));

  const iftar = timings ? new Date(timings.maghrib) : null;
  const suhurEnd = timings ? new Date(timings.fajr) : null;
  const beforeIftar = iftar ? now < iftar : false;
  const dayProgress =
    suhurEnd && iftar
      ? Math.max(
          0,
          Math.min(100, ((now.getTime() - suhurEnd.getTime()) / (iftar.getTime() - suhurEnd.getTime())) * 100),
        )
      : 0;

  const stats: [string, string][] = [
    [`${fastsKept}/30`, "Fasts kept"],
    [isRamadan ? `${ramadanDay}/30` : "—", "Day of Ramaḍān"],
    [`${khatmPct}%`, "Khatm progress"],
    [`${worshipDone}/4`, "Today’s worship"],
  ];

  return (
    <div>
      <div style={{ textAlign: "center", color: N.muted, fontSize: 13.5, fontFamily: N.ui, marginBottom: 14 }}>
        {isRamadan
          ? `${ramadanDay} Ramaḍān ${hijri.year} AH`
          : `${hijri.day} ${hijriMonth(hijri.month).name} ${hijri.year} AH`}
      </div>

      {/* Ifṭār countdown hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
          border: `1px solid ${N.border}`,
          borderRadius: 16,
          padding: 26,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <Khatam size={220} color={N.gold} sw={0.9} opacity={0.06} />
        </div>
        {iftar && suhurEnd ? (
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700, fontFamily: N.ui }}>
              {beforeIftar ? "Time until Ifṭār" : "Ifṭār has begun"}
            </div>
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, color: N.fg, margin: "6px 0", fontFamily: N.ui }}>
              {beforeIftar ? countdown(iftar, now) : "🌙 Iftar mubarak"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: N.muted, fontFamily: N.ui }}>
              <span>Suhūr {fmtPrayerTime(timings!.fajr, coords)}</span>
              <span>Ifṭār {fmtPrayerTime(timings!.maghrib, coords)}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: N.border, overflow: "hidden", marginTop: 6 }}>
              <div style={{ width: `${dayProgress}%`, height: "100%", background: N.goldGrad }} />
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700, fontFamily: N.ui }}>
              Ifṭār countdown
            </div>
            <div style={{ fontSize: 14.5, color: N.muted, marginTop: 10, fontFamily: N.ui }}>
              {coords ? "Loading today’s times…" : "Set your location to see suhūr & ifṭār times."}
            </div>
            {!coords && (
              <Link
                href="/prayer-times"
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "10px 22px",
                  borderRadius: 11,
                  background: N.goldGrad,
                  color: N.ink,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  fontFamily: N.ui,
                }}
              >
                Set location
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        {stats.map(([v, l]) => (
          <div key={l} style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: N.gold, fontFamily: N.ui }}>{v}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3, fontFamily: N.ui }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Fasting grid */}
      <div style={sectionLabel}>Fasting · Ramaḍān</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 7,
          background: N.card,
          border: `1px solid ${N.border}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const kept = Boolean(fasts[d]);
          const isToday = ramadanDay === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setFasts(toggleFast(d))}
              aria-label={`Fast day ${d}${kept ? " kept" : ""}`}
              aria-pressed={kept}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                border: `1px solid ${isToday && !kept ? N.gold : kept ? "transparent" : N.borderSoft}`,
                background: kept ? N.goldGrad : "transparent",
                color: kept ? N.ink : isToday ? N.gold : N.faint,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: N.ui,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Today's worship */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 12px" }}>
        <span style={{ ...sectionLabel, margin: 0 }}>Today’s worship</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: N.gold, fontFamily: N.ui }}>{worshipDone}/4</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {WORSHIP.map((w) => {
          const on = Boolean(worship[w.key]);
          return (
            <button
              key={w.key}
              type="button"
              onClick={() => setWorship(toggleWorship(today, w.key))}
              className="noor-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${on ? N.gold : N.border}`,
                background: on ? N.goldSoft : N.card,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  display: "grid",
                  placeItems: "center",
                  background: on ? N.goldGrad : "transparent",
                  border: `1px solid ${on ? N.gold : N.border}`,
                  flexShrink: 0,
                }}
              >
                <Icon name={on ? "check" : w.icon} size={14} color={on ? N.ink : N.faint} sw={2} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? N.fg : N.muted, fontFamily: N.ui }}>
                {w.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
