import { normalize } from "./translations";

/** One indexable unit: a verse's text in a given source (Arabic or a translation). */
export interface SearchEntry {
  /** Verse key, e.g. "2:255". */
  key: string;
  sura: number;
  aya: number;
  text: string;
  /** Label for the source, e.g. "ar" or a translation slug — shown in results. */
  source: string;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

/**
 * Search normalisation on top of {@link normalize}: also strips Arabic
 * diacritics (harakat), tatweel and unifies alef/ya/ta-marbuta variants so a
 * query matches regardless of tashkeel or spelling variants.
 */
export function normalizeForSearch(value: string): string {
  return normalize(value)
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "") // Arabic marks
    .replace(/ـ/g, "") // tatweel
    .replace(/[آأإٱ]/g, "ا") // alef variants → ا
    .replace(/ى/g, "ي") // alef maqsura → ي
    .replace(/ة/g, "ه"); // ta marbuta → ه
}

/**
 * Rank verses against a free-text query. All whitespace-separated tokens must
 * be present in an entry (AND match); entries are scored by token coverage, a
 * whole-phrase bonus, and word-boundary hits, then sorted high-to-low. Ties
 * break on verse order so results are stable. A blank query returns `[]`.
 */
export function searchVerses(
  entries: readonly SearchEntry[],
  query: string,
  limit = 50,
): SearchResult[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const hay = normalizeForSearch(entry.text);
    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const idx = hay.indexOf(token);
      if (idx === -1) {
        matchedAll = false;
        break;
      }
      score += 1;
      // Word-boundary occurrence is a stronger signal than a substring.
      if (new RegExp(`(^|\\s)${escapeRegExp(token)}`).test(hay)) score += 1;
    }
    if (!matchedAll) continue;
    if (tokens.length > 1 && hay.includes(q)) score += tokens.length; // whole-phrase bonus
    results.push({ ...entry, score });
  }

  results.sort(
    (a, b) => b.score - a.score || a.sura - b.sura || a.aya - b.aya || a.source.localeCompare(b.source),
  );
  return results.slice(0, limit);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
