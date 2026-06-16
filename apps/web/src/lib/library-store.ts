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

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
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
  readBookmarks: async () => get<number[]>(BOOKMARKS_KEY, []),
  writeBookmarks: async (surahs) => set(BOOKMARKS_KEY, surahs),
  readCollections: async () => get<Collection[]>(COLLECTIONS_KEY, []),
  writeCollections: async (collections) => set(COLLECTIONS_KEY, collections),
  readNotes: async () => get<Record<string, string>>(NOTES_KEY, {}),
  writeNotes: async (notes) => set(NOTES_KEY, notes),
};
