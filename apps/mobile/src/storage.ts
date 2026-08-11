/**
 * AsyncStorage-backed persistence. Mobile has no synchronous `localStorage`, so
 * everything here is async; the keys deliberately mirror the web reader's
 * `ul.*` keys so the two clients describe the same local-first state (ADR 0006).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  editions: "ul.editions",
  readingMode: "ul.readingMode",
  readingTranslation: "ul.readingTranslation",
  tafsir: "ul.tafsir",
  tafsirCompare: "ul.tafsirCompare",
  reciter: "ul.reciter",
  audioRate: "ul.audioRate",
  scale: "ul.scale",
  transliteration: "ul.transliteration",
  wbwTranslit: "ul.wbwTranslit",
  tapToHear: "ul.tapToHear",
  script: "ul.script",
  theme: "ul.theme",
  bookmarks: "ul.bookmarks",
  collections: "ul.collections",
  ayahNotes: "ul.ayahNotes",
  searchHistory: "ul.searchHistory",
  readingGoal: "ul.readingGoal",
  readingActive: "ul.readingActive",
  readingPages: "ul.readingPages",
  readingLog: "ul.readingLog",
  readingPlan: "ul.readingPlan",
  khatma: "ul.khatma",
  hifz: "ul.hifz",
  hifzStreak: "ul.hifz.streak",
  hifzReviewLog: "ul.hifz.reviewLog",
  lastRead: "ul.lastRead",
  asmaLearned: "ul.asmaLearned",
  tasbih: "ul.tasbih",
  adhkar: "ul.adhkar",
  prayerMethod: "ul.prayerMethod",
  prayerMadhab: "ul.prayerMadhab",
  prayerHighLat: "ul.prayerHighLat",
  prayerCoords: "ul.prayerCoords",
  prayerLog: "ul.prayerLog",
  qada: "ul.qada",
  haid: "ul.haid",
  fastingQada: "ul.fastingQada",
  badges: "ul.badges",
  hijriAdjust: "ul.hijriAdjust",
  zakat: "ul.zakat",
  onboarded: "ul.onboarded",
  ramadanFasts: "ul.ramadanFasts",
  ramadanWorship: "ul.ramadanWorship",
  planReminder: "ul.planReminder",
  prayerReminders: "ul.prayerReminders",
  adhkarReminders: "ul.adhkarReminders",
  sunnahFastReminders: "ul.sunnahFastReminders",
  islamicEventReminders: "ul.islamicEventReminders",
  adhkarTimings: "ul.adhkarTimings",
  locale: "ul.locale",
} as const;

export async function getJSON<T>(
  key: string,
  fallback: T,
  isValid?: (v: unknown) => boolean,
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as unknown;
    // Reject a valid-JSON value of the wrong shape (corrupt or peer-synced via
    // #25) so a non-array/non-object/NaN value can't crash a consumer downstream.
    return isValid && !isValid(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

/** A plain object map (not null, not an array) — for object-shaped stores. */
export const isObjectRecord = (v: unknown): boolean =>
  v !== null && typeof v === "object" && !Array.isArray(v);
/** A finite number — guards numeric prefs (e.g. font scale) against NaN/Infinity. */
export const isFiniteNumber = (v: unknown): boolean => typeof v === "number" && Number.isFinite(v);
/** A string[] — guards list prefs (e.g. editions). */
export const isStringArray = (v: unknown): boolean =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
/** A boolean — guards on/off prefs (e.g. transliteration). */
export const isBoolean = (v: unknown): boolean => typeof v === "boolean";

export async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}
