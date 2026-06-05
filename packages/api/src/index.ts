/**
 * @ummahlibrary/api
 *
 * The application layer. Phase 2 turns this into a tRPC router (with a REST /
 * OpenAPI mirror) consuming the core ports. For Phase 0 it exposes a plain
 * service object so apps depend on `api` — not directly on `data` — keeping the
 * dependency direction app → api → core/data intact.
 */
import type { QuranRepository, Surah } from "@ummahlibrary/core";
import { StaticQuranRepository } from "@ummahlibrary/data";

export interface QuranService {
  listSurahs(): Promise<readonly Surah[]>;
}

/** Build a service from any `QuranRepository` implementation. */
export function createQuranService(repo: QuranRepository): QuranService {
  return {
    listSurahs: () => repo.listSurahs(),
  };
}

/** Default service wired to the sample static repository (Phase 0). */
export const quranService: QuranService = createQuranService(new StaticQuranRepository());
