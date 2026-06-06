import type {
  TextDirection,
  TranslatedAyah,
  Translation,
  TranslationRepository,
  VerseKey,
} from "@ummahlibrary/core";

const FAWAZ_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1";

/** One entry in fawazahmed0/quran-api `editions.json`. */
interface FawazEdition {
  /** The edition slug, used in content URLs (e.g. "eng-mustafakhattaba"). */
  name: string;
  author: string;
  /** Full English language name (e.g. "English", "Urdu"). */
  language: string;
  direction?: TextDirection;
}

/** fawazahmed0 per-chapter response shape. */
interface FawazChapter {
  chapter: { chapter: number; verse: number; text: string }[];
}

type FetchLike = typeof fetch;

/**
 * A `TranslationRepository` over the **full** fawazahmed0/quran-api catalogue
 * (~490 editions across ~98 languages), fetched at runtime rather than ingested
 * — see ADR 0011. The edition list is cached for the lifetime of the instance.
 * The network call is injectable for testing.
 *
 * The fawazahmed0 catalogue has no per-edition display name (only the slug and
 * the author), so the author doubles as the edition name; grouping/search work
 * off the language name via the pure `core` helpers.
 */
export class HttpTranslationCatalog implements TranslationRepository {
  readonly #base: string;
  readonly #fetch: FetchLike;
  #editions?: Promise<readonly Translation[]>;

  constructor(fetchFn: FetchLike = fetch, base: string = FAWAZ_BASE) {
    this.#fetch = fetchFn;
    this.#base = base;
  }

  listTranslations(): Promise<readonly Translation[]> {
    this.#editions ??= (async () => {
      const res = await this.#fetch(`${this.#base}/editions.json`);
      if (!res.ok) return [];
      const data = (await res.json()) as Record<string, FawazEdition>;
      return Object.values(data)
        .map(
          (e): Translation => ({
            id: e.name,
            name: e.author,
            author: e.author,
            language: e.language,
            direction: e.direction ?? "ltr",
          }),
        )
        .sort((a, b) => a.language.localeCompare(b.language) || a.name.localeCompare(b.name));
    })();
    return this.#editions;
  }

  async getSurahTranslation(
    translationId: string,
    surahNumber: number,
  ): Promise<readonly TranslatedAyah[]> {
    const res = await this.#fetch(`${this.#base}/editions/${translationId}/${surahNumber}.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as FawazChapter;
    return data.chapter.map((v) => ({
      sura: v.chapter,
      aya: v.verse,
      translationId,
      text: v.text,
    }));
  }

  async getTranslatedAyah(translationId: string, ref: VerseKey): Promise<TranslatedAyah | null> {
    const entries = await this.getSurahTranslation(translationId, ref.sura);
    return entries.find((e) => e.aya === ref.aya) ?? null;
  }
}
