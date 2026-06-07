/**
 * Qibla domain: the direction of the Kaaba from any point on Earth.
 *
 * Unlike prayer times (which need an astronomy library behind the
 * {@link PrayerTimesCalculator} port), the qibla is a closed-form great-circle
 * bearing — pure arithmetic with no external dependency — so it lives entirely
 * in `core` and is unit-tested directly. See docs/adr/0013-qibla.md.
 */

import type { Coordinates } from "./prayer";

/** The Kaaba in Makkah — the point every qibla bearing points toward. */
export const KAABA: Coordinates = { latitude: 21.4225, longitude: 39.8262 };

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Initial great-circle bearing from `from` to the Kaaba, in degrees clockwise
 * from true north (0–360). At the Kaaba itself the bearing is undefined; we
 * return 0.
 */
export function qiblaDirection(from: Coordinates): number {
  const phi1 = toRad(from.latitude);
  const phi2 = toRad(KAABA.latitude);
  const dLambda = toRad(KAABA.longitude - from.longitude);

  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);
  if (y === 0 && x === 0) return 0;

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** The eight compass points, clockwise from north. */
export const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** The nearest 8-point compass label for a bearing in degrees (0–360). */
export function compassPoint(bearing: number): CompassPoint {
  const i = Math.round(((bearing % 360) + 360) / 45) % 8;
  return COMPASS_POINTS[i]!;
}
