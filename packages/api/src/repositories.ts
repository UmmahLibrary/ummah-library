import type {
  AdhkarRepository,
  AsmaRepository,
  HadithRepository,
  PluginRegistry,
  PrayerTimesCalculator,
  QuranRepository,
  TafsirRepository,
  TranslationRepository,
} from "@ummahlibrary/core";
import {
  FileAdhkarRepository,
  FileAsmaRepository,
  FileHadithRepository,
  FileQuranRepository,
  FileTranslationRepository,
  loadPluginRegistry,
} from "@ummahlibrary/data";
import {
  AdhanPrayerTimes,
  HttpTafsirRepository,
  HttpTranslationCatalog,
} from "@ummahlibrary/adapters";

/** The Quran (Arabic + structure) repository wired to the ingested datasets. */
export const quranRepository: QuranRepository = new FileQuranRepository();

/** The translation repository wired to the ingested datasets (the curated, static set). */
export const translationRepository: TranslationRepository = new FileTranslationRepository();

/**
 * The **full** translation catalogue (~490 editions) fetched at runtime from
 * fawazahmed0/quran-api — see ADR 0011. Served alongside the ingested set so the
 * static web reader keeps its small bundled defaults while clients that want the
 * whole catalogue (mobile) read it on demand.
 */
export const translationCatalog: TranslationRepository = new HttpTranslationCatalog();

/** The content-plugin registry (translations, reciters, tafsirs). */
export const pluginRegistry: PluginRegistry = loadPluginRegistry();

/** Tafsir served at runtime from each tafsir plugin's source URL. */
export const tafsirRepository: TafsirRepository = new HttpTafsirRepository(pluginRegistry);

/** Hadith collections served from the ingested datasets — see ADR 0022. */
export const hadithRepository: HadithRepository = new FileHadithRepository();

/** Prayer-times calculator (adhan behind the core port) — see ADR 0012. */
export const prayerTimes: PrayerTimesCalculator = new AdhanPrayerTimes();

/** The bundled adhkar collection (morning & evening) — see ADR 0016. */
export const adhkarRepository: AdhkarRepository = new FileAdhkarRepository();

/** The bundled 99 Names of Allah. */
export const asmaRepository: AsmaRepository = new FileAsmaRepository();
