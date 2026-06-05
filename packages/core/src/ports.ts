/**
 * Ports (interfaces) the core exposes for adapters to implement. The core
 * depends only on these abstractions, never on a concrete data source — a
 * JSON file, a SQLite database, or a remote API all satisfy the same contract.
 */
import type { Ayah, Surah, TranslatedAyah, Translation, VerseKey } from "./entities";

/** Access to the Arabic Quran text and surah structure. */
export interface QuranRepository {
  /** Metadata for every surah, ordered 1 → 114. */
  listSurahs(): Promise<readonly Surah[]>;
  /** A single surah's metadata, or `null` if the number is out of range. */
  getSurah(surahNumber: number): Promise<Surah | null>;
  /** Every ayah of a surah, in order, or `[]` if the number is out of range. */
  getSurahAyahs(surahNumber: number): Promise<readonly Ayah[]>;
  /** A single ayah, or `null` if the reference does not exist. */
  getAyah(ref: VerseKey): Promise<Ayah | null>;
}

/** Access to translation editions and their text. */
export interface TranslationRepository {
  /** Metadata for every available translation. */
  listTranslations(): Promise<readonly Translation[]>;
  /** Every translated ayah of a surah for one edition, in order. */
  getSurahTranslation(
    translationId: string,
    surahNumber: number,
  ): Promise<readonly TranslatedAyah[]>;
  /** A single translated ayah, or `null` if the edition or reference is unknown. */
  getTranslatedAyah(translationId: string, ref: VerseKey): Promise<TranslatedAyah | null>;
}
