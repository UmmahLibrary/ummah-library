/**
 * Web `PrayerSettingsStore` adapter (ADR 0024): the reader's prayer-times
 * location and calculation config in `localStorage` under the existing
 * `ul.prayerCoords` / `ul.prayerMethod` / `ul.prayerMadhab` keys (shared by
 * prayer times, qibla, Ramadan, and reminders). Persistence only — `read()`
 * applies the defaults; a synced adapter (#25) can replace it. Mirrors mobile.
 */
import type { Coordinates, Madhab, PrayerSettingsStore } from "@ummahlibrary/core";
import { DEFAULT_CALCULATION_METHOD } from "@ummahlibrary/core";

const COORDS_KEY = "ul.prayerCoords";
const METHOD_KEY = "ul.prayerMethod";
const MADHAB_KEY = "ul.prayerMadhab";

export const webPrayerSettingsStore: PrayerSettingsStore = {
  read: async () => {
    let coords: Coordinates | null = null;
    let method = DEFAULT_CALCULATION_METHOD;
    let madhab: Madhab = "shafi";
    try {
      const raw = localStorage.getItem(COORDS_KEY);
      coords = raw ? (JSON.parse(raw) as Coordinates) : null;
    } catch {
      /* storage unavailable */
    }
    try {
      method = localStorage.getItem(METHOD_KEY) ?? DEFAULT_CALCULATION_METHOD;
    } catch {
      /* keep default */
    }
    try {
      madhab = (localStorage.getItem(MADHAB_KEY) as Madhab) || "shafi";
    } catch {
      /* keep default */
    }
    return { coords, method, madhab };
  },
  writeCoords: async (coords) => {
    try {
      if (coords) localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
      else localStorage.removeItem(COORDS_KEY);
    } catch {
      /* storage unavailable */
    }
  },
  writeMethod: async (method) => {
    try {
      localStorage.setItem(METHOD_KEY, method);
    } catch {
      /* storage unavailable */
    }
  },
  writeMadhab: async (madhab) => {
    try {
      localStorage.setItem(MADHAB_KEY, madhab);
    } catch {
      /* storage unavailable */
    }
  },
};
