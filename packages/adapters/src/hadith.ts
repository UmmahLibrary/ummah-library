import type { Hadith, HadithRepository, HadithSection, PluginRegistry } from "@ummahlibrary/core";
import { hadithSectionUrl } from "@ummahlibrary/core";

/** The fawazahmed0 hadith-api per-section shape (minified editions). */
interface FawazHadithSection {
  metadata: { name: string; section: Record<string, string> };
  hadiths: {
    hadithnumber: number;
    text: string;
    grades?: ({ name: string; grade: string } | string)[];
    reference: { book: number; hadith: number };
  }[];
}

type FetchLike = typeof fetch;

/**
 * `HadithRepository` that fetches a collection section at runtime from its
 * plugin's URL (e.g. fawazahmed0/hadith-api). The network call is injectable so
 * it can be tested without a network.
 */
export class HttpHadithRepository implements HadithRepository {
  readonly #registry: PluginRegistry;
  readonly #fetch: FetchLike;

  constructor(registry: PluginRegistry, fetchFn: FetchLike = fetch) {
    this.#registry = registry;
    this.#fetch = fetchFn;
  }

  async getSection(collectionId: string, section: number): Promise<HadithSection | null> {
    const plugin = this.#registry.get(collectionId);
    if (!plugin || plugin.kind !== "hadith") return null;
    const response = await this.#fetch(hadithSectionUrl(plugin, section));
    if (!response.ok) return null;
    const data = (await response.json()) as FawazHadithSection;

    const name = data.metadata.section[String(section)] ?? data.metadata.name;
    const hadiths: Hadith[] = data.hadiths.map((h) => ({
      collectionId,
      number: h.hadithnumber,
      text: h.text,
      grades: (h.grades ?? []).map((g) => (typeof g === "string" ? g : `${g.name}: ${g.grade}`)),
      reference: h.reference,
    }));
    return { collectionId, section, name, hadiths };
  }
}
