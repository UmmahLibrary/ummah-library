/**
 * Mobile `PrayerTimingsProvider` adapter: today's prayer timings for the stored
 * location, fetched once per day from the REST API (`api.getPrayerTimes`) and
 * cached in AsyncStorage. Returns `null` when no location is stored or the
 * lookup fails. Keeps the reminder orchestration in `core` free of I/O. Mirrors
 * the web adapter (which fetches the same function).
 */
import type { PrayerTimings, PrayerTimingsProvider } from "@ummahlibrary/core";
import { api } from "./api";
import { KEYS, getJSON, setJSON } from "./storage";
import { mobilePrayerSettingsStore } from "./prayer-settings-store";
import { localISODate } from "./utils";

export const mobilePrayerTimingsProvider: PrayerTimingsProvider = {
  getTodaysTimings: async () => {
    const { coords, method, madhab, highLatitudeRule } = await mobilePrayerSettingsStore.read();
    if (!coords) return null;

    const date = localISODate(new Date());
    // Cache identity = day + every input that changes the result, so a location/
    // method/madhab/high-latitude change invalidates the cache the same day.
    const key = `${date}|${coords.latitude},${coords.longitude}|${method}|${madhab}|${highLatitudeRule ?? ""}`;
    const cached = await getJSON<{ key?: string; timings: PrayerTimings } | null>(
      KEYS.adhkarTimings,
      null,
    );
    if (cached && cached.key === key) return cached.timings;

    try {
      const timings = (await api.getPrayerTimes({
        lat: coords.latitude,
        lng: coords.longitude,
        date,
        method,
        madhab,
        hlr: highLatitudeRule,
      })) as PrayerTimings;
      await setJSON(KEYS.adhkarTimings, { key, timings });
      return timings;
    } catch {
      return null;
    }
  },
};
