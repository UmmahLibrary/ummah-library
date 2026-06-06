/**
 * @ummahlibrary/adapters
 *
 * Concrete adapters for external concerns that sit *behind* core ports —
 * databases, AI providers, audio, storage. Each external tool the app touches
 * gets an adapter here so the core stays framework- and vendor-free.
 */
import type { HifzCard, HifzRecord, HifzRepository, VerseKey } from "@ummahlibrary/core";
import { compareVerseKeys, isDue } from "@ummahlibrary/core";

export { HttpTafsirRepository } from "./tafsir";
export { HttpHadithRepository } from "./hadith";
export { HttpTranslationCatalog } from "./translation-catalog";

const key = (ayah: VerseKey): string => `${ayah.sura}:${ayah.aya}`;
const byMushafOrder = (a: HifzRecord, b: HifzRecord): number => compareVerseKeys(a.ayah, b.ayah);

/**
 * In-memory `HifzRepository` — the reference progress store. Useful for tests
 * and as the template for the real SQLite (mobile) and Postgres (server)
 * adapters: same port, durable storage.
 */
export class InMemoryHifzRepository implements HifzRepository {
  readonly #cards = new Map<string, HifzRecord>();

  get(ayah: VerseKey): Promise<HifzCard | null> {
    return Promise.resolve(this.#cards.get(key(ayah))?.card ?? null);
  }

  save(ayah: VerseKey, card: HifzCard): Promise<void> {
    this.#cards.set(key(ayah), { ayah, card });
    return Promise.resolve();
  }

  remove(ayah: VerseKey): Promise<void> {
    this.#cards.delete(key(ayah));
    return Promise.resolve();
  }

  due(now: Date): Promise<readonly HifzRecord[]> {
    const records = [...this.#cards.values()].filter((r) => isDue(r.card, now));
    return Promise.resolve(records.sort(byMushafOrder));
  }

  all(): Promise<readonly HifzRecord[]> {
    return Promise.resolve([...this.#cards.values()].sort(byMushafOrder));
  }
}
