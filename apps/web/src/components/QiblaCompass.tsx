"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { type Coordinates, compassPoint, qiblaDirection } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";

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

const cardStyle: CSSProperties = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
};

const ctaCard: CSSProperties = {
  ...cardStyle,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

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
    alignSelf: "flex-start",
  };
  const ghostBtn: CSSProperties = {
    fontFamily: N.ui,
    fontSize: 13.5,
    color: N.muted,
    background: N.card,
    border: `1px solid ${N.border}`,
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
  };

  return (
    <div>
      {!coords && status !== "locating" && (
        <div style={ctaCard}>
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            Find the direction of the Kaaba from where you are. Your location stays on your device.
          </p>
          <button type="button" style={ctaBtn} onClick={locate}>
            📍 Use my location
          </button>
        </div>
      )}

      {status === "locating" && <p style={{ color: N.muted }}>Getting your location…</p>}
      {status === "denied" && (
        <div style={ctaCard}>
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            Location permission was denied. Enable it in your browser to find the qibla.
          </p>
          <button type="button" style={{ ...ghostBtn, alignSelf: "flex-start" }} onClick={locate}>
            Try again
          </button>
        </div>
      )}
      {status === "error" && (
        <p style={{ color: N.muted }}>
          Couldn’t determine your location. Check your settings and retry.
        </p>
      )}

      {bearing !== null && (
        <>
          <div
            style={{
              ...cardStyle,
              padding: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: 300, height: 300, marginBottom: 8 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${aligned ? N.gold : N.border}`,
                  boxShadow: aligned ? `0 0 0 4px ${N.goldSoft}` : "none",
                  transform: `rotate(${dialRotation}deg)`,
                  transition: "transform .1s, border-color .2s",
                }}
              >
                {[..."NESW"].map((d, i) => (
                  <span
                    key={d}
                    style={{
                      position: "absolute",
                      fontSize: 14,
                      fontWeight: 700,
                      color: d === "N" ? N.gold : N.faint,
                      top: i === 0 ? 12 : i === 2 ? "auto" : "50%",
                      bottom: i === 2 ? 12 : "auto",
                      left: i === 3 ? 14 : i === 1 ? "auto" : "50%",
                      right: i === 1 ? 14 : "auto",
                      transform: i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)",
                    }}
                  >
                    {d}
                  </span>
                ))}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 1,
                      height: i % 6 === 0 ? 12 : 6,
                      background: N.border,
                      transformOrigin: "center 138px",
                      transform: `translate(-50%,-138px) rotate(${i * 15}deg)`,
                    }}
                  />
                ))}
                {/* qibla pointer — fixed to the compass ring at the bearing */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transformOrigin: "center bottom",
                    transform: `translate(-50%,-100%) rotate(${bearing}deg)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      marginBottom: -6,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        background: N.goldGrad,
                        borderRadius: 6,
                        display: "grid",
                        placeItems: "center",
                        color: N.ink,
                        fontSize: 16,
                        transform: `rotate(${-bearing + (heading ?? 0)}deg)`,
                      }}
                    >
                      🕋
                    </div>
                  </div>
                  <div style={{ width: 4, height: 118, background: N.goldGrad, borderRadius: 2 }} />
                </div>
              </div>
              {/* center hub */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: N.gold,
                  border: `3px solid ${N.bg}`,
                  transform: "translate(-50%,-50%)",
                }}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: N.faint,
                  fontWeight: 700,
                }}
              >
                Qibla direction
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: N.gold,
                  letterSpacing: -1,
                  margin: "4px 0 2px",
                }}
              >
                {Math.round(bearing)}° {compassPoint(bearing)}
              </div>
              <div style={{ fontSize: 13.5, color: N.muted }}>
                {heading === null
                  ? "Measured clockwise from true north."
                  : aligned
                    ? "You’re facing the qibla 🕋"
                    : "Turn until the 🕋 points straight up."}
              </div>
            </div>
          </div>

          {needsMotionPermission && (
            <button type="button" style={{ ...ghostBtn, marginTop: 16 }} onClick={enableCompass}>
              🧭 Enable live compass
            </button>
          )}
          {!needsMotionPermission && heading === null && (
            <p style={{ color: N.faint, fontSize: 13, lineHeight: 1.6, marginTop: 16 }}>
              Live compass needs a device with an orientation sensor. The bearing above is still
              accurate — align it with a separate compass.
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="button" style={ghostBtn} onClick={locate}>
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
