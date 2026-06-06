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
  reciter: "ul.reciter",
  scale: "ul.scale",
  theme: "ul.theme",
  bookmarks: "ul.bookmarks",
  hifz: "ul.hifz",
  lastRead: "ul.lastRead",
} as const;

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

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
