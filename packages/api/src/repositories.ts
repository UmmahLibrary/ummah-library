import type { QuranRepository, TranslationRepository } from "@ummahlibrary/core";
import { FileQuranRepository, FileTranslationRepository } from "@ummahlibrary/data";

/** The Quran (Arabic + structure) repository wired to the ingested datasets. */
export const quranRepository: QuranRepository = new FileQuranRepository();

/** The translation repository wired to the ingested datasets. */
export const translationRepository: TranslationRepository = new FileTranslationRepository();
