/**
 * Invariant structural facts about the Quran — pure data and logic, no I/O,
 * no framework, no database. These numbers never change; they are the single
 * source of truth the rest of the system validates against. (The `data`
 * package carries a test asserting its ingested metadata matches these.)
 */
import type { VerseKey } from "./entities";

/** The Quran has exactly 114 surahs (chapters). */
export const TOTAL_SURAHS = 114 as const;

/** The Quran is divided into 30 ajzāʾ (juzʾ / parts). */
export const TOTAL_JUZ = 30 as const;

/** The standard Madani Mushaf has 604 pages. */
export const TOTAL_PAGES_MADANI = 604 as const;

/** Total number of ayahs across all surahs (Kufi count). */
export const TOTAL_AYAHS = 6236 as const;

/** Ayah count of each surah, indexed by `surahNumber - 1`. Sums to 6236. */
export const AYAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37,
  35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
  8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** The verse at which each juzʾ begins, indexed by `juzNumber - 1`. */
export const JUZ_STARTS: readonly VerseKey[] = [
  { sura: 1, aya: 1 },
  { sura: 2, aya: 142 },
  { sura: 2, aya: 253 },
  { sura: 3, aya: 93 },
  { sura: 4, aya: 24 },
  { sura: 4, aya: 148 },
  { sura: 5, aya: 82 },
  { sura: 6, aya: 111 },
  { sura: 7, aya: 88 },
  { sura: 8, aya: 41 },
  { sura: 9, aya: 93 },
  { sura: 11, aya: 6 },
  { sura: 12, aya: 53 },
  { sura: 15, aya: 1 },
  { sura: 17, aya: 1 },
  { sura: 18, aya: 75 },
  { sura: 21, aya: 1 },
  { sura: 23, aya: 1 },
  { sura: 25, aya: 21 },
  { sura: 27, aya: 56 },
  { sura: 29, aya: 46 },
  { sura: 33, aya: 31 },
  { sura: 36, aya: 28 },
  { sura: 39, aya: 32 },
  { sura: 41, aya: 47 },
  { sura: 46, aya: 1 },
  { sura: 51, aya: 31 },
  { sura: 58, aya: 1 },
  { sura: 67, aya: 1 },
  { sura: 78, aya: 1 },
];

/** A surah number is an integer in the inclusive range [1, 114]. */
export function isValidSurahNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= TOTAL_SURAHS;
}

/** A juzʾ number is an integer in the inclusive range [1, 30]. */
export function isValidJuzNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= TOTAL_JUZ;
}

/** A Madani page number is an integer in the inclusive range [1, 604]. */
export function isValidPageNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= TOTAL_PAGES_MADANI;
}

/** Number of ayahs in a surah. Throws `RangeError` for an invalid surah. */
export function ayahCountOf(surah: number): number {
  if (!isValidSurahNumber(surah)) {
    throw new RangeError(`Invalid surah number: ${surah}`);
  }
  return AYAH_COUNTS[surah - 1]!;
}

/** Whether `{ sura, aya }` refers to an ayah that actually exists. */
export function isValidVerseRef(sura: number, aya: number): boolean {
  return (
    isValidSurahNumber(sura) && Number.isInteger(aya) && aya >= 1 && aya <= AYAH_COUNTS[sura - 1]!
  );
}

/** Order two verse references in mushaf order. Negative if `a` precedes `b`. */
export function compareVerseKeys(a: VerseKey, b: VerseKey): number {
  return a.sura !== b.sura ? a.sura - b.sura : a.aya - b.aya;
}

/** The juzʾ number (1–30) a verse belongs to. Throws for an invalid verse. */
export function juzNumberOf(ref: VerseKey): number {
  if (!isValidVerseRef(ref.sura, ref.aya)) {
    throw new RangeError(`Invalid verse reference: ${ref.sura}:${ref.aya}`);
  }
  let juz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    if (compareVerseKeys(JUZ_STARTS[i]!, ref) <= 0) juz = i + 1;
    else break;
  }
  return juz;
}
