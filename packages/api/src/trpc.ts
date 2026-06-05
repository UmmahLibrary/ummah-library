/**
 * tRPC router — the typed read API over the core ports. Server components, the
 * REST handlers, and (Phase 3) the Expo app all share this `AppRouter` type for
 * end-to-end type safety. Procedures are framework-agnostic; an app mounts the
 * router on an HTTP endpoint.
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import {
  hadithRepository,
  pluginRegistry,
  quranRepository,
  tafsirRepository,
  translationRepository,
} from "./repositories";

const t = initTRPC.create();

const surahNumber = z.number().int().min(1).max(114);

export const appRouter = t.router({
  /** Metadata for all 114 surahs. */
  listSurahs: t.procedure.query(() => quranRepository.listSurahs()),

  /** A surah's metadata + Arabic ayahs, or `null` if unknown. */
  getSurah: t.procedure.input(z.object({ number: surahNumber })).query(async ({ input }) => {
    const [surah, ayahs] = await Promise.all([
      quranRepository.getSurah(input.number),
      quranRepository.getSurahAyahs(input.number),
    ]);
    return surah ? { surah, ayahs } : null;
  }),

  /** Available translation editions. */
  listEditions: t.procedure.query(() => translationRepository.listTranslations()),

  /** A surah's ayahs in one translation edition. */
  getTranslation: t.procedure
    .input(z.object({ edition: z.string(), number: surahNumber }))
    .query(({ input }) => translationRepository.getSurahTranslation(input.edition, input.number)),

  /** Available reciters (audio). */
  listReciters: t.procedure.query(() => pluginRegistry.byKind("reciter")),

  /** Available tafsir editions. */
  listTafsirs: t.procedure.query(() => pluginRegistry.byKind("tafsir")),

  /** A surah's tafsir from one edition (fetched at runtime). */
  getTafsir: t.procedure
    .input(z.object({ tafsir: z.string(), number: surahNumber }))
    .query(({ input }) => tafsirRepository.getSurahTafsir(input.tafsir, input.number)),

  /** Available hadith collections. */
  listHadithCollections: t.procedure.query(() => pluginRegistry.byKind("hadith")),

  /** One section of a hadith collection (fetched at runtime). */
  getHadithSection: t.procedure
    .input(z.object({ collection: z.string(), section: z.number().int().min(1) }))
    .query(({ input }) => hadithRepository.getSection(input.collection, input.section)),
});

export type AppRouter = typeof appRouter;
