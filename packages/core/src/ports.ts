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
  Place,
  Surah,
  TafsirEntry,
  TranslatedAyah,
  Translation,
  VerseKey,
} from "./entities";
import type { Collection } from "./collections";
import type { PrayerTrackerLog } from "./prayer-tracker";
import type { QadaLog } from "./qada";
import type { HaidLog } from "./haid";
import type { FastingQadaLog } from "./fasting-qada";
import type { TasbihRecord } from "./tasbih";
import type { HifzCard } from "./hifz";
import type {
  Coordinates,
  ExtendedPrayerTimings,
  HighLatitudeRuleId,
  Madhab,
  PrayerName,
  PrayerTimings,
} from "./prayer";
import type { ActivePlan, PlanTemplate } from "./reading-plans";
import type { KhatmaPlan } from "./reading-goals";
import type { Hlc, SyncEntry, SyncExchangeResult, SyncRecord } from "./sync";
import type { SurahTiming } from "./audio";

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

/**
 * Word-by-word recitation timings, bundled per reciter + surah (ADR 0036). These
 * drive audio word-highlighting and tap-to-hear offline, without a runtime call
 * to the quran.com timing API. `getSurahTiming` returns `null` for a reciter or
 * surah with no bundled timing — the caller falls back to a live source or to no
 * highlighting.
 */
export interface RecitationTimingRepository {
  /** The reciter ids that have bundled timings. */
  reciterIds(): Promise<readonly string[]>;
  /** A surah's word-by-word timings for one reciter, or `null` if uncovered. */
  getSurahTiming(reciterId: string, surahNumber: number): Promise<SurahTiming | null>;
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
  /** High-latitude night-portion rule (see `HIGH_LATITUDE_RULES`); defaults to `"none"`. */
  highLatitudeRule?: HighLatitudeRuleId;
}

/**
 * Computes prayer times from coordinates, a date and a method. The astronomy is
 * an external concern (the `adhan` library) kept behind this port so the app
 * depends only on the contract — see ADR 0012. The result carries the five
 * prayers + sunrise plus the supplementary night markers (Imsāk, midnight, last
 * third); callers needing only the prayers read it as {@link PrayerTimings}.
 */
export interface PrayerTimesCalculator {
  calculate(query: PrayerTimesQuery): Promise<ExtendedPrayerTimings>;
}

/**
 * Finds mosques near a point from OpenStreetMap's Overpass API — a public,
 * read-only, keyless, ODbL-licensed geodata source kept behind this port so
 * `core` and the apps never call the vendor directly (ADR 0038). Mirrors the
 * shape of {@link PrayerTimesCalculator}: an external, coordinate-driven
 * lookup with no accounts and nothing stored server-side.
 */
export interface PlacesProvider {
  /**
   * Mosques (`amenity=place_of_worship` + `religion=muslim` in OSM) within
   * `radiusMeters` of `coords`, nearest first. An empty array covers both "none
   * nearby" and a degraded upstream response (matching the sibling HTTP content
   * repositories); a hard network failure before any response — offline, DNS —
   * still rejects, so the caller can render a distinct error state for that case.
   */
  nearbyMosques(coords: Coordinates, radiusMeters: number): Promise<readonly Place[]>;
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
 * Persists the qaḍāʾ (missed-prayer) backlog on-device (ADR 0024, 0030): how
 * many of each obligatory prayer are owed. Web uses `localStorage`, mobile
 * `AsyncStorage`; a synced adapter (#25) replaces either without touching the
 * backlog maths (`qada.ts`). `read()` returns an empty log when nothing is owed.
 */
export interface QadaStore {
  read(): Promise<QadaLog>;
  write(log: QadaLog): Promise<void>;
}

/**
 * Persists fasting-qaḍāʾ progress on-device (ADR 0024, 0034): how many of the
 * make-up fasts owed — derived from ḥayḍ pauses ∩ Ramaḍān (`fasting-qada.ts`) —
 * have been completed. Web uses `localStorage`, mobile `AsyncStorage`; a synced
 * adapter (#25) replaces either without touching the maths. `read()` returns
 * `{ madeUp: 0 }` when nothing is recorded.
 */
export interface FastingQadaStore {
  read(): Promise<FastingQadaLog>;
  write(log: FastingQadaLog): Promise<void>;
}

/**
 * Persists the ḥayḍ (menstruation) pause log on-device (ADR 0024, 0031): the
 * date ranges during which prayer tracking is paused. Web uses `localStorage`,
 * mobile `AsyncStorage`; a synced adapter (#25) replaces either without touching
 * the pause maths (`haid.ts`). `read()` returns an empty log when nothing is set.
 */
export interface HaidStore {
  read(): Promise<HaidLog>;
  write(log: HaidLog): Promise<void>;
}

/**
 * Persists which achievement badges the user has already been shown (ADR 0024,
 * 0032), so the unlock toast fires once per badge. The badges themselves are
 * derived from existing local data (`achievements.ts`), not stored. Web uses
 * `localStorage`, mobile `AsyncStorage`. `read()` returns `[]` when none seen.
 */
export interface AchievementsStore {
  read(): Promise<string[]>;
  write(acknowledgedIds: string[]): Promise<void>;
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
  /** Show the per-āyah Latin transliteration line under the Arabic (#150). */
  transliteration: boolean | null;
  /** Show per-word Latin transliteration beneath each Arabic word (#144). */
  wordTransliteration: boolean | null;
  /** Tap an Arabic word to hear just that word recited (#145). */
  tapToHear: boolean | null;
  /** Arabic script for the reader: `uthmani` | `indopak` (ADR 0035). */
  script: string | null;
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
  /** Toggle the per-āyah transliteration line (#150). */
  writeTransliteration(on: boolean): Promise<void>;
  /** Toggle the per-word transliteration row (#144). */
  writeWordTransliteration(on: boolean): Promise<void>;
  /** Toggle tap-a-word-to-hear word audio (#145). */
  writeTapToHear(on: boolean): Promise<void>;
  /** Set the reader's Arabic script — `uthmani` | `indopak` (ADR 0035). */
  writeScript(script: string): Promise<void>;
}

/** The reader's prayer-times location and calculation config as persisted. */
export interface PrayerSettings {
  /** Saved location, or `null` until the reader uses prayer times / qibla. */
  coords: Coordinates | null;
  /** Calculation method id (e.g. `"MuslimWorldLeague"`). */
  method: string;
  /** Juristic madhab for the ʿAsr time. */
  madhab: Madhab;
  /** High-latitude night-portion rule (see `HIGH_LATITUDE_RULES`). */
  highLatitudeRule: HighLatitudeRuleId;
}

/**
 * Persists the reader's prayer-times location and calculation config on-device
 * (ADR 0024): coordinates, calculation method, madhab, and high-latitude rule —
 * shared by prayer times, qibla, Ramadan, and reminders. Web uses
 * `localStorage`, mobile `AsyncStorage`; a synced adapter (#25) replaces either
 * without touching the prayer-times UI. `read()` applies the defaults; one
 * setting per stored key.
 */
export interface PrayerSettingsStore {
  read(): Promise<PrayerSettings>;
  writeCoords(coords: Coordinates | null): Promise<void>;
  writeMethod(method: string): Promise<void>;
  writeMadhab(madhab: Madhab): Promise<void>;
  writeHighLatitudeRule(rule: HighLatitudeRuleId): Promise<void>;
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
  /** Sunnah-fasting (Mon/Thu + Ayyām al-Bīḍ) reminder on/off. */
  sunnahFastOn: boolean;
  /** Per-Islamic-event reminder toggles, keyed by event id. */
  islamicEvents: Record<string, boolean>;
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
  writeSunnahFastOn(on: boolean): Promise<void>;
  writeIslamicEvents(prefs: Record<string, boolean>): Promise<void>;
}

/** A surah's downloaded audio for one reciter, for the downloads manager (#202). */
export interface DownloadedSurah {
  reciterId: string;
  surah: number;
  /** Ayahs saved so far (a completed download equals the surah's ayah count). */
  ayahCount: number;
  /** Total bytes on device for this surah's saved audio. */
  bytes: number;
}

/**
 * Persists reciter audio on-device for offline playback (#202, ADR 0039), keyed
 * by reciter + ayah. The web adapter caches responses via the Cache API and hands
 * back blob URLs; mobile stores files via `expo-file-system` and hands back
 * `file://` URIs. `core` never touches either — the download *orchestration*
 * (`downloadSurahAudio` in `audio.ts`) drives this port and stays pure.
 */
export interface AudioStore {
  /** Whether this ayah's audio is already saved for the reciter. */
  has(reciterId: string, ref: VerseKey): Promise<boolean>;
  /** A locally-playable URL (`blob:`/`file:`) for the ayah, or `null` if not saved. */
  localUrl(reciterId: string, ref: VerseKey): Promise<string | null>;
  /** Download and persist one ayah's audio from its remote URL. Idempotent. */
  save(reciterId: string, ref: VerseKey, remoteUrl: string): Promise<void>;
  /** Remove every saved ayah of a surah for the reciter. */
  removeSurah(reciterId: string, surah: number): Promise<void>;
  /** Every saved surah across reciters, for the downloads manager. */
  savedSurahs(): Promise<readonly DownloadedSurah[]>;
}

/**
 * Client-side cryptography for sync (ADR 0033), behind a port so `core` never
 * touches WebCrypto or native crypto. An instance is "unlocked" — the platform
 * adapter constructs it from the user's recovery secret — and exposes only what
 * the engine needs. The server-facing `accountId` and per-key `entryId` are keyed
 * hashes derived from the secret, never the secret itself; the `dataKey` that
 * encrypts values never leaves the device.
 */
export interface Cipher {
  /** The opaque account id the server stores under; identifies a blob, not a person. */
  accountId(): Promise<string>;
  /** Stable opaque id for a logical key — a keyed hash of the key name. */
  entryId(keyName: string): Promise<string>;
  /** Encrypt a value; returns base64 ciphertext and the base64 nonce used. */
  encrypt(plaintext: string): Promise<{ ciphertext: string; nonce: string }>;
  /** Decrypt a value, or `null` when authentication fails (foreign/corrupt data). */
  decrypt(ciphertext: string, nonce: string): Promise<string | null>;
}

/**
 * The sync transport (ADR 0033/0035): push the device's encrypted entries and get
 * the converged set back — or, when a `cursor` is supplied, only the delta newer
 * than it (ADR 0035 incremental pull). Implemented as an HTTP adapter; the server
 * only ever stores what {@link SyncEntry} exposes (opaque id, clock, ciphertext).
 */
export interface SyncBackend {
  exchange(
    accountId: string,
    entries: readonly SyncEntry[],
    cursor?: number,
  ): Promise<SyncExchangeResult>;
}

/**
 * The local side the sync engine reads and writes (ADR 0033). `all()` must
 * enumerate **every** managed `ul.*` key — `value: null` when unset — so the
 * engine can map the server's opaque ids back to keys and discover values first
 * set on another device. `apply` installs a winning remote value (`null` ⇒
 * delete) at its clock, without minting a new one.
 */
export interface SyncStateStore {
  all(): Promise<readonly SyncRecord[]>;
  apply(key: string, value: string | null, hlc: Hlc): Promise<void>;
  /**
   * Optional (v2 element-level merge, ADR 0034): resolve an incoming entry whose
   * opaque id this device never generated — a collection element first created on
   * another device. Given the decrypted plaintext (a self-describing element
   * envelope), return the synthetic key to `apply` it under, or `null` if it isn't
   * an element this build manages. Lets the engine discover new elements in one
   * round without learning any value shapes; stores with only scalar keys omit it.
   */
  identify?(plaintext: string): string | null;
  /**
   * Optional (v3 incremental pull, ADR 0035): the highest server version this
   * device has applied. The engine sends it so the server can return only the
   * newer delta. Omit it (with {@link setCursor}) to keep whole-set sync.
   */
  getCursor?(): Promise<number>;
  /** Persist the server's new high-water cursor after a successful round (ADR 0035). */
  setCursor?(cursor: number): Promise<void>;
  /**
   * Mark these (synthetic) keys as pushed — clears their dirty state so a
   * steady-state round pushes nothing (ADR 0035). Called after a successful push.
   */
  markPushed?(keys: readonly string[]): Promise<void>;
}
