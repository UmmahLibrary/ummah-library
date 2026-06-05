/**
 * @ummahlibrary/data
 *
 * Owns the versioned Quran source data and the adapter that exposes it through
 * the core's ports. Phase 1 replaces the hardcoded sample below with ingested
 * Tanzil JSON and a generated SQLite database. For the Phase 0 scaffold this is
 * just enough to prove the core → port → adapter → app wiring renders.
 */
import type { QuranRepository, Surah } from "@ummahlibrary/core";

// A tiny placeholder slice of the surah list. NOT the real data set.
const SAMPLE_SURAHS: readonly Surah[] = [
  { number: 1, name: "Al-Fātiḥah" },
  { number: 2, name: "Al-Baqarah" },
  { number: 112, name: "Al-Ikhlāṣ" },
  { number: 113, name: "Al-Falaq" },
  { number: 114, name: "An-Nās" },
];

/** In-memory `QuranRepository` backed by the sample data above. */
export class StaticQuranRepository implements QuranRepository {
  listSurahs(): Promise<readonly Surah[]> {
    return Promise.resolve(SAMPLE_SURAHS);
  }
}
