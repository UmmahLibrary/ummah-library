/**
 * Mobile `PrayerTrackerStore` adapter (ADR 0024): the prayer log in AsyncStorage
 * under the existing `ul.prayerLog` key. Persistence only — the stats live in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the tracker. Mirrors web.
 */
import type { PrayerTrackerLog, PrayerTrackerStore } from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "./storage";

export const mobilePrayerTrackerStore: PrayerTrackerStore = {
  read: () => getJSON<PrayerTrackerLog>(KEYS.prayerLog, {}, isObjectRecord),
  write: (log) => setJSON(KEYS.prayerLog, log),
};
