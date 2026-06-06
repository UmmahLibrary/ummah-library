import { isValidSurahNumber } from "@ummahlibrary/core";
import { translationCatalog } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../lib/api-response";

// Dynamic: catalogue editions are fetched per-surah at runtime (ADR 0011).
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ edition: string; number: string }> },
) {
  const { edition, number } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const ayahs = await translationCatalog.getSurahTranslation(edition, n);
  if (ayahs.length === 0) return apiJson({ error: "translation_not_found" }, { status: 404 });
  return apiJson({ surah: n, edition, ayahs });
}
