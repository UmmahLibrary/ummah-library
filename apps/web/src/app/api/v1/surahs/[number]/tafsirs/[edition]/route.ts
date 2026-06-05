import { isValidSurahNumber } from "@ummahlibrary/core";
import { tafsirRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../lib/api-response";

// Dynamic: tafsir is fetched at runtime from the edition's source.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string; edition: string }> },
) {
  const { number, edition } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const entries = await tafsirRepository.getSurahTafsir(edition, n);
  if (entries.length === 0) return apiJson({ error: "tafsir_not_found" }, { status: 404 });
  return apiJson({ surah: n, tafsir: edition, entries });
}
