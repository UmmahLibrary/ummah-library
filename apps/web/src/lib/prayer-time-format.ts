/**
 * Formats a computed prayer instant (an absolute UTC `Date`/ISO string) as a
 * wall-clock time in the timezone of the *coordinates it was computed for* —
 * not the device's own timezone. `Date#toLocaleTimeString` falls back to
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` (the device clock) when
 * no `timeZone` is given, which silently mis-renders every prayer time
 * whenever the viewing device's timezone doesn't match the saved location
 * (a traveler who hasn't updated their phone's TZ, a desktop browser, etc).
 * `tz-lookup` derives the IANA zone for the coordinates offline, so the
 * result matches local wall-clock time (including DST) for that place.
 */
import tzLookup from "tz-lookup";
import type { Coordinates } from "@ummahlibrary/core";

/** The IANA timezone for a location, or `undefined` if none is known/valid. */
export function timeZoneFor(coords: Coordinates | null | undefined): string | undefined {
  if (!coords) return undefined;
  try {
    return tzLookup(coords.latitude, coords.longitude);
  } catch {
    return undefined; // out-of-range lat/lng — let the caller fall back to device TZ
  }
}

/** A prayer instant as `HH:MM`, in the location's timezone when known. */
export function fmtPrayerTime(src: string | Date, coords: Coordinates | null | undefined): string {
  const d = typeof src === "string" ? new Date(src) : src;
  // A polar-invalid timing is "" (→ Invalid Date); show a dash, not "Invalid Date" / a throw.
  if (Number.isNaN(d.getTime())) return "—";
  const timeZone = timeZoneFor(coords);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...(timeZone && { timeZone }) });
}
