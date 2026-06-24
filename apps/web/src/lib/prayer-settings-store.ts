/**
 * Web `PrayerSettingsStore` adapter (ADR 0024): the reader's prayer-times
 * location and calculation config in `localStorage` under the existing
 * `ul.prayerCoords` / `ul.prayerMethod` / `ul.prayerMadhab` / `ul.prayerHighLat`
 * keys (shared by prayer times, qibla, Ramadan, and reminders). Persistence
 * only — `read()` applies the defaults; a synced adapter (#25) can replace it.
 * Mirrors mobile.
 */
import type {
  Coordinates,
  HighLatitudeRuleId,
  Madhab,
  PrayerSettingsStore,
} from "@ummahlibrary/core";
import {
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIGH_LATITUDE_RULE,
  isCalculationMethod,
  isHighLatitudeRule,
} from "@ummahlibrary/core";

/** A usable coordinate pair (finite lat/lng) — guards a corrupt/peer-synced value. */
function validCoords(v: unknown): Coordinates | null {
  if (v === null || typeof v !== "object") return null;
  const c = v as { latitude?: unknown; longitude?: unknown };
  return typeof c.latitude === "number" &&
    Number.isFinite(c.latitude) &&
    typeof c.longitude === "number" &&
    Number.isFinite(c.longitude)
    ? (v as Coordinates)
    : null;
}

const COORDS_KEY = "ul.prayerCoords";
const METHOD_KEY = "ul.prayerMethod";
const MADHAB_KEY = "ul.prayerMadhab";
const HIGH_LAT_KEY = "ul.prayerHighLat";

export const webPrayerSettingsStore: PrayerSettingsStore = {
  read: async () => {
    let coords: Coordinates | null = null;
    let method = DEFAULT_CALCULATION_METHOD;
    let madhab: Madhab = "shafi";
    let highLatitudeRule: HighLatitudeRuleId = DEFAULT_HIGH_LATITUDE_RULE;
    try {
      const raw = localStorage.getItem(COORDS_KEY);
      coords = raw ? validCoords(JSON.parse(raw) as unknown) : null;
    } catch {
      /* storage unavailable */
    }
    try {
      const m = localStorage.getItem(METHOD_KEY);
      method = m && isCalculationMethod(m) ? m : DEFAULT_CALCULATION_METHOD;
    } catch {
      /* keep default */
    }
    try {
      const md = localStorage.getItem(MADHAB_KEY);
      madhab = md === "hanafi" || md === "shafi" ? md : "shafi";
    } catch {
      /* keep default */
    }
    try {
      const raw = localStorage.getItem(HIGH_LAT_KEY);
      if (raw && isHighLatitudeRule(raw)) highLatitudeRule = raw;
    } catch {
      /* keep default */
    }
    return { coords, method, madhab, highLatitudeRule };
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
  writeHighLatitudeRule: async (rule) => {
    try {
      localStorage.setItem(HIGH_LAT_KEY, rule);
    } catch {
      /* storage unavailable */
    }
  },
};
