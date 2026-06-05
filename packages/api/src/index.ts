/**
 * @ummahlibrary/api
 *
 * The application layer. Phase 2 turns this into a tRPC router (with a REST /
 * OpenAPI mirror) consuming the core ports. For now it exposes the configured
 * repositories so apps depend on `api` — not directly on `data` — keeping the
 * dependency direction app → api → core/data intact.
 */
import type { QuranRepository, TranslationRepository } from "@ummahlibrary/core";
import { FileQuranRepository, FileTranslationRepository } from "@ummahlibrary/data";

/** The Quran (Arabic + structure) repository wired to the ingested datasets. */
export const quranRepository: QuranRepository = new FileQuranRepository();

/** The translation repository wired to the ingested datasets. */
export const translationRepository: TranslationRepository = new FileTranslationRepository();
