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
 * Score one text against pre-tokenised query terms. Returns `null` unless every
 * token is present (AND match). The score rewards token coverage, word-boundary
 * hits, and a whole-phrase occurrence so the most relevant rows sort first.
 */
function scoreText(text: string, tokens: readonly string[], phrase: string): number | null {
  const hay = normalizeForSearch(text);
  let score = 0;
  for (const token of tokens) {
    if (hay.indexOf(token) === -1) return null;
    score += 1;
    if (new RegExp(`(^|\\s)${escapeRegExp(token)}`).test(hay)) score += 1;
  }
  if (tokens.length > 1 && hay.includes(phrase)) score += tokens.length;
  return score;
}

function tokenize(query: string): { tokens: string[]; phrase: string } {
  const phrase = normalizeForSearch(query);
  return { phrase, tokens: phrase.split(/\s+/).filter(Boolean) };
}

/**
 * Generic free-text ranking over any items carrying a `text` field. All
 * whitespace-separated tokens must be present (AND match); results are sorted
 * by score high-to-low. A blank query returns `[]`. Sort is stable for equal
 * scores, preserving input order.
 */
export function searchText<T extends { text: string }>(
  items: readonly T[],
  query: string,
  limit = 50,
): (T & { score: number })[] {
  const { tokens, phrase } = tokenize(query);
  if (tokens.length === 0) return [];
  const results: (T & { score: number })[] = [];
  for (const item of items) {
    const score = scoreText(item.text, tokens, phrase);
    if (score !== null) results.push({ ...item, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Rank verses against a free-text query (see {@link searchText}). Ties break on
 * verse order then source so results are stable. A blank query returns `[]`.
 */
export function searchVerses(
  entries: readonly SearchEntry[],
  query: string,
  limit = 50,
): SearchResult[] {
  const { tokens, phrase } = tokenize(query);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const score = scoreText(entry.text, tokens, phrase);
    if (score !== null) results.push({ ...entry, score });
  }

  results.sort(
    (a, b) => b.score - a.score || a.sura - b.sura || a.aya - b.aya || a.source.localeCompare(b.source),
  );
  return results.slice(0, limit);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
