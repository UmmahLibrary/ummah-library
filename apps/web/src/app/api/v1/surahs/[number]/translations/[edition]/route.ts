import { isValidSurahNumber } from "@ummahlibrary/core";
import { quranRepository, translationRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../lib/api-response";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const editions = await translationRepository.listTranslations();
  const surahs = await quranRepository.listSurahs();
  return surahs.flatMap((s) => editions.map((e) => ({ number: String(s.number), edition: e.id })));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string; edition: string }> },
) {
  const { number, edition } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const ayahs = await translationRepository.getSurahTranslation(edition, n);
  if (ayahs.length === 0) return apiJson({ error: "translation_not_found" }, { status: 404 });
  return apiJson({ surah: n, edition, ayahs });
}
