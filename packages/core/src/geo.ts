/**
 * Geo domain: distance and a directions-link formatter for two points on
 * Earth. Like the qibla bearing (ADR 0013), these are closed-form
 * calculations / string formatting with no external dependency, so they live
 * in `core` directly — not behind a port. Used by the nearby-mosque finder
 * (ADR 0038), which sorts and labels `Place`s returned by `PlacesProvider`.
 */
import type { Coordinates } from "./prayer";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle (haversine) distance between two points, in kilometres. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  // Clamp for float rounding at h ~ 1 (antipodal points) so asin never sees > 1.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sorts items with a `coordinates` field nearest-first from `origin`. */
export function sortByDistance<T extends { coordinates: Coordinates }>(
  origin: Coordinates,
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => distanceKm(origin, a.coordinates) - distanceKm(origin, b.coordinates),
  );
}

/** A short human-readable distance: metres under 1 km, kilometres beyond. */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/**
 * A universal "get directions" link to a point — a Google Maps URL that opens
 * the device's own maps app via its universal-link handler on iOS/Android, or
 * Google Maps in a browser on desktop. No API key; works for any destination.
 * Web renders it as a plain `<a href>`; mobile hands it to `Linking.openURL`.
 */
export function directionsUrl(coords: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
}
