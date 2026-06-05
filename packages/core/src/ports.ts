/**
 * Ports (interfaces) the core exposes for adapters to implement. The core
 * depends only on these abstractions, never on a concrete data source.
 *
 * Phase 1 will flesh these out (QuranRepository, TranslationRepository, …).
 * For the Phase 0 scaffold they are intentionally minimal placeholders that
 * prove the ports-and-adapters wiring compiles end to end.
 */

export interface Surah {
  readonly number: number;
  readonly name: string;
}

export interface QuranRepository {
  /** Return metadata for every surah, ordered 1 → 114. */
  listSurahs(): Promise<readonly Surah[]>;
}
