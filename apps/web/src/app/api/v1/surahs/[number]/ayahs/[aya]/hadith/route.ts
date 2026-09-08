import { isValidVerseRef } from "@ummahlibrary/core";
import { relatedHadith } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../../lib/api-response";

/**
 * Hadith that verbatim quote an ayah (#200, ADR 0042).
 *
 * Dynamic rather than prerendered: only 411 of 6,236 ayahs carry links, so
 * statically generating all 6,236 would spend most of the build writing empty
 * responses. The route reads two bundled datasets at request time — no network —
 * and `apiJson`'s cache headers absorb repeat traffic.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string; aya: string }> },
) {
  const { number, aya } = await params;
  const sura = Number(number);
  const ayaNum = Number(aya);
  if (!isValidVerseRef(sura, ayaNum)) return apiJson({ error: "ayah_not_found" }, { status: 404 });

  const hadiths = await relatedHadith({ sura, aya: ayaNum });
  return apiJson({ verse: `${sura}:${ayaNum}`, count: hadiths.length, hadiths });
}
