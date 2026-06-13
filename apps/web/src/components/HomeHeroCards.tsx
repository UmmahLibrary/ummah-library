"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  PRAYER_LABELS,
  type PrayerTimings,
  computeStreak,
  nextPrayer,
} from "@ummahlibrary/core";
import { Khatam, N } from "./noor";
import { activeDates, pagesToday, readGoal, today } from "../lib/reading-goals";

const COORDS_KEY = "ul.prayerCoords";
const METHOD_KEY = "ul.prayerMethod";
const MADHAB_KEY = "ul.prayerMadhab";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function countdown(target: Date, now: Date): string {
  let s = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const C = 2 * Math.PI * 27;

/** The home "Next prayer" + "Today's reading" summary cards (mirrors the Noor hub). */
export function HomeHeroCards() {
  const [ready, setReady] = useState(false);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reading, setReading] = useState({ pages: 0, goal: 4, streak: 0 });

  useEffect(() => {
    setReady(true);
    setReading({
      pages: pagesToday(),
      goal: readGoal(),
      streak: computeStreak(activeDates(), today()),
    });
    const saved = read<Coordinates | null>(COORDS_KEY, null);
    if (saved) {
      const method = localStorage.getItem(METHOD_KEY) ?? DEFAULT_CALCULATION_METHOD;
      const madhab = localStorage.getItem(MADHAB_KEY) ?? "shafi";
      const params = new URLSearchParams({
        lat: String(saved.latitude),
        lng: String(saved.longitude),
        date: localDate(new Date()),
        method,
        madhab,
      });
      fetch(`/api/v1/prayer-times?${params}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { timings: PrayerTimings } | null) => {
          if (data) setTimings(data.timings);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const upcoming = timings ? nextPrayer(timings, now) : null;
  const next =
    upcoming ??
    (timings
      ? { name: "fajr" as const, at: new Date(new Date(timings.fajr).getTime() + 86400000) }
      : null);
  const pct = reading.goal > 0 ? Math.min(1, reading.pages / reading.goal) : 0;

  // Keep the static markup stable until mounted (these cards are personal/local).
  if (!ready) return <div style={{ minHeight: 96, marginBottom: 16 }} />;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {/* Next prayer */}
      <Link
        href="/prayer-times"
        style={{
          display: "block",
          textDecoration: "none",
          borderRadius: 16,
          padding: "20px 22px",
          background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
          border: `1px solid ${N.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Khatam
          size={120}
          color={N.gold}
          sw={1.1}
          opacity={0.08}
          style={{ position: "absolute", right: -26, bottom: -30 }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
            }}
          >
            Next prayer
          </span>
          <span style={{ fontSize: 18 }}>🕌</span>
        </div>
        {next ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 9,
                marginBottom: 3,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 800, color: N.gold, lineHeight: 1.1 }}>
                {PRAYER_LABELS[next.name]}
              </span>
              <span style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1, color: N.fg }}>
                {fmtTime(next.at.toISOString())}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: N.muted }}>in {countdown(next.at, now)}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: N.gold, marginBottom: 3 }}>
              Set your location
            </div>
            <div style={{ fontSize: 12.5, color: N.muted }}>Tap to see local prayer times</div>
          </>
        )}
      </Link>

      {/* Today's reading */}
      <Link
        href="/goals"
        style={{
          textDecoration: "none",
          borderRadius: 16,
          padding: "20px 22px",
          background: N.card,
          border: `1px solid ${N.border}`,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              strokeWidth="6"
              style={{ stroke: N.border }}
            />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              style={{ stroke: N.gold, transition: "stroke-dashoffset .4s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              fontWeight: 800,
              color: N.gold,
            }}
          >
            {Math.round(pct * 100)}%
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
            }}
          >
            Today’s reading
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: N.fg }}>
            {reading.pages} / {reading.goal} pages
          </div>
          <div style={{ fontSize: 12.5, color: N.gold, marginTop: 2, fontWeight: 600 }}>
            🔥 {reading.streak}-day streak
          </div>
        </div>
      </Link>
    </div>
  );
}
