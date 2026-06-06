import { TOTAL_SURAHS } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

// The full Arabic corpus (all 6,236 āyāt) as one static payload, so the
// client search index loads with a single request. Prerendered at build time.
export const dynamic = "force-static";

export async function GET() {
  const verses: { s: number; a: number; t: string }[] = [];
  for (let s = 1; s <= TOTAL_SURAHS; s++) {
    const ayahs = await quranRepository.getSurahAyahs(s);
    for (const ayah of ayahs) verses.push({ s, a: ayah.aya, t: ayah.text });
  }
  return apiJson({ count: verses.length, verses });
}
