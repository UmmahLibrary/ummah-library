/**
 * Domain entities — plain, framework-free types that model the Quran.
 * These are the vocabulary the whole system speaks; adapters map external
 * shapes (JSON, DB rows) into these, and apps render them.
 */

export type RevelationPlace = "meccan" | "medinan";
export type TextDirection = "rtl" | "ltr";

/** A reference to a single ayah: surah number + ayah number within it. */
export interface VerseKey {
  /** Surah number, 1–114. */
  sura: number;
  /** Ayah number within the surah, 1–based. */
  aya: number;
}

/** A surah (chapter) and its structural metadata. */
export interface Surah {
  number: number;
  /** Arabic name, e.g. "البقرة". */
  name: string;
  /** Latin transliteration, e.g. "Al-Baqara". */
  transliteration: string;
  /** English meaning, e.g. "The Cow". */
  englishName: string;
  revelationPlace: RevelationPlace;
  /** Order of revelation, 1–114. */
  revelationOrder: number;
  ayahCount: number;
  rukus: number;
  /** True for every surah except At-Tawbah (9). */
  hasBismillah: boolean;
}

/** A single ayah of the Arabic text. */
export interface Ayah extends VerseKey {
  text: string;
}

/** A juzʾ (one of the 30 parts) and the verse it begins at. */
export interface Juz {
  number: number;
  start: VerseKey;
}

/** A Madani-Mushaf page (1–604) and the verse it begins at. */
export interface Page {
  number: number;
  start: VerseKey;
}

/** Metadata describing one translation edition. */
export interface Translation {
  id: string;
  name: string;
  author: string;
  /** ISO-639 language code, e.g. "en", "ur", "bn". */
  language: string;
  direction: TextDirection;
}

/** A single ayah rendered in one translation. */
export interface TranslatedAyah extends VerseKey {
  translationId: string;
  text: string;
}

/** A tafsir (commentary) entry for one ayah. */
export interface TafsirEntry extends VerseKey {
  tafsirId: string;
  text: string;
}

/** A single hadith within a collection. */
export interface Hadith {
  collectionId: string;
  number: number;
  text: string;
  grades: string[];
  reference: { book: number; hadith: number };
}

/** One section (book/chapter) of a hadith collection with its hadiths. */
export interface HadithSection {
  collectionId: string;
  section: number;
  name: string;
  hadiths: Hadith[];
}
