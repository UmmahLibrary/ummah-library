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
  HadithCollection,
  HadithSection,
  Surah,
  TafsirEntry,
  TranslatedAyah,
  Translation,
  VerseKey,
} from "./entities";
import type { Collection } from "./collections";
import type { PrayerTrackerLog } from "./prayer-tracker";
import type { TasbihRecord } from "./tasbih";
import type { HifzCard } from "./hifz";
import type { Coordinates, Madhab, PrayerName, PrayerTimings } from "./prayer";
import type { ActivePlan, PlanTemplate } from "./reading-plans";
import type { KhatmaPlan } from "./reading-goals";

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
  /** A whole collection (every hadith + section names) for client-side browse/search. */
  getCollection(collectionId: string): Promise<HadithCollection | null>;
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

/**
 * Access to the reading-plan catalogue (templates a reader can start). The
 * curated templates are bundled in `core` so both apps load them offline; this
 * port lets the API serve them through the same seam as every other repository.
 */
export interface PlanCatalogPort {
  /** Every template in the catalogue, in display order. */
  all(): Promise<readonly PlanTemplate[]>;
  /** A single template by id, or `null` if it isn't in the catalogue. */
  byId(id: string): Promise<PlanTemplate | null>;
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

/**
 * Persists the reader's single active reading plan on-device (ADR 0024). The web
 * adapter uses `localStorage`, mobile uses `AsyncStorage`; a synced adapter can
 * replace either without touching the plan logic or UI — the seam for #25.
 */
export interface PlanStore {
  /** The active plan, or `null` if none is in progress. */
  read(): Promise<ActivePlan | null>;
  /** Save (or replace) the active plan. */
  write(plan: ActivePlan): Promise<void>;
  /** Stop the active plan. */
  clear(): Promise<void>;
}

/** The reader's habit state as persisted — one field per stored key (ADR 0024). */
export interface ReadingGoalsState {
  /** Daily page goal, or `null` if the reader hasn't set one. */
  goal: number | null;
  /** Dates (`YYYY-MM-DD`) with any reading activity — drives the streak. */
  activeDates: string[];
  /** Pages read per day, `{ "YYYY-MM-DD": count }`. */
  log: Record<string, number>;
  /** Today's distinct Mushaf pages (the `date` guards a day rollover). */
  pages: { date: string; pages: number[] };
  /** The optional khatma plan. */
  khatma: KhatmaPlan | null;
}

/**
 * Persists the reader's habit state on-device (ADR 0024): the daily goal, the
 * activity log/streak, today's pages, and the khatma. The web adapter uses
 * `localStorage`, mobile uses `AsyncStorage`; a synced adapter can replace
 * either without touching the habit logic — the seam for #25. One method per
 * stored key keeps writes as granular as the direct calls they replace.
 */
export interface ReadingGoalsStore {
  /** The full habit snapshot (each key with its stored value or a default). */
  read(): Promise<ReadingGoalsState>;
  writeGoal(target: number): Promise<void>;
  writeActiveDates(dates: string[]): Promise<void>;
  writeLog(log: Record<string, number>): Promise<void>;
  writePages(pages: { date: string; pages: number[] }): Promise<void>;
  /** Save the khatma, or remove it when `null`. */
  writeKhatma(khatma: KhatmaPlan | null): Promise<void>;
}

/**
 * Persists the reader's saved library on-device (ADR 0024): surah bookmarks,
 * ayah collections, and per-ayah notes (keyed by `sura:aya`). Web uses
 * `localStorage`, mobile `AsyncStorage`; a synced adapter (#25) replaces either
 * without touching the library logic — one method per stored key.
 */
export interface LibraryStore {
  /** Bookmarked surah numbers. */
  readBookmarks(): Promise<number[]>;
  writeBookmarks(surahs: number[]): Promise<void>;
  /** Ayah collections, in display order. */
  readCollections(): Promise<Collection[]>;
  writeCollections(collections: Collection[]): Promise<void>;
  /** Per-ayah notes, `{ "sura:aya": text }`. */
  readNotes(): Promise<Record<string, string>>;
  writeNotes(notes: Record<string, string>): Promise<void>;
}

/**
 * Persists the prayer tracker log on-device (ADR 0024): which of the five daily
 * prayers were prayed (on time / late) each day. Web uses `localStorage`, mobile
 * `AsyncStorage`; a synced adapter (#25) replaces either without touching the
 * tracker logic.
 */
export interface PrayerTrackerStore {
  read(): Promise<PrayerTrackerLog>;
  write(log: PrayerTrackerLog): Promise<void>;
}

/**
 * Persists the tasbih counter on-device (ADR 0024): the chosen phrase, a running
 * total, and the round size. Web uses `localStorage`, mobile `AsyncStorage`; a
 * synced adapter (#25) replaces either without touching the counter logic
 * (`tasbihState`). `null` means the reader hasn't counted yet.
 */
export interface TasbihStore {
  read(): Promise<TasbihRecord | null>;
  write(record: TasbihRecord): Promise<void>;
}

/** Reader preferences as persisted — each `null` when the reader hasn't set it. */
export interface StoredSettings {
  /** Selected translation edition ids. */
  editions: string[] | null;
  /** Reading mode: `translation` | `reading` | `reading-tr`. */
  readingMode: string | null;
  /** The single "Reading → Translations" edition id. */
  readingTranslation: string | null;
  /** Selected reciter id. */
  reciter: string | null;
  /** Selected tafsir edition id. */
  tafsir: string | null;
  /** Reading font scale. */
  scale: number | null;
}

/**
 * Persists the reader's preferences on-device (ADR 0024): editions, reading
 * mode, the reading translation, reciter, tafsir, and font scale. Web uses
 * `localStorage`, mobile `AsyncStorage`; a synced adapter (#25) replaces either
 * without touching the settings UI — one method per stored key.
 */
export interface SettingsStore {
  read(): Promise<StoredSettings>;
  writeEditions(ids: string[]): Promise<void>;
  writeReadingMode(mode: string): Promise<void>;
  writeReadingTranslation(id: string): Promise<void>;
  writeReciter(id: string): Promise<void>;
  writeTafsir(id: string): Promise<void>;
  writeScale(scale: number): Promise<void>;
}

/** The reader's prayer-times location and calculation config as persisted. */
export interface PrayerSettings {
  /** Saved location, or `null` until the reader uses prayer times / qibla. */
  coords: Coordinates | null;
  /** Calculation method id (e.g. `"MuslimWorldLeague"`). */
  method: string;
  /** Juristic madhab for the ʿAsr time. */
  madhab: Madhab;
}

/**
 * Persists the reader's prayer-times location and calculation config on-device
 * (ADR 0024): coordinates, calculation method, and madhab — shared by prayer
 * times, qibla, Ramadan, and reminders. Web uses `localStorage`, mobile
 * `AsyncStorage`; a synced adapter (#25) replaces either without touching the
 * prayer-times UI. `read()` applies the defaults; one method per stored key.
 */
export interface PrayerSettingsStore {
  read(): Promise<PrayerSettings>;
  writeCoords(coords: Coordinates | null): Promise<void>;
  writeMethod(method: string): Promise<void>;
  writeMadhab(madhab: Madhab): Promise<void>;
}

/**
 * Supplies today's prayer timings for the stored location, hiding *how* they're
 * obtained and cached behind the port: the web adapter fetches the prayer-times
 * function and caches the day; a mobile adapter can compute them on-device via
 * a {@link PrayerTimesCalculator}. Returns `null` when no location is stored or
 * the lookup fails. This keeps the reminder orchestration in `core` free of I/O.
 */
export interface PrayerTimingsProvider {
  getTodaysTimings(): Promise<PrayerTimings | null>;
}

/** A reading-plan daily-reminder preference. */
export interface PlanReminderPref {
  on: boolean;
  /** Local wall-clock time, `HH:MM`. */
  time: string;
}

/** The reader's reminder preferences as persisted (ADR 0024). */
export interface ReminderPrefs {
  /** Reading-plan daily nudge (#71). */
  plan: PlanReminderPref;
  /** Per-prayer reminder toggles. */
  prayers: Partial<Record<PrayerName, boolean>>;
  /** Morning/evening adhkar reminder on/off. */
  adhkarOn: boolean;
}

/**
 * Persists the reader's reminder preferences on-device (ADR 0024): the plan
 * daily nudge, the per-prayer toggles, and the adhkar on/off. Web uses
 * `localStorage`, mobile `AsyncStorage`; a synced adapter (#25) replaces either
 * without touching the reminder orchestration in `core`. `read()` applies the
 * defaults; one method per stored key.
 */
export interface ReminderStore {
  read(): Promise<ReminderPrefs>;
  writePlan(pref: PlanReminderPref): Promise<void>;
  writePrayers(prefs: Partial<Record<PrayerName, boolean>>): Promise<void>;
  writeAdhkarOn(on: boolean): Promise<void>;
}
