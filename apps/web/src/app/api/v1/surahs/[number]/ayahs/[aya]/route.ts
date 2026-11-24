import { isValidVerseRef } from "@ummahlibrary/core";
import { quranRepository, translationRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../lib/api-response";

// Dynamic: reads the ayah (and optional translation) from the datasets at request time.
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ number: string; aya: string }> },
) {
  const { number, aya } = await params;
  const sura = Number(number);
  const ayaNum = Number(aya);
  if (!isValidVerseRef(sura, ayaNum)) return apiJson({ error: "ayah_not_found" }, { status: 404 });

  const ref = { sura, aya: ayaNum };
  const edition = new URL(req.url).searchParams.get("edition");
  const [arabic, translation] = await Promise.all([
    quranRepository.getAyah(ref),
    edition ? translationRepository.getTranslatedAyah(edition, ref) : Promise.resolve(null),
  ]);
  // An unknown (or not bundled) edition was a silent `translation: null` with a
  // 200 — indistinguishable from a real gap. Answer like the per-surah
  // translation route does.
  if (edition && !translation) {
    return apiJson({ error: "translation_not_found" }, { status: 404 });
  }
  return apiJson({ ayah: arabic, translation });
}
