"use client";

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

export function PrayerTimesView() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [method, setMethod] = useState(DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState<Madhab>("shafi");
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [now, setNow] = useState(() => new Date());
  const reqId = useRef(0);

  const fetchTimings = useCallback(
    async (c: Coordinates, m: string, mad: Madhab) => {
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
    },
    [],
  );

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
    upcoming ?? (timings ? { name: "fajr", at: new Date(new Date(timings.fajr).getTime() + 86400000) } : null);

  return (
    <div className="prayer">
      {!coords && status !== "locating" && (
        <div className="prayer-cta">
          <p>See accurate prayer times for where you are. Your location stays on your device.</p>
          <button type="button" className="audio-play" onClick={locate}>
            📍 Use my location
          </button>
        </div>
      )}

      {status === "locating" && <p className="hifz-muted">Getting your location…</p>}
      {status === "denied" && (
        <div className="prayer-cta">
          <p>Location permission was denied. Enable it in your browser to see local times.</p>
          <button type="button" className="chip" onClick={locate}>
            Try again
          </button>
        </div>
      )}
      {status === "error" && (
        <p className="hifz-muted">Couldn’t load prayer times. Check your connection and retry.</p>
      )}

      {timings && (
        <>
          {next && (
            <div className="prayer-next">
              <span className="prayer-next-label">Next prayer</span>
              <span className="prayer-next-name">{PRAYER_LABELS[next.name]}</span>
              <span className="prayer-next-in">
                {fmtTime(next.at.toISOString())} · in {countdown(next.at, now)}
              </span>
            </div>
          )}

          <ul className="prayer-list">
            {TIMING_NAMES.map((name) => {
              const isNext = upcoming?.name === name && OBLIGATORY_PRAYERS.includes(name);
              return (
                <li key={name} className={isNext ? "prayer-row prayer-row--next" : "prayer-row"}>
                  <span className="prayer-name">{PRAYER_LABELS[name]}</span>
                  <span className="prayer-time">{fmtTime(timings[name])}</span>
                </li>
              );
            })}
          </ul>

          <div className="prayer-controls">
            <label>
              <span className="prayer-control-label">Calculation method</span>
              <select
                className="audio-reciter"
                value={method}
                onChange={(e) => changeMethod(e.target.value)}
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="prayer-control-label">Asr (madhab)</span>
              <select
                className="audio-reciter"
                value={madhab}
                onChange={(e) => changeMadhab(e.target.value as Madhab)}
              >
                {MADHABS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="chip" onClick={locate}>
              📍 Update location
            </button>
          </div>
          <p className="foot">Times computed locally with the adhan library · {localDate(now)}</p>
        </>
      )}
    </div>
  );
}
