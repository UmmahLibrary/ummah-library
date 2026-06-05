/**
 * @ummahlibrary/data
 *
 * Adapters that serve the ingested Quran datasets (see `datasets/`, produced by
 * `scripts/ingest.ts`) through the core ports. The core stays unaware of where
 * the data lives — these classes are the only thing that touches the files.
 *
 * Loading strategy:
 *   - Surah metadata is a small JSON *import* (bundler-safe; usable in any app).
 *   - The large Arabic text and translations are read lazily from disk with
 *     `fs` and cached. They are server/test-only for now; the web reader wires
 *     them up with a runtime-appropriate loader in Phase 2.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  Ayah,
  QuranRepository,
  Surah,
  TranslatedAyah,
  Translation,
  TranslationRepository,
  VerseKey,
} from "@ummahlibrary/core";
import { isValidSurahNumber, isValidVerseRef } from "@ummahlibrary/core";
import surahsData from "../datasets/surahs.json";

const SURAHS = surahsData.surahs as readonly Surah[];

const datasetUrl = (relPath: string): string =>
  fileURLToPath(new URL(`../datasets/${relPath}`, import.meta.url));

function loadJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(datasetUrl(relPath), "utf8")) as T;
}

interface VerseRecord {
  sura: number;
  aya: number;
  text: string;
}

interface ArabicDoc {
  bismillah: string;
  verses: VerseRecord[];
}

/** Serves the Arabic Quran and surah structure from the ingested datasets. */
export class FileQuranRepository implements QuranRepository {
  #arabic: ArabicDoc | null = null;

  #doc(): ArabicDoc {
    this.#arabic ??= loadJson<ArabicDoc>("arabic-uthmani.json");
    return this.#arabic;
  }

  #verses(): VerseRecord[] {
    return this.#doc().verses;
  }

  getBismillah(): Promise<string> {
    return Promise.resolve(this.#doc().bismillah);
  }

  listSurahs(): Promise<readonly Surah[]> {
    return Promise.resolve(SURAHS);
  }

  getSurah(surahNumber: number): Promise<Surah | null> {
    return Promise.resolve(SURAHS.find((s) => s.number === surahNumber) ?? null);
  }

  getSurahAyahs(surahNumber: number): Promise<readonly Ayah[]> {
    if (!isValidSurahNumber(surahNumber)) return Promise.resolve([]);
    return Promise.resolve(this.#verses().filter((v) => v.sura === surahNumber));
  }

  getAyah(ref: VerseKey): Promise<Ayah | null> {
    if (!isValidVerseRef(ref.sura, ref.aya)) return Promise.resolve(null);
    return Promise.resolve(
      this.#verses().find((v) => v.sura === ref.sura && v.aya === ref.aya) ?? null,
    );
  }
}

interface TranslationIndex {
  translations: Record<string, Translation>;
}

/** Serves translation editions and their text from the ingested datasets. */
export class FileTranslationRepository implements TranslationRepository {
  #index: TranslationIndex | null = null;
  readonly #editions = new Map<string, VerseRecord[]>();

  #loadIndex(): TranslationIndex {
    this.#index ??= loadJson<TranslationIndex>("translations/index.json");
    return this.#index;
  }

  #loadEdition(translationId: string): VerseRecord[] | null {
    if (!(translationId in this.#loadIndex().translations)) return null;
    let verses = this.#editions.get(translationId);
    if (!verses) {
      verses = loadJson<{ verses: VerseRecord[] }>(`translations/${translationId}.json`).verses;
      this.#editions.set(translationId, verses);
    }
    return verses;
  }

  listTranslations(): Promise<readonly Translation[]> {
    return Promise.resolve(Object.values(this.#loadIndex().translations));
  }

  getSurahTranslation(
    translationId: string,
    surahNumber: number,
  ): Promise<readonly TranslatedAyah[]> {
    const verses = this.#loadEdition(translationId);
    if (!verses || !isValidSurahNumber(surahNumber)) return Promise.resolve([]);
    return Promise.resolve(
      verses.filter((v) => v.sura === surahNumber).map((v) => ({ ...v, translationId })),
    );
  }

  getTranslatedAyah(translationId: string, ref: VerseKey): Promise<TranslatedAyah | null> {
    const verses = this.#loadEdition(translationId);
    if (!verses || !isValidVerseRef(ref.sura, ref.aya)) return Promise.resolve(null);
    const verse = verses.find((v) => v.sura === ref.sura && v.aya === ref.aya);
    return Promise.resolve(verse ? { ...verse, translationId } : null);
  }
}
