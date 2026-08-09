import type { PluginRegistry, TafsirEntry, TafsirRepository, VerseKey } from "@ummahlibrary/core";
import { tafsirSurahUrl } from "@ummahlibrary/core";

/**
 * The spa5k tafsir_api per-surah entry shape. `surah`/`ayah` are plain numbers
 * in some editions and numeric strings in others, so they are coerced on read.
 */
interface SpaTafsirEntry {
  surah: number | string;
  ayah: number | string;
  text: string;
}

/**
 * Most editions respond with a bare array; some (e.g. `ur-tafseer-ibn-e-kaseer`)
 * wrap it as `{ ayahs: [...] }` instead. Accept both.
 */
type SpaTafsirResponseBody = SpaTafsirEntry[] | { ayahs?: SpaTafsirEntry[] };

type FetchLike = typeof fetch;

/**
 * `TafsirRepository` that fetches a tafsir edition at runtime from the URL in
 * its plugin manifest (e.g. spa5k/tafsir_api on a CDN). The network call is
 * injectable so it can be tested without a network.
 */
export class HttpTafsirRepository implements TafsirRepository {
  readonly #registry: PluginRegistry;
  readonly #fetch: FetchLike;

  constructor(registry: PluginRegistry, fetchFn: FetchLike = fetch) {
    this.#registry = registry;
    this.#fetch = fetchFn;
  }

  async getSurahTafsir(tafsirId: string, surahNumber: number): Promise<readonly TafsirEntry[]> {
    const plugin = this.#registry.get(tafsirId);
    if (!plugin || plugin.kind !== "tafsir") return [];
    const response = await this.#fetch(tafsirSurahUrl(plugin, surahNumber));
    if (!response.ok) return [];
    // Guard a malformed 200 body (CDN error/placeholder) rather than crashing on `.map`.
    const data = (await response.json()) as SpaTafsirResponseBody | null;
    const entries = Array.isArray(data) ? data : Array.isArray(data?.ayahs) ? data.ayahs : [];
    return entries.map((e) => ({
      sura: Number(e.surah),
      aya: Number(e.ayah),
      tafsirId,
      text: e.text,
    }));
  }

  async getAyahTafsir(tafsirId: string, ref: VerseKey): Promise<TafsirEntry | null> {
    const entries = await this.getSurahTafsir(tafsirId, ref.sura);
    return entries.find((e) => e.aya === ref.aya) ?? null;
  }
}
