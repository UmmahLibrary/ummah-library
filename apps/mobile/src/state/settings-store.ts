/**
 * Mobile `SettingsStore` adapter (ADR 0024): the reader's preferences in
 * AsyncStorage under the existing `ul.editions` / `ul.readingMode` /
 * `ul.readingTranslation` / `ul.reciter` / `ul.tafsir` / `ul.scale` keys.
 * Persistence only; a synced adapter (#25) can replace it without touching the
 * settings UI. Mirrors web.
 */
import type { SettingsStore, StoredSettings } from "@ummahlibrary/core";
import { KEYS, getJSON, getString, setJSON, setString } from "../storage";

export const mobileSettingsStore: SettingsStore = {
  read: async (): Promise<StoredSettings> => {
    const [editions, readingMode, readingTranslation, reciter, tafsir, scale] = await Promise.all([
      getJSON<string[] | null>(KEYS.editions, null),
      getString(KEYS.readingMode),
      getString(KEYS.readingTranslation),
      getString(KEYS.reciter),
      getString(KEYS.tafsir),
      getJSON<number | null>(KEYS.scale, null),
    ]);
    return { editions, readingMode, readingTranslation, reciter, tafsir, scale };
  },
  writeEditions: (ids) => setJSON(KEYS.editions, ids),
  writeReadingMode: (mode) => setString(KEYS.readingMode, mode),
  writeReadingTranslation: (id) => setString(KEYS.readingTranslation, id),
  writeReciter: (id) => setString(KEYS.reciter, id),
  writeTafsir: (id) => setString(KEYS.tafsir, id),
  writeScale: (scale) => setJSON(KEYS.scale, scale),
};
