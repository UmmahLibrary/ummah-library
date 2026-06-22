/**
 * Mobile `PrayerSettingsStore` adapter (ADR 0024): the reader's prayer-times
 * location and calculation config in AsyncStorage under the same `ul.*` keys the
 * web uses. Persistence only; `read()` applies the defaults. Mirrors the web
 * adapter.
 */
import {
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIGH_LATITUDE_RULE,
  type HighLatitudeRuleId,
  type Madhab,
  type PrayerSettingsStore,
  isHighLatitudeRule,
} from "@ummahlibrary/core";
import { KEYS, getJSON, getString, setJSON, setString } from "./storage";

export const mobilePrayerSettingsStore: PrayerSettingsStore = {
  read: async () => {
    const [coords, method, madhab, highLat] = await Promise.all([
      getJSON<Coordinates | null>(KEYS.prayerCoords, null),
      getString(KEYS.prayerMethod),
      getString(KEYS.prayerMadhab),
      getString(KEYS.prayerHighLat),
    ]);
    return {
      coords,
      method: method ?? DEFAULT_CALCULATION_METHOD,
      madhab: (madhab as Madhab) || "shafi",
      highLatitudeRule: highLat && isHighLatitudeRule(highLat) ? highLat : DEFAULT_HIGH_LATITUDE_RULE,
    };
  },
  // `null` is stored as JSON null, which read-back resolves to the fallback.
  writeCoords: (coords) => setJSON(KEYS.prayerCoords, coords),
  writeMethod: (method) => setString(KEYS.prayerMethod, method),
  writeMadhab: (madhab) => setString(KEYS.prayerMadhab, madhab),
  writeHighLatitudeRule: (rule: HighLatitudeRuleId) => setString(KEYS.prayerHighLat, rule),
};
