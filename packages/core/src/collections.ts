/**
 * Bookmark collections + per-ayah notes — pure model helpers over plain arrays
 * and maps (the web persists them in `localStorage`, ADR 0006). Ayah-level and
 * separate from the existing surah-level bookmarks.
 */

import type { VerseKey } from "./entities";

export interface Collection {
  id: string;
  name: string;
  ayahs: VerseKey[];
}

/** Stable string key for an ayah, e.g. "2:255". */
export function ayahKey(ref: VerseKey): string {
  return `${ref.sura}:${ref.aya}`;
}

function sameAyah(a: VerseKey, b: VerseKey): boolean {
  return a.sura === b.sura && a.aya === b.aya;
}

export function createCollection(
  collections: readonly Collection[],
  id: string,
  name: string,
): Collection[] {
  const trimmed = name.trim();
  if (!trimmed) return [...collections];
  return [...collections, { id, name: trimmed, ayahs: [] }];
}

/**
 * Save an āyah into the collection called `name`, creating it if needed. A
 * name that already exists (ignoring case and surrounding spaces) reuses that
 * collection instead of making a second "Favourites" — and an āyah already in
 * it stays in (this never removes). A blank name changes nothing.
 */
export function saveToNamedCollection(
  collections: readonly Collection[],
  newId: string,
  name: string,
  ref: VerseKey,
): Collection[] {
  const trimmed = name.trim();
  if (!trimmed) return [...collections];
  const existing = collections.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return isInCollection(existing, ref)
      ? [...collections]
      : toggleAyah(collections, existing.id, ref);
  }
  return toggleAyah(createCollection(collections, newId, trimmed), newId, ref);
}

export function renameCollection(
  collections: readonly Collection[],
  id: string,
  name: string,
): Collection[] {
  const trimmed = name.trim();
  return collections.map((c) => (c.id === id && trimmed ? { ...c, name: trimmed } : c));
}

export function deleteCollection(collections: readonly Collection[], id: string): Collection[] {
  return collections.filter((c) => c.id !== id);
}

/** Add an ayah to a collection (no duplicates) or remove it if already there. */
export function toggleAyah(
  collections: readonly Collection[],
  id: string,
  ref: VerseKey,
): Collection[] {
  return collections.map((c) => {
    if (c.id !== id) return c;
    const has = c.ayahs.some((a) => sameAyah(a, ref));
    return {
      ...c,
      ayahs: has
        ? c.ayahs.filter((a) => !sameAyah(a, ref))
        : [...c.ayahs, { sura: ref.sura, aya: ref.aya }],
    };
  });
}

export function isInCollection(collection: Collection, ref: VerseKey): boolean {
  return collection.ayahs.some((a) => sameAyah(a, ref));
}

/** The ids of collections that contain an ayah. */
export function collectionsWithAyah(collections: readonly Collection[], ref: VerseKey): string[] {
  return collections.filter((c) => isInCollection(c, ref)).map((c) => c.id);
}

/** Total distinct ayahs saved across all collections. */
export function totalSavedAyahs(collections: readonly Collection[]): number {
  const keys = new Set<string>();
  for (const c of collections) for (const a of c.ayahs) keys.add(ayahKey(a));
  return keys.size;
}
