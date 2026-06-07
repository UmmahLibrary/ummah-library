/**
 * Ports (interfaces) the core exposes for adapters to implement. The core
 * depends only on these abstractions, never on a concrete data source — a
 * JSON file, a SQLite database, or a remote API all satisfy the same contract.
 */
import type {
  Ayah,
  HadithSection,
  Surah,
  TafsirEntry,
  TranslatedAyah,
  Translation,
  VerseKey,
} from "./entities";
import type { HifzCard } from "./hifz";
import type { Coordinates, Madhab, PrayerTimings } from "./prayer";

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
  /** The Basmala in its standard form, for rendering as a surah header. */
  getBismillah(): Promise<string>;
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

/** Access to tafsir (commentary) editions. */
export interface TafsirRepository {
  /** Every tafsir entry for a surah in one edition, in order. */
  getSurahTafsir(tafsirId: string, surahNumber: number): Promise<readonly TafsirEntry[]>;
  /** A single ayah's tafsir, or `null` if the edition or reference is unknown. */
  getAyahTafsir(tafsirId: string, ref: VerseKey): Promise<TafsirEntry | null>;
}

/** A request for one day's prayer times at a location. */
export interface PrayerTimesQuery {
  coordinates: Coordinates;
  /** The calendar date to compute, as `YYYY-MM-DD`. */
  date: string;
  /** A calculation-method id (see `CALCULATION_METHODS`). */
  method: string;
  madhab: Madhab;
}

/**
 * Computes prayer times from coordinates, a date and a method. The astronomy is
 * an external concern (the `adhan` library) kept behind this port so the app
 * depends only on the contract — see ADR 0012.
 */
export interface PrayerTimesCalculator {
  calculate(query: PrayerTimesQuery): Promise<PrayerTimings>;
}

/** Access to hadith collections. */
export interface HadithRepository {
  /** One section (book/chapter) of a collection, or `null` if unavailable. */
  getSection(collectionId: string, section: number): Promise<HadithSection | null>;
}

/** One tracked memorization item: which ayah, and its SM-2 state. */
export interface HifzRecord {
  ayah: VerseKey;
  card: HifzCard;
}

/**
 * Persists Hifz progress. Implemented per platform (SQLite on mobile, Postgres
 * on the server). The SM-2 scheduling itself lives in `hifz.ts`, not here.
 */
export interface HifzRepository {
  /** The card for an ayah, or `null` if it isn't being memorized yet. */
  get(ayah: VerseKey): Promise<HifzCard | null>;
  /** Create or update the card for an ayah. */
  save(ayah: VerseKey, card: HifzCard): Promise<void>;
  /** Stop tracking an ayah. */
  remove(ayah: VerseKey): Promise<void>;
  /** Cards due for review at or before `now`, in mushaf order. */
  due(now: Date): Promise<readonly HifzRecord[]>;
  /** Every tracked card, in mushaf order. */
  all(): Promise<readonly HifzRecord[]>;
}
