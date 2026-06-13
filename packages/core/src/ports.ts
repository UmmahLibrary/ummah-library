/**
 * Ports (interfaces) the core exposes for adapters to implement. The core
 * depends only on these abstractions, never on a concrete data source — a
 * JSON file, a SQLite database, or a remote API all satisfy the same contract.
 */
import type {
  AdhkarOccasion,
  Ayah,
  Dhikr,
  DivineName,
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

/** Platform-neutral notification permission state (no DOM dependency). */
export type NotifyPermission = "granted" | "denied" | "default" | "unsupported";

/** A local notification to deliver, optionally at a future instant. */
export interface AppNotification {
  /** Stable id; scheduling again with the same id replaces the pending one. */
  id: string;
  title: string;
  body: string;
  /** ISO-8601 instant to deliver at; omitted (or in the past) means immediately. */
  at?: string;
  /** Optional OS-level de-duplication tag (defaults to `id`). */
  tag?: string;
}

/**
 * Delivers local notifications, hiding the platform mechanism behind the port.
 * The web adapter uses the Notifications API with in-page timers, so reminders
 * fire only while a tab is open — the honest limit of a no-backend, local-first
 * app (ADR 0017, 0019). A service-worker, Web Push or Expo adapter can later
 * satisfy the same contract for closed-app delivery without touching the
 * reminder logic in `core` or the UI.
 */
export interface Notifier {
  /** Whether this platform can show notifications at all. */
  isSupported(): boolean;
  /** The current permission state. */
  permission(): NotifyPermission;
  /** Ask the user to grant permission; resolves with the resulting state. */
  requestPermission(): Promise<NotifyPermission>;
  /** Schedule (or reschedule) a notification; replaces any pending one with the same id. */
  schedule(notification: AppNotification): Promise<void>;
  /** Cancel a pending notification by id. */
  cancel(id: string): Promise<void>;
  /** Cancel every pending notification this notifier scheduled. */
  cancelAll(): Promise<void>;
}

/** Access to hadith collections. */
export interface HadithRepository {
  /** One section (book/chapter) of a collection, or `null` if unavailable. */
  getSection(collectionId: string, section: number): Promise<HadithSection | null>;
}

/** Access to the 99 Names of Allah. */
export interface AsmaRepository {
  all(): Promise<readonly DivineName[]>;
}

/** Access to the adhkar (remembrances) collection. */
export interface AdhkarRepository {
  /** Every dhikr, in display order. */
  all(): Promise<readonly Dhikr[]>;
  /** The dhikrs said at a given occasion (morning/evening), in display order. */
  byOccasion(occasion: AdhkarOccasion): Promise<readonly Dhikr[]>;
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
