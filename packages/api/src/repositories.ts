import type {
  HadithRepository,
  PluginRegistry,
  QuranRepository,
  TafsirRepository,
  TranslationRepository,
} from "@ummahlibrary/core";
import {
  FileQuranRepository,
  FileTranslationRepository,
  loadPluginRegistry,
} from "@ummahlibrary/data";
import {
  HttpHadithRepository,
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

/** Hadith collections served at runtime from each hadith plugin's source URL. */
export const hadithRepository: HadithRepository = new HttpHadithRepository(pluginRegistry);
