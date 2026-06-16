/**
 * Surah bookmarks (ADR 0006), persisted through the `LibraryStore` port (web
 * adapter `webLibraryStore`, ADR 0024) under the existing `ul.bookmarks` key.
 * Replaces the per-component `localStorage` access the reader/dock/shelf used.
 */
import { webLibraryStore as store } from "./library-store";

export function readBookmarks(): Promise<number[]> {
  return store.readBookmarks();
}

/** Toggle a surah's bookmark; resolves with the updated (sorted) list. */
export async function toggleBookmark(surah: number): Promise<number[]> {
  const list = await store.readBookmarks();
  const next = list.includes(surah)
    ? list.filter((n) => n !== surah)
    : [...list, surah].sort((a, b) => a - b);
  await store.writeBookmarks(next);
  return next;
}
