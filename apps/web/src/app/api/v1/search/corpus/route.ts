import { TOTAL_SURAHS } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

// The full Arabic corpus (all 6,236 āyāt) as one static payload, so the
// client search index loads with a single request. Prerendered at build time.
export const dynamic = "force-static";

export async function GET() {
  // Read all 114 suras concurrently (independent local reads), then flatten in
  // sura order — same payload as a sequential loop, without the round-trips.
  const perSurah = await Promise.all(
    Array.from({ length: TOTAL_SURAHS }, (_, i) =>
      quranRepository
        .getSurahAyahs(i + 1)
        .then((ayahs) => ayahs.map((ayah) => ({ s: i + 1, a: ayah.aya, t: ayah.text }))),
    ),
  );
  const verses = perSurah.flat();
  return apiJson({ count: verses.length, verses });
}
