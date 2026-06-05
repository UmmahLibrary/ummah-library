/**
 * Invariant structural facts about the Quran. These never change and live in
 * the core as plain data/logic — no I/O, no framework, no database.
 */

/** The Quran has exactly 114 surahs (chapters). */
export const TOTAL_SURAHS = 114 as const;

/** The Quran is divided into 30 ajzāʾ (juzʾ / parts). */
export const TOTAL_JUZ = 30 as const;

/** The standard Madani Mushaf has 604 pages. */
export const TOTAL_PAGES_MADANI = 604 as const;

/** A surah number is an integer in the inclusive range [1, 114]. */
export function isValidSurahNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= TOTAL_SURAHS;
}

/** A juzʾ number is an integer in the inclusive range [1, 30]. */
export function isValidJuzNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= TOTAL_JUZ;
}
