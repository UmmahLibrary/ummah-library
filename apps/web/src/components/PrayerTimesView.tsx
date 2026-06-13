"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CALCULATION_METHODS,
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  type Madhab,
  MADHABS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerName,
  type PrayerTimings,
  TIMING_NAMES,
  nextPrayer,
} from "@ummahlibrary/core";
import { Khatam, N } from "./noor";

const METHOD_KEY = "ul.prayerMethod";
const MADHAB_KEY = "ul.prayerMadhab";
const COORDS_KEY = "ul.prayerCoords";

type Status = "idle" | "locating" | "loading" | "ready" | "error" | "denied";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Local calendar date as YYYY-MM-DD (not UTC — prayer times are a local concept). */
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

const cardStyle: CSSProperties = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
};

export function PrayerTimesView() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [method, setMethod] = useState(DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState<Madhab>("shafi");
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [now, setNow] = useState(() => new Date());
  const reqId = useRef(0);

  const fetchTimings = useCallback(async (c: Coordinates, m: string, mad: Madhab) => {
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const params = new URLSearchParams({
        lat: String(c.latitude),
        lng: String(c.longitude),
        date: localDate(new Date()),
        method: m,
        madhab: mad,
      });
      const res = await fetch(`/api/v1/prayer-times?${params}`);
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { timings: PrayerTimings };
      if (id !== reqId.current) return;
      setTimings(data.timings);
      setStatus("ready");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, []);

  // Restore preferences + last location, and load times if we have a location.
  useEffect(() => {
    const m = localStorage.getItem(METHOD_KEY) ?? DEFAULT_CALCULATION_METHOD;
    const mad = (localStorage.getItem(MADHAB_KEY) as Madhab) || "shafi";
    const saved = read<Coordinates | null>(COORDS_KEY, null);
    setMethod(m);
    setMadhab(mad);
    if (saved) {
      setCoords(saved);
      void fetchTimings(saved, m, mad);
    }
  }, [fetchTimings]);

  // Tick the clock for the live countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(c);
        try {
          localStorage.setItem(COORDS_KEY, JSON.stringify(c));
        } catch {
          /* storage unavailable */
        }
        void fetchTimings(c, method, madhab);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 },
    );
  }

  function changeMethod(m: string) {
    setMethod(m);
    localStorage.setItem(METHOD_KEY, m);
    if (coords) void fetchTimings(coords, m, madhab);
  }
  function changeMadhab(m: Madhab) {
    setMadhab(m);
    localStorage.setItem(MADHAB_KEY, m);
    if (coords) void fetchTimings(coords, method, m);
  }

  const upcoming = timings ? nextPrayer(timings, now) : null;
  // Once the day's prayers have passed, the next is tomorrow's Fajr.
  const next: { name: PrayerName; at: Date } | null =
    upcoming ??
    (timings ? { name: "fajr", at: new Date(new Date(timings.fajr).getTime() + 86400000) } : null);

  const selectStyle: CSSProperties = {
    fontFamily: N.ui,
    fontSize: 13.5,
    color: N.fg,
    background: N.card,
    border: `1px solid ${N.border}`,
    borderRadius: 10,
    padding: "8px 10px",
  };
  const ctaBtn: CSSProperties = {
    fontFamily: N.ui,
    fontSize: 14,
    fontWeight: 700,
    color: N.ink,
    background: N.goldGrad,
    border: "none",
    borderRadius: 11,
    padding: "11px 20px",
    cursor: "pointer",
  };

  return (
    <div>
      {!coords && status !== "locating" && (
        <div
          style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            See accurate prayer times for where you are. Your location stays on your device.
          </p>
          <button type="button" style={{ ...ctaBtn, alignSelf: "flex-start" }} onClick={locate}>
            📍 Use my location
          </button>
        </div>
      )}

      {status === "locating" && <p style={{ color: N.muted }}>Getting your location…</p>}
      {status === "denied" && (
        <div
          style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            Location permission was denied. Enable it in your browser to see local times.
          </p>
          <button
            type="button"
            style={{ ...selectStyle, alignSelf: "flex-start", cursor: "pointer" }}
            onClick={locate}
          >
            Try again
          </button>
        </div>
      )}
      {status === "error" && (
        <p style={{ color: N.muted }}>
          Couldn’t load prayer times. Check your connection and retry.
        </p>
      )}

      {timings && (
        <>
          {next && (
            <div
              style={{
                ...cardStyle,
                padding: 26,
                background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
                position: "relative",
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <Khatam
                size={170}
                color={N.gold}
                opacity={0.08}
                sw={1.1}
                style={{ position: "absolute", right: -40, top: -46 }}
              />
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: N.faint,
                  fontWeight: 700,
                }}
              >
                Next prayer
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  margin: "6px 0 2px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 38, fontWeight: 800, color: N.gold }}>
                  {PRAYER_LABELS[next.name]}
                </span>
                <span style={{ fontSize: 26, fontWeight: 700, color: N.fg }}>
                  {fmtTime(next.at.toISOString())}
                </span>
              </div>
              <div style={{ fontSize: 14, color: N.muted }}>
                begins in {countdown(next.at, now)}
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {TIMING_NAMES.map((name) => {
              const isNext = upcoming?.name === name && OBLIGATORY_PRAYERS.includes(name);
              return (
                <div
                  key={name}
                  style={{
                    ...cardStyle,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: isNext ? N.gold : N.border,
                    background: isNext ? N.goldSoft : N.card,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 14.5, fontWeight: 700, color: isNext ? N.goldHi : N.fg }}
                    >
                      {PRAYER_LABELS[name]}
                    </div>
                    <div style={{ fontSize: 12, color: N.faint }}>
                      {name === "sunrise" ? "Shurūq" : "Adhān"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: isNext ? N.goldHi : N.fg,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtTime(timings[name])}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: N.muted }}>Calculation method</span>
              <select
                value={method}
                onChange={(e) => changeMethod(e.target.value)}
                style={selectStyle}
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: N.muted }}>Asr (madhab)</span>
              <select
                value={madhab}
                onChange={(e) => changeMadhab(e.target.value as Madhab)}
                style={selectStyle}
              >
                {MADHABS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" style={{ ...selectStyle, cursor: "pointer" }} onClick={locate}>
              📍 Update location
            </button>
          </div>
          <p style={{ marginTop: 18, color: N.faint, fontSize: 13 }}>
            Times computed locally with the adhan library · {localDate(now)}
          </p>
        </>
      )}
    </div>
  );
}
