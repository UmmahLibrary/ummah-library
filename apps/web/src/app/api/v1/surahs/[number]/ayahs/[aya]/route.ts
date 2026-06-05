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
  return apiJson({ ayah: arabic, translation });
}
