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
const TRANSLIT_KEY = "ul.transliteration";
const WORD_TRANSLIT_KEY = "ul.wbwTranslit";
const TAP_HEAR_KEY = "ul.tapToHear";
const SCRIPT_KEY = "ul.script";

function getJSON<T>(key: string, fallback: T, isValid?: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as unknown;
    // Reject a valid-JSON value of the wrong shape (corrupt or peer-synced via
    // #25) so e.g. a non-number scale can't become a NaN font size downstream.
    return isValid && !isValid(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}
const isStringArray = (v: unknown): boolean =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isFiniteNumber = (v: unknown): boolean => typeof v === "number" && Number.isFinite(v);
const isBoolean = (v: unknown): boolean => typeof v === "boolean";
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
    editions: getJSON<string[] | null>(EDITIONS_KEY, null, isStringArray),
    readingMode: getStr(READING_MODE_KEY),
    readingTranslation: getStr(READING_TR_KEY),
    reciter: getStr(RECITER_KEY),
    tafsir: getStr(TAFSIR_KEY),
    scale: getJSON<number | null>(SCALE_KEY, null, isFiniteNumber),
    transliteration: getJSON<boolean | null>(TRANSLIT_KEY, null, isBoolean),
    wordTransliteration: getJSON<boolean | null>(WORD_TRANSLIT_KEY, null, isBoolean),
    tapToHear: getJSON<boolean | null>(TAP_HEAR_KEY, null, isBoolean),
    script: getStr(SCRIPT_KEY),
  }),
  writeEditions: async (ids) => setItem(EDITIONS_KEY, JSON.stringify(ids)),
  writeReadingMode: async (mode) => setItem(READING_MODE_KEY, mode),
  writeReadingTranslation: async (id) => setItem(READING_TR_KEY, id),
  writeReciter: async (id) => setItem(RECITER_KEY, id),
  writeTafsir: async (id) => setItem(TAFSIR_KEY, id),
  writeScale: async (scale) => setItem(SCALE_KEY, JSON.stringify(scale)),
  writeTransliteration: async (on) => setItem(TRANSLIT_KEY, JSON.stringify(on)),
  writeWordTransliteration: async (on) => setItem(WORD_TRANSLIT_KEY, JSON.stringify(on)),
  writeTapToHear: async (on) => setItem(TAP_HEAR_KEY, JSON.stringify(on)),
  writeScript: async (script) => setItem(SCRIPT_KEY, script),
};
