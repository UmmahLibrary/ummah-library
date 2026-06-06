/**
 * Pure helpers for presenting the translation catalogue: grouping editions by
 * language and filtering them by a free-text query. The reader's "manage
 * translations" UI is a thin shell over these functions — all the ordering and
 * matching rules live here so they can be unit-tested in isolation.
 *
 * No I/O, no framework: this is core domain logic.
 */
import type { Translation } from "./entities";
import { displayLanguage } from "./languages";

/** A language and the editions available in it, ready to render as a section. */
export interface LanguageGroup {
  /** ISO-639 language code, e.g. "ur". */
  code: string;
  /** Language name in English, e.g. "Urdu". */
  english: string;
  /** Language name in its own script, e.g. "اردو". */
  native: string;
  /** Editions in this language, sorted by name. */
  translations: Translation[];
}

/** Lowercase and strip diacritics so "Jalāl" matches a search for "jalal". */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Group editions by language. Groups are ordered by English language name;
 * editions within a group are ordered by name. Pure and stable — equal keys
 * keep input order via a stable sort.
 */
export function groupTranslationsByLanguage(translations: Translation[]): LanguageGroup[] {
  const byCode = new Map<string, Translation[]>();
  for (const t of translations) {
    const list = byCode.get(t.language);
    if (list) list.push(t);
    else byCode.set(t.language, [t]);
  }

  const groups: LanguageGroup[] = [];
  for (const [code, list] of byCode) {
    const { english, native } = displayLanguage(code);
    groups.push({
      code,
      english,
      native,
      translations: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return groups.sort((a, b) => a.english.localeCompare(b.english));
}

/**
 * Filter editions by a free-text query, matching (case- and diacritic-
 * insensitive) against the edition name, author, and the language's English and
 * native names. An empty or whitespace-only query returns the input unchanged.
 */
export function filterTranslations(translations: Translation[], query: string): Translation[] {
  const q = normalize(query);
  if (!q) return translations;
  return translations.filter((t) => {
    const { english, native } = displayLanguage(t.language);
    const haystack = normalize(`${t.name} ${t.author} ${english} ${native}`);
    return haystack.includes(q);
  });
}
