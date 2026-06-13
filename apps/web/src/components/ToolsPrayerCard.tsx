"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerTimings,
  nextPrayer,
} from "@ummahlibrary/core";
import { Icon, Khatam, N } from "./noor";

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

const heroStyle = {
  borderRadius: 18,
  padding: 24,
  background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
  border: `1px solid ${N.border}`,
  position: "relative" as const,
  overflow: "hidden" as const,
  textDecoration: "none" as const,
  display: "block" as const,
};

/** The Tools "Next prayer" hero — the upcoming prayer + a mini grid of the day's
 *  obligatory times (from the saved location), or a prompt when none is set. */
export function ToolsPrayerCard() {
  const [ready, setReady] = useState(false);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setReady(true);
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
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { timings: PrayerTimings } | null) => {
          if (d) setTimings(d.timings);
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
  const place = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace(/_/g, " ");
    } catch {
      return undefined;
    }
  })();

  const label = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: N.faint,
          fontWeight: 700,
          fontFamily: N.ui,
        }}
      >
        Next prayer
      </span>
      <span style={{ fontSize: 22 }}>🕌</span>
    </div>
  );

  return (
    <Link href="/prayer-times" style={heroStyle}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", right: -36, bottom: -40, pointerEvents: "none" }}
      >
        <Khatam size={160} color={N.gold} sw={1.1} opacity={0.08} />
      </div>
      {ready && timings && next ? (
        <>
          {label}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: N.gold,
                lineHeight: 1.1,
                fontFamily: N.ui,
              }}
            >
              {PRAYER_LABELS[next.name]}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
              {fmtTime(next.at.toISOString())}
            </span>
          </div>
          <div style={{ fontSize: 13.5, color: N.muted, fontFamily: N.ui, marginBottom: 16 }}>
            in {countdown(next.at, now)}
            {place ? ` · ${place}` : ""}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))",
              gap: 8,
            }}
          >
            {OBLIGATORY_PRAYERS.map((p) => {
              const isNext = upcoming?.name === p;
              return (
                <div
                  key={p}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    textAlign: "center",
                    border: `1px solid ${isNext ? N.gold : N.border}`,
                    background: isNext ? N.goldSoft : N.card,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      color: isNext ? N.gold : N.faint,
                      fontFamily: N.ui,
                      marginBottom: 3,
                    }}
                  >
                    {PRAYER_LABELS[p]}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isNext ? N.goldHi : N.fg,
                      fontFamily: N.ui,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtTime(timings[p])}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {label}
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: N.gold,
              lineHeight: 1.1,
              fontFamily: N.ui,
              margin: "5px 0 3px",
            }}
          >
            Prayer Times
          </div>
          <div style={{ fontSize: 13.5, color: N.muted, fontFamily: N.ui, marginBottom: 16 }}>
            Daily salah · your location
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: N.gold,
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: N.ui,
            }}
          >
            <Icon name="arrowR" size={16} color={N.gold} /> View prayer times
          </div>
        </>
      )}
    </Link>
  );
}
