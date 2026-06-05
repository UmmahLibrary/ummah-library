import type { PluginRegistry, TafsirEntry, TafsirRepository, VerseKey } from "@ummahlibrary/core";
import { tafsirSurahUrl } from "@ummahlibrary/core";

/** The spa5k tafsir_api per-surah entry shape. */
interface SpaTafsirEntry {
  surah: number;
  ayah: number;
  text: string;
}

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
    const entries = (await response.json()) as SpaTafsirEntry[];
    return entries.map((e) => ({ sura: e.surah, aya: e.ayah, tafsirId, text: e.text }));
  }

  async getAyahTafsir(tafsirId: string, ref: VerseKey): Promise<TafsirEntry | null> {
    const entries = await this.getSurahTafsir(tafsirId, ref.sura);
    return entries.find((e) => e.aya === ref.aya) ?? null;
  }
}
