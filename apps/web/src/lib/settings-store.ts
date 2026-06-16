/**
 * Web `SettingsStore` adapter (ADR 0024): the reader's preferences in
 * `localStorage` under the existing `ul.editions` / `ul.readingMode` /
 * `ul.readingTranslation` / `ul.reciter` / `ul.tafsir` / `ul.scale` keys.
 * Editions and scale are JSON; the rest are plain strings (matching what the
 * reader has always written). Persistence only — a synced adapter (#25) can
 * replace it without touching the settings UI. Mirrors mobile.
 */
import type { SettingsStore, StoredSettings } from "@ummahlibrary/core";

const EDITIONS_KEY = "ul.editions";
const READING_MODE_KEY = "ul.readingMode";
const READING_TR_KEY = "ul.readingTranslation";
const RECITER_KEY = "ul.reciter";
const TAFSIR_KEY = "ul.tafsir";
const SCALE_KEY = "ul.scale";

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function getStr(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export const webSettingsStore: SettingsStore = {
  read: async (): Promise<StoredSettings> => ({
    editions: getJSON<string[] | null>(EDITIONS_KEY, null),
    readingMode: getStr(READING_MODE_KEY),
    readingTranslation: getStr(READING_TR_KEY),
    reciter: getStr(RECITER_KEY),
    tafsir: getStr(TAFSIR_KEY),
    scale: getJSON<number | null>(SCALE_KEY, null),
  }),
  writeEditions: async (ids) => setItem(EDITIONS_KEY, JSON.stringify(ids)),
  writeReadingMode: async (mode) => setItem(READING_MODE_KEY, mode),
  writeReadingTranslation: async (id) => setItem(READING_TR_KEY, id),
  writeReciter: async (id) => setItem(RECITER_KEY, id),
  writeTafsir: async (id) => setItem(TAFSIR_KEY, id),
  writeScale: async (scale) => setItem(SCALE_KEY, JSON.stringify(scale)),
};
