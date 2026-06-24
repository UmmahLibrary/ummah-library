/**
 * Mobile `LibraryStore` adapter (ADR 0024): the reader's saved library —
 * surah bookmarks, ayah collections, per-ayah notes — in AsyncStorage under the
 * existing `ul.bookmarks` / `ul.collections` / `ul.ayahNotes` keys. Persistence
 * only; a synced adapter (#25) can replace it without touching the library
 * logic. Mirrors web.
 */
import type { Collection, LibraryStore } from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "../storage";

export const mobileLibraryStore: LibraryStore = {
  readBookmarks: () => getJSON<number[]>(KEYS.bookmarks, [], Array.isArray),
  writeBookmarks: (surahs) => setJSON(KEYS.bookmarks, surahs),
  readCollections: () => getJSON<Collection[]>(KEYS.collections, [], Array.isArray),
  writeCollections: (collections) => setJSON(KEYS.collections, collections),
  readNotes: () => getJSON<Record<string, string>>(KEYS.ayahNotes, {}, isObjectRecord),
  writeNotes: (notes) => setJSON(KEYS.ayahNotes, notes),
};
