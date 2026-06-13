/**
 * Local-first prayer log (ADR 0006, 0020): which of the five obligatory prayers
 * you prayed each day, on time or late. All in `localStorage`; the stats live in
 * `@ummahlibrary/core`. A window event lets the tracker page re-render when the
 * log changes (and would let a home widget subscribe later).
 */

import {
  type PrayerName,
  type PrayerTrackerLog,
  nextPrayerStatus,
  setPrayerStatus,
  statusFor,
} from "@ummahlibrary/core";

export const PRAYER_TRACKER_EVENT = "ul.prayerTracker";
const LOG_KEY = "ul.prayerLog";

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}
function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(PRAYER_TRACKER_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readPrayerLog(): PrayerTrackerLog {
  return get<PrayerTrackerLog>(LOG_KEY, {});
}

/** Advance one prayer to its next status (none → ontime → late → none) and persist. */
export function cyclePrayer(date: string, prayer: PrayerName): PrayerTrackerLog {
  const log = readPrayerLog();
  const next = setPrayerStatus(log, date, prayer, nextPrayerStatus(statusFor(log[date], prayer)));
  set(LOG_KEY, next);
  emit();
  return next;
}
