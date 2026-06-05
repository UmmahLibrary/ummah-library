import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ number: String(i + 1) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const [surah, ayahs] = await Promise.all([
    quranRepository.getSurah(n),
    quranRepository.getSurahAyahs(n),
  ]);
  if (!surah) return apiJson({ error: "surah_not_found" }, { status: 404 });
  return apiJson({ surah, ayahs });
}
