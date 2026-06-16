/**
 * Local-first prayer log (ADR 0006, 0020): which of the five obligatory prayers
 * you prayed each day, on time or late. Persistence goes through the
 * `PrayerTrackerStore` port (web adapter `webPrayerTrackerStore`, ADR 0024); the
 * stats live in `@ummahlibrary/core`. A window event lets the tracker page
 * re-render when the log changes.
 */

import {
  type PrayerName,
  type PrayerTrackerLog,
  nextPrayerStatus,
  setPrayerStatus,
  statusFor,
} from "@ummahlibrary/core";
import { webPrayerTrackerStore as store } from "./prayer-tracker-store";

export const PRAYER_TRACKER_EVENT = "ul.prayerTracker";

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(PRAYER_TRACKER_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readPrayerLog(): Promise<PrayerTrackerLog> {
  return store.read();
}

/** Advance one prayer to its next status (none → ontime → late → none) and persist. */
export async function cyclePrayer(date: string, prayer: PrayerName): Promise<PrayerTrackerLog> {
  const log = await store.read();
  const next = setPrayerStatus(log, date, prayer, nextPrayerStatus(statusFor(log[date], prayer)));
  await store.write(next);
  emit();
  return next;
}
