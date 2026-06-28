/**
 * Bundled word-by-word recitation timings (ADR 0036). The player highlights words
 * and powers tap-to-hear from these instead of a runtime call to the quran.com
 * timing API. They're fetched once per (reciter, surah) from our own static
 * `/api/v1/recitations/{id}/surahs/{n}/timings` endpoint (prerendered, not a live
 * call) and cached for the page session. Reciters without bundled data (e.g.
 * Al-Ghamdi) and any uncovered ayah resolve to null so the caller can fall back.
 */

/** The player's per-word segment: [wordIndex, position, startMs, endMs]. */
export type Segment = [wordIndex: number, position: number, startMs: number, endMs: number];

/** The bundled compact form: [wordIndex, startMs, endMs] per word, per ayah. */
interface SurahTimingDoc {
  ayahs?: Record<string, [number, number, number][]>;
}

// One fetch per (reciter, surah), shared across the page.
const cache = new Map<string, Promise<Map<number, Segment[]> | null>>();

function fetchSurahTiming(reciterId: string, surah: number): Promise<Map<number, Segment[]> | null> {
  const key = `${reciterId}:${surah}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/recitations/${reciterId}/surahs/${surah}/timings`)
      .then((r) => (r.ok ? (r.json() as Promise<SurahTimingDoc>) : null))
      .then((doc) => {
        if (!doc?.ayahs) return null;
        const map = new Map<number, Segment[]>();
        for (const [aya, words] of Object.entries(doc.ayahs)) {
          map.set(
            Number(aya),
            words.map(([w, startMs, endMs]) => [w, w + 1, startMs, endMs] as Segment),
          );
        }
        return map;
      })
      .catch(() => null);
    cache.set(key, pending);
  }
  return pending;
}

/** Bundled word timings for one ayah, or null if the reciter/ayah isn't covered. */
export async function bundledSegments(
  reciterId: string,
  sura: number,
  aya: number,
): Promise<Segment[] | null> {
  const map = await fetchSurahTiming(reciterId, sura);
  return map?.get(aya) ?? null;
}
