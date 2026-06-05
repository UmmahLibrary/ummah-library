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
import { HttpHadithRepository, HttpTafsirRepository } from "@ummahlibrary/adapters";

/** The Quran (Arabic + structure) repository wired to the ingested datasets. */
export const quranRepository: QuranRepository = new FileQuranRepository();

/** The translation repository wired to the ingested datasets. */
export const translationRepository: TranslationRepository = new FileTranslationRepository();

/** The content-plugin registry (translations, reciters, tafsirs). */
export const pluginRegistry: PluginRegistry = loadPluginRegistry();

/** Tafsir served at runtime from each tafsir plugin's source URL. */
export const tafsirRepository: TafsirRepository = new HttpTafsirRepository(pluginRegistry);

/** Hadith collections served at runtime from each hadith plugin's source URL. */
export const hadithRepository: HadithRepository = new HttpHadithRepository(pluginRegistry);
