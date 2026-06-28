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
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AdhkarOccasion,
  AdhkarRepository,
  AsmaRepository,
  Ayah,
  Dhikr,
  DivineName,
  Hadith,
  HadithCollection,
  HadithRepository,
  HadithSection,
  PlanCatalogPort,
  PlanTemplate,
  QuranRepository,
  RecitationTimingRepository,
  Surah,
  SurahTiming,
  TranslatedAyah,
  Translation,
  TranslationRepository,
  VerseKey,
} from "@ummahlibrary/core";
import type { ContentPlugin } from "@ummahlibrary/core";
import {
  PLAN_TEMPLATES,
  PluginRegistry,
  filterByOccasion,
  isValidSurahNumber,
  isValidVerseRef,
} from "@ummahlibrary/core";
import surahsData from "../datasets/surahs.json";
import pluginsData from "../datasets/plugins.json";
import adhkarData from "../datasets/adhkar.json";
import asmaData from "../datasets/asma.json";

const SURAHS = surahsData.surahs as readonly Surah[];

/** Build the content-plugin registry from the ingested `plugins.json`. */
export function loadPluginRegistry(): PluginRegistry {
  return new PluginRegistry(pluginsData.plugins as ContentPlugin[]);
}

// Resolve the datasets directory robustly: relative to this module at build /
// test time, or relative to the working directory when bundled into a
// serverless function (where the package layout is flattened).
let cachedBase: string | null = null;
function datasetsBase(): string {
  if (cachedBase) return cachedBase;
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "../datasets"),
    join(process.cwd(), "packages/data/datasets"),
    join(process.cwd(), "../../packages/data/datasets"),
    join(process.cwd(), "datasets"),
  ];
  cachedBase = candidates.find((dir) => existsSync(dir)) ?? candidates[0]!;
  return cachedBase;
}

function loadJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(join(datasetsBase(), relPath), "utf8")) as T;
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

/**
 * Serves the Arabic Quran (Uthmani) and surah structure from the ingested
 * datasets. The IndoPak script is no longer bundled (ADR 0035 amendment): its
 * source forbids redistribution, so the web reader fetches it live from quran.com
 * for display only.
 */
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

/**
 * Serves bundled word-by-word recitation timings (ADR 0036), ingested from the
 * quran-align dataset (CC-BY-4.0). One small JSON per reciter+surah, read lazily
 * and cached. Unknown reciters/surahs (including reciters with no timing data)
 * resolve to `null` so the caller can fall back to a live source.
 */
export class FileRecitationTimingRepository implements RecitationTimingRepository {
  #ids: string[] | null = null;
  readonly #cache = new Map<string, SurahTiming | null>();

  #reciters(): string[] {
    if (this.#ids) return this.#ids;
    const rel = "timings/index.json";
    this.#ids = existsSync(join(datasetsBase(), rel))
      ? loadJson<{ reciters: string[] }>(rel).reciters
      : [];
    return this.#ids;
  }

  reciterIds(): Promise<readonly string[]> {
    return Promise.resolve(this.#reciters());
  }

  getSurahTiming(reciterId: string, surahNumber: number): Promise<SurahTiming | null> {
    // Restrict the id to plain chars so the path can't escape the datasets dir.
    if (
      !/^[a-z0-9-]+$/.test(reciterId) ||
      !isValidSurahNumber(surahNumber) ||
      !this.#reciters().includes(reciterId)
    ) {
      return Promise.resolve(null);
    }
    const key = `${reciterId}/${surahNumber}`;
    let doc = this.#cache.get(key);
    if (doc === undefined) {
      const rel = `timings/${reciterId}/${surahNumber}.json`;
      doc = existsSync(join(datasetsBase(), rel)) ? loadJson<SurahTiming>(rel) : null;
      this.#cache.set(key, doc);
    }
    return Promise.resolve(doc);
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
    // Own-property check, not `in`: `in` walks the prototype chain, so an edition
    // like "constructor"/"__proto__" would pass and then readFileSync would throw
    // ENOENT (→ a 500). An unknown edition must return null, like any other.
    if (!Object.prototype.hasOwnProperty.call(this.#loadIndex().translations, translationId)) {
      return null;
    }
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

const ADHKAR = adhkarData.adhkar as readonly Dhikr[];

/** Serves the bundled adhkar collection (ingested from Ḥiṣn al-Muslim). */
export class FileAdhkarRepository implements AdhkarRepository {
  all(): Promise<readonly Dhikr[]> {
    return Promise.resolve(ADHKAR);
  }
  byOccasion(occasion: AdhkarOccasion): Promise<readonly Dhikr[]> {
    return Promise.resolve(filterByOccasion(ADHKAR, occasion));
  }
}

const ASMA = asmaData.names as readonly DivineName[];

/** Serves the bundled 99 Names of Allah. */
export class FileAsmaRepository implements AsmaRepository {
  all(): Promise<readonly DivineName[]> {
    return Promise.resolve(ASMA);
  }
}

/**
 * Serves the reading-plan catalogue. The curated templates are bundled in
 * `core` (so both apps load them offline, like the Duʿās); this adapter
 * re-serves them through `PlanCatalogPort` so the API and any future remote
 * catalogue depend only on the port, never on where the templates live.
 */
export class BundledPlanCatalog implements PlanCatalogPort {
  all(): Promise<readonly PlanTemplate[]> {
    return Promise.resolve(PLAN_TEMPLATES);
  }
  byId(id: string): Promise<PlanTemplate | null> {
    return Promise.resolve(PLAN_TEMPLATES.find((t) => t.id === id) ?? null);
  }
}

interface HadithDoc {
  collectionId: string;
  name: string;
  sections: Record<string, string>;
  hadiths: Hadith[];
}

/**
 * Serves the hadith collections from the ingested datasets (ADR 0022) — each
 * collection's full edition is read lazily from disk and cached, replacing the
 * previous per-section runtime fetch. `getSection` filters by book number.
 */
export class FileHadithRepository implements HadithRepository {
  readonly #cache = new Map<string, HadithDoc | null>();

  #load(collectionId: string): HadithDoc | null {
    const cached = this.#cache.get(collectionId);
    if (cached !== undefined) return cached;
    // Restrict to plain ids so the path can't escape the datasets directory.
    const rel = `hadiths/${collectionId}.json`;
    const doc = /^[a-z0-9-]+$/.test(collectionId) && existsSync(join(datasetsBase(), rel))
      ? loadJson<HadithDoc>(rel)
      : null;
    this.#cache.set(collectionId, doc);
    return doc;
  }

  getCollection(collectionId: string): Promise<HadithCollection | null> {
    return Promise.resolve(this.#load(collectionId));
  }

  getSection(collectionId: string, section: number): Promise<HadithSection | null> {
    const doc = this.#load(collectionId);
    if (!doc) return Promise.resolve(null);
    const hadiths = doc.hadiths.filter((h) => h.reference.book === section);
    if (hadiths.length === 0) return Promise.resolve(null);
    return Promise.resolve({
      collectionId,
      section,
      name: doc.sections[String(section)] ?? doc.name,
      hadiths,
    });
  }
}
