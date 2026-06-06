"use client";

/**
 * Client-side access to the runtime translation catalogue (ADR 0011). The
 * editions list and each (edition, surah) text block are fetched on demand and
 * memoised, so the many per-ayah components on a page share one request each.
 */
import type { EditionChoice } from "./editions";

let cataloguePromise: Promise<EditionChoice[]> | null = null;

/** The full catalogue (~490 editions), fetched once per page load. */
export function fetchCatalogue(): Promise<EditionChoice[]> {
  cataloguePromise ??= fetch("/api/v1/translations")
    .then((r) => (r.ok ? (r.json() as Promise<{ translations: EditionChoice[] }>) : { translations: [] }))
    .then((d) => d.translations ?? [])
    .catch(() => []);
  return cataloguePromise;
}

const surahCache = new Map<string, Promise<Map<number, string>>>();

/** One edition's text for a surah (ayah → text), fetched once and cached. */
export function fetchEditionSurah(edition: string, surah: number): Promise<Map<number, string>> {
  const key = `${edition}:${surah}`;
  let pending = surahCache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/translations/${edition}/surahs/${surah}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ ayahs: { aya: number; text: string }[] }>) : { ayahs: [] },
      )
      .then((d) => new Map((d.ayahs ?? []).map((a) => [a.aya, a.text])))
      .catch(() => new Map<number, string>());
    surahCache.set(key, pending);
  }
  return pending;
}
