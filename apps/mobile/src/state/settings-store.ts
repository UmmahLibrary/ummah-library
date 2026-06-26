/**
 * Mobile `SettingsStore` adapter (ADR 0024): the reader's preferences in
 * AsyncStorage under the existing `ul.editions` / `ul.readingMode` /
 * `ul.readingTranslation` / `ul.reciter` / `ul.tafsir` / `ul.scale` keys.
 * Persistence only; a synced adapter (#25) can replace it without touching the
 * settings UI. Mirrors web.
 */
import type { SettingsStore, StoredSettings } from "@ummahlibrary/core";
import {
  KEYS,
  getJSON,
  getString,
  isBoolean,
  isFiniteNumber,
  isStringArray,
  setJSON,
  setString,
} from "../storage";

export const mobileSettingsStore: SettingsStore = {
  read: async (): Promise<StoredSettings> => {
    const [
      editions,
      readingMode,
      readingTranslation,
      reciter,
      tafsir,
      scale,
      transliteration,
      wordTransliteration,
      tapToHear,
      script,
    ] = await Promise.all([
      getJSON<string[] | null>(KEYS.editions, null, isStringArray),
      getString(KEYS.readingMode),
      getString(KEYS.readingTranslation),
      getString(KEYS.reciter),
      getString(KEYS.tafsir),
      getJSON<number | null>(KEYS.scale, null, isFiniteNumber),
      getJSON<boolean | null>(KEYS.transliteration, null, isBoolean),
      getJSON<boolean | null>(KEYS.wbwTranslit, null, isBoolean),
      getJSON<boolean | null>(KEYS.tapToHear, null, isBoolean),
      getString(KEYS.script),
    ]);
    return {
      editions,
      readingMode,
      readingTranslation,
      reciter,
      tafsir,
      scale,
      transliteration,
      wordTransliteration,
      tapToHear,
      script,
    };
  },
  writeEditions: (ids) => setJSON(KEYS.editions, ids),
  writeReadingMode: (mode) => setString(KEYS.readingMode, mode),
  writeReadingTranslation: (id) => setString(KEYS.readingTranslation, id),
  writeReciter: (id) => setString(KEYS.reciter, id),
  writeTafsir: (id) => setString(KEYS.tafsir, id),
  writeScale: (scale) => setJSON(KEYS.scale, scale),
  writeTransliteration: (on) => setJSON(KEYS.transliteration, on),
  writeWordTransliteration: (on) => setJSON(KEYS.wbwTranslit, on),
  writeTapToHear: (on) => setJSON(KEYS.tapToHear, on),
  writeScript: (script) => setString(KEYS.script, script),
};
