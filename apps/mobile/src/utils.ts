/** Pure utility functions shared across mobile screens. All are deterministic and unit-tested. */

import tzLookup from "tz-lookup";
import type { Coordinates } from "@ummahlibrary/core";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD. Prayer times and goals are a local-time concept. */
export function localISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date as YYYY-MM-DD. Named for clarity in adhkar contexts (tallies reset each local day). */
export function adhkarToday(d = new Date()): string {
  return localISODate(d);
}

/** The IANA timezone for a location, or `undefined` if none is known/valid. */
export function timeZoneFor(coords: Coordinates | null | undefined): string | undefined {
  if (!coords) return undefined;
  try {
    return tzLookup(coords.latitude, coords.longitude);
  } catch {
    return undefined; // out-of-range lat/lng — let the caller fall back to device TZ
  }
}

/**
 * A prayer instant as a short locale time, in the timezone of the
 * *coordinates it was computed for* — not the device's own timezone.
 * `toLocaleTimeString` falls back to the device clock's zone when no
 * `timeZone` is given, which silently mis-renders every prayer time
 * whenever the viewing device's timezone doesn't match the saved location
 * (a traveler who hasn't updated their phone's TZ, a desktop browser, etc).
 */
export function fmtPrayerTime(src: string | Date, coords: Coordinates | null | undefined): string {
  const d = typeof src === "string" ? new Date(src) : src;
  if (Number.isNaN(d.getTime())) return "—";
  const timeZone = timeZoneFor(coords);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...(timeZone && { timeZone }) });
}

/** Human-readable countdown: "2h 15m" or "8m". Returns "0m" when target is past. */
export function fmtCountdown(target: Date, now: Date): string {
  if (Number.isNaN(target.getTime())) return "—"; // invalid target (e.g. a polar empty Fajr)
  const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs - h * 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * JS weekday (0 = Sunday) for a Gregorian civil date, computed via UTC
 * to avoid DST drift at local midnight.
 */
export function weekdayOfGregorian(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Wraps a state setter so a stale async result is silently discarded
 * instead of clobbering fresher state — guards a reload (e.g. a
 * sync-triggered `store.read()`) that raced an in-flight local write and
 * would otherwise revert it. `currentGen` reads the live generation
 * counter; `gen` is the value it held when the async call this wraps was
 * dispatched. Bump the counter on every local write; the wrapped setter
 * only fires if no write landed between dispatch and resolution.
 */
export function ignoreStale<T>(
  currentGen: () => number,
  gen: number,
  setter: (v: T) => void,
): (v: T) => void {
  return (v) => {
    if (currentGen() === gen) setter(v);
  };
}

/**
 * Races a promise against a timeout, rejecting if it doesn't settle in time.
 * `Location.getCurrentPositionAsync` (Mosque Finder, Qibla, Prayer Times) has
 * no built-in deadline — with weak/no GPS (common indoors, where these
 * screens are realistically used) it can hang indefinitely, leaving the UI
 * stuck on a loading spinner forever with nothing to catch and show the
 * existing "couldn't get your location" error state. This turns that
 * silent hang into a normal, already-handled rejection.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
