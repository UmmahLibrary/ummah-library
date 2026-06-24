/**
 * Web `LibraryStore` adapter (ADR 0024): the reader's saved library —
 * surah bookmarks, ayah collections, per-ayah notes — in `localStorage` under
 * the existing `ul.bookmarks` / `ul.collections` / `ul.ayahNotes` keys.
 * Persistence only; a synced adapter (#25) can replace it without touching the
 * library logic. Mirrors mobile.
 */
import type { Collection, LibraryStore } from "@ummahlibrary/core";

const BOOKMARKS_KEY = "ul.bookmarks";
const COLLECTIONS_KEY = "ul.collections";
const NOTES_KEY = "ul.ayahNotes";

const isObject = (v: unknown): boolean => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Read + parse a key, falling back when it's absent, unparseable, OR a valid-JSON
 * value of the wrong shape (`isValid` fails). The last case matters once #25 sync
 * applies an untrusted peer value: a non-array `ul.bookmarks` would otherwise make
 * every consumer crash on `.includes`.
 */
function get<T>(key: string, fallback: T, isValid: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as unknown;
    return isValid(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}
function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export const webLibraryStore: LibraryStore = {
  readBookmarks: async () => get<number[]>(BOOKMARKS_KEY, [], Array.isArray),
  writeBookmarks: async (surahs) => set(BOOKMARKS_KEY, surahs),
  readCollections: async () => get<Collection[]>(COLLECTIONS_KEY, [], Array.isArray),
  writeCollections: async (collections) => set(COLLECTIONS_KEY, collections),
  readNotes: async () => get<Record<string, string>>(NOTES_KEY, {}, isObject),
  writeNotes: async (notes) => set(NOTES_KEY, notes),
};
