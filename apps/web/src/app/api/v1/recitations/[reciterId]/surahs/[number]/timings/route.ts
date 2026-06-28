import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { recitationTimingRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../../lib/api-response";

// Static: one prerendered JSON per reciter+surah at build time (ADR 0036). The
// word-by-word timings are bundled, so the player reads them as a static file and
// highlights words / tap-to-hear without a runtime call to the quran.com API.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const reciters = await recitationTimingRepository.reciterIds();
  return reciters.flatMap((reciterId) =>
    Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ reciterId, number: String(i + 1) })),
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reciterId: string; number: string }> },
) {
  const { reciterId, number } = await params;
  const n = Number(number);
  if (!isValidSurahNumber(n)) return apiJson({ error: "surah_not_found" }, { status: 404 });
  const timing = await recitationTimingRepository.getSurahTiming(reciterId, n);
  if (!timing) return apiJson({ error: "timing_not_found" }, { status: 404 });
  return apiJson(timing);
}
