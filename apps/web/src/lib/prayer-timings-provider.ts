/**
 * Web `PrayerTimingsProvider` adapter: today's prayer timings for the stored
 * location. Fetches the existing `/api/v1/prayer-times` function once per day and
 * caches the result under `ul.adhkarTimings`; location and calculation config
 * come from the {@link webPrayerSettingsStore}. Returns `null` when no location
 * is stored (the reader hasn't used prayer times/qibla yet) or the lookup fails.
 * This keeps the reminder orchestration in `core` free of I/O.
 */
import type { PrayerTimings, PrayerTimingsProvider } from "@ummahlibrary/core";
import { webPrayerSettingsStore } from "./prayer-settings-store";

const TIMINGS_KEY = "ul.adhkarTimings";

function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const webPrayerTimingsProvider: PrayerTimingsProvider = {
  getTodaysTimings: async () => {
    const { coords, method, madhab, highLatitudeRule } = await webPrayerSettingsStore.read();
    if (!coords) return null;

    try {
      const raw = localStorage.getItem(TIMINGS_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { date: string; timings: PrayerTimings };
        if (cached.date === localDate()) return cached.timings;
      }
    } catch {
      /* fall through to refetch */
    }

    const params = new URLSearchParams({
      lat: String(coords.latitude),
      lng: String(coords.longitude),
      date: localDate(),
      method,
      madhab,
      hlr: highLatitudeRule,
    });
    try {
      const res = await fetch(`/api/v1/prayer-times?${params}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { timings: PrayerTimings };
      try {
        localStorage.setItem(TIMINGS_KEY, JSON.stringify({ date: localDate(), timings: data.timings }));
      } catch {
        /* ignore cache write failure */
      }
      return data.timings;
    } catch {
      return null;
    }
  },
};
