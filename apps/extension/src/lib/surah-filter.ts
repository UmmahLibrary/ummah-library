import { normalizeForSearch } from "@ummahlibrary/core";
import type { Surah } from "@ummahlibrary/core";

/**
 * Fold a Latin string for forgiving comparison: lowercase, strip combining
 * diacritics ("Ramaḍān" → "ramadan") and drop separators so "albaqara" matches
 * "Al-Baqara" and "the cow" matches "The Cow".
 */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Filter surahs for the quick-jump box. Pure and synchronous so it's trivially
 * testable. Matches:
 *  - a numeric query against the surah number (prefix),
 *  - otherwise the transliteration and English meaning (Latin-folded),
 *    and the Arabic name (via core's `normalizeForSearch`).
 * Returns at most `limit` results; an empty/blank query returns nothing.
 */
export function filterSurahs(
  surahs: readonly Surah[],
  query: string,
  limit = 8,
): readonly Surah[] {
  const q = query.trim();
  if (!q) return [];

  if (/^\d+$/.test(q)) {
    return surahs.filter((s) => String(s.number).startsWith(q)).slice(0, limit);
  }

  const latin = fold(q);
  const arabic = normalizeForSearch(q);
  return surahs
    .filter((s) => {
      if (latin && (fold(s.transliteration).includes(latin) || fold(s.englishName).includes(latin)))
        return true;
      if (arabic && normalizeForSearch(s.name).includes(arabic)) return true;
      return false;
    })
    .slice(0, limit);
}
