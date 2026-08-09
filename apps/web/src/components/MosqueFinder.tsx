"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Coordinates,
  type Place,
  directionsUrl,
  distanceKm,
  formatDistanceKm,
} from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { webPrayerSettingsStore } from "../lib/prayer-settings-store";

type Status = "idle" | "locating" | "loading" | "ready" | "denied" | "error" | "offline";

const RADIUS_OPTIONS = [
  { meters: 2000, label: "2 km" },
  { meters: 5000, label: "5 km" },
  { meters: 10000, label: "10 km" },
  { meters: 20000, label: "20 km" },
];

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

export function MosqueFinder() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [places, setPlaces] = useState<readonly Place[]>([]);
  const [radius, setRadius] = useState(5000);
  const reqId = useRef(0);

  const fetchNearby = useCallback(async (c: Coordinates, radiusMeters: number) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      return;
    }
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const params = new URLSearchParams({
        lat: String(c.latitude),
        lng: String(c.longitude),
        radius: String(radiusMeters),
      });
      const res = await fetch(`/api/v1/places/nearby?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { places: Place[] };
      if (id !== reqId.current) return;
      setPlaces(data.places);
      setStatus("ready");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, []);

  // Restore the shared location (same key as prayer times / qibla) on mount.
  useEffect(() => {
    void webPrayerSettingsStore.read().then(({ coords: saved }) => {
      if (saved) {
        setCoords(saved);
        void fetchNearby(saved, radius);
      }
    });
    // Only ever runs once on mount — `radius` is intentionally read fresh here,
    // not re-triggered when it changes (changeRadius below drives that refetch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNearby]);

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
        void webPrayerSettingsStore.writeCoords(c);
        void fetchNearby(c, radius);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 },
    );
  }

  function changeRadius(meters: number) {
    setRadius(meters);
    if (coords) void fetchNearby(coords, meters);
  }

  const radiusLabel = RADIUS_OPTIONS.find((r) => r.meters === radius)?.label ?? `${radius}m`;

  return (
    <div>
      {!coords && status !== "locating" && (
        <div style={ctaCard}>
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            Find mosques near you. Your location stays on your device — it's only sent to
            OpenStreetMap to search, never stored on our servers.
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
            Location permission was denied. Enable it in your browser to find nearby mosques.
          </p>
          <button type="button" style={{ ...ghostBtn, alignSelf: "flex-start" }} onClick={locate}>
            Try again
          </button>
        </div>
      )}

      {status === "offline" && (
        <div style={ctaCard}>
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            You’re offline. Mosque search needs an internet connection to reach OpenStreetMap.
          </p>
          <button
            type="button"
            style={{ ...ghostBtn, alignSelf: "flex-start" }}
            onClick={() => coords && fetchNearby(coords, radius)}
          >
            Try again
          </button>
        </div>
      )}

      {status === "error" && (
        <div style={ctaCard}>
          <p style={{ margin: 0, color: N.muted, lineHeight: 1.6 }}>
            Couldn’t load nearby mosques. Check your connection and retry.
          </p>
          <button
            type="button"
            style={{ ...ghostBtn, alignSelf: "flex-start" }}
            onClick={() => coords && fetchNearby(coords, radius)}
          >
            Try again
          </button>
        </div>
      )}

      {coords && (status === "ready" || status === "loading") && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 12.5, color: N.muted }}>Search radius</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.meters}
                type="button"
                onClick={() => changeRadius(r.meters)}
                aria-pressed={radius === r.meters}
                style={{
                  ...ghostBtn,
                  padding: "6px 12px",
                  borderColor: radius === r.meters ? N.gold : N.border,
                  color: radius === r.meters ? N.gold : N.muted,
                }}
              >
                {r.label}
              </button>
            ))}
            <button type="button" style={{ ...ghostBtn, marginLeft: "auto" }} onClick={locate}>
              📍 Update location
            </button>
          </div>

          {status === "loading" && <p style={{ color: N.muted }}>Searching nearby…</p>}

          {status === "ready" && places.length === 0 && (
            <p style={{ color: N.muted }}>
              No mosques found within {radiusLabel}. Try a wider radius.
            </p>
          )}

          {status === "ready" && places.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {places.map((p) => (
                <div
                  key={p.id}
                  style={{
                    ...cardStyle,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: N.fg }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>
                      {formatDistanceKm(distanceKm(coords, p.coordinates))}
                      {p.address ? ` · ${p.address}` : ""}
                    </div>
                  </div>
                  <a
                    href={directionsUrl(p.coordinates)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...ghostBtn, textDecoration: "none", flexShrink: 0 }}
                  >
                    Directions
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p style={{ marginTop: 18, color: N.faint, fontSize: 12.5 }}>
        Mosque data © OpenStreetMap contributors, published under the Open Database License
        (ODbL).
      </p>
    </div>
  );
}
