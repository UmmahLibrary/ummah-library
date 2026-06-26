import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { indopakQuranRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../lib/api-response";

// Static: one prerendered JSON per surah at build time (ADR 0035). The IndoPak
// text is bundled, so this needs no runtime function — the reader fetches it as a
// static file only when the IndoPak script is selected.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ number: String(i + 1) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const ayahs = await indopakQuranRepository.getSurahAyahs(n);
  return apiJson({ ayahs });
}
