"use client";

import { useCallback, useEffect, useState } from "react";
import { type Coordinates, compassPoint, qiblaDirection } from "@ummahlibrary/core";

// Shared with the prayer-times page — one stored location for both.
const COORDS_KEY = "ul.prayerCoords";

type Status = "idle" | "locating" | "ready" | "denied" | "error";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** iOS 13+ gates DeviceOrientation behind an explicit permission prompt. */
interface OrientationEventStatic {
  requestPermission?: () => Promise<"granted" | "denied">;
}

function deviceHeading(e: DeviceOrientationEvent): number | null {
  // iOS exposes a true-north compass heading directly.
  const webkit = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
    .webkitCompassHeading;
  if (typeof webkit === "number" && !Number.isNaN(webkit)) return webkit;
  // Elsewhere alpha is degrees counter-clockwise from north when absolute.
  if (e.absolute && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}

export function QiblaCompass() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [heading, setHeading] = useState<number | null>(null);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);

  // Restore the shared location on mount.
  useEffect(() => {
    const saved = read<Coordinates | null>(COORDS_KEY, null);
    if (saved) {
      setCoords(saved);
      setStatus("ready");
    }
  }, []);

  const listenToOrientation = useCallback(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const h = deviceHeading(e);
      if (h !== null) setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", handler as EventListener);
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  // Wire up the live compass (when the device exposes orientation).
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    const ctor = window.DeviceOrientationEvent as unknown as OrientationEventStatic;
    if (typeof ctor.requestPermission === "function") {
      // iOS — needs a user gesture to grant; show the button.
      setNeedsMotionPermission(true);
      return;
    }
    return listenToOrientation();
  }, [listenToOrientation]);

  function enableCompass() {
    const ctor = window.DeviceOrientationEvent as unknown as OrientationEventStatic;
    ctor.requestPermission?.().then((res) => {
      if (res === "granted") {
        setNeedsMotionPermission(false);
        listenToOrientation();
      }
    });
  }

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
        setStatus("ready");
        try {
          localStorage.setItem(COORDS_KEY, JSON.stringify(c));
        } catch {
          /* storage unavailable */
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 },
    );
  }

  const bearing = coords ? qiblaDirection(coords) : null;
  // Rotate the dial so N tracks true north; the needle sits at the fixed bearing.
  const dialRotation = heading === null ? 0 : -heading;
  const aligned = heading !== null && bearing !== null && angularGap(bearing, heading) < 5;

  return (
    <div className="qibla">
      {!coords && status !== "locating" && (
        <div className="prayer-cta">
          <p>Find the direction of the Kaaba from where you are. Your location stays on your device.</p>
          <button type="button" className="audio-play" onClick={locate}>
            📍 Use my location
          </button>
        </div>
      )}

      {status === "locating" && <p className="hifz-muted">Getting your location…</p>}
      {status === "denied" && (
        <div className="prayer-cta">
          <p>Location permission was denied. Enable it in your browser to find the qibla.</p>
          <button type="button" className="chip" onClick={locate}>
            Try again
          </button>
        </div>
      )}
      {status === "error" && (
        <p className="hifz-muted">Couldn’t determine your location. Check your settings and retry.</p>
      )}

      {bearing !== null && (
        <>
          <div className={aligned ? "qibla-dial-wrap qibla-aligned" : "qibla-dial-wrap"}>
            <div className="qibla-dial" style={{ transform: `rotate(${dialRotation}deg)` }}>
              <span className="qibla-cardinal qibla-n">N</span>
              <span className="qibla-cardinal qibla-e">E</span>
              <span className="qibla-cardinal qibla-s">S</span>
              <span className="qibla-cardinal qibla-w">W</span>
              <div className="qibla-needle" style={{ transform: `rotate(${bearing}deg)` }}>
                <span className="qibla-kaaba">🕋</span>
              </div>
            </div>
          </div>

          <div className="prayer-next">
            <span className="prayer-next-label">Qibla direction</span>
            <span className="prayer-next-name">
              {Math.round(bearing)}° {compassPoint(bearing)}
            </span>
            <span className="prayer-next-in">
              {heading === null
                ? "Measured clockwise from true north."
                : aligned
                  ? "You’re facing the qibla 🕋"
                  : "Turn until the 🕋 points straight up."}
            </span>
          </div>

          {needsMotionPermission && (
            <button type="button" className="chip" onClick={enableCompass}>
              🧭 Enable live compass
            </button>
          )}
          {!needsMotionPermission && heading === null && (
            <p className="hifz-muted">
              Live compass needs a device with an orientation sensor. The bearing above is still
              accurate — align it with a separate compass.
            </p>
          )}

          <div className="prayer-controls">
            <button type="button" className="chip" onClick={locate}>
              📍 Update location
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Smallest absolute difference between two bearings, in degrees (0–180). */
function angularGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
