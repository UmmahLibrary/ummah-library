/**
 * Web `PrayerTrackerStore` adapter (ADR 0024): the prayer log in `localStorage`
 * under the existing `ul.prayerLog` key. Persistence only — the stats live in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the tracker. Mirrors mobile.
 */
import type { PrayerTrackerLog, PrayerTrackerStore } from "@ummahlibrary/core";

const LOG_KEY = "ul.prayerLog";

export const webPrayerTrackerStore: PrayerTrackerStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? (JSON.parse(raw) as PrayerTrackerLog) : {};
    } catch {
      return {};
    }
  },
  write: async (log) => {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch {
      /* storage unavailable */
    }
  },
};
