import { isValidVerseRef } from "@ummahlibrary/core";
import { relatedHadith, relatedHadithVerses } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../../lib/api-response";

/**
 * Hadith that verbatim quote an ayah (#200, ADR 0044 as amended).
 *
 * Prerendered for the 411 ayahs that actually have links. ADR 0044 originally
 * argued against prerendering because "only 411 of 6,236 ayahs carry links, so
 * statically generating all 6,236 would spend most of the build writing empty
 * responses" — true for all 6,236, but not for the 411, which are known at build
 * time. They cost the build 411 small files; the empty majority keeps the
 * on-demand path and costs nothing.
 *
 * Prerendering is not itself an offline mechanism — it puts the file on the
 * server and does not change the URL. Offline comes from the service worker's
 * content-API tier (`isContentApi` in `public/sw.js`), whose pattern matches
 * this path: an ayah opened once stays readable with no network, one never
 * opened does not. The two are complementary; see the ADR amendment for the
 * measurements and the bounds.
 */
export const dynamic = "force-static";
// Deliberately not `dynamicParams = false`: an ayah with no links is not in
// generateStaticParams and must still reach GET below, so it gets the documented
// `{ count: 0, hadiths: [] }` empty state rather than Next's HTML not-found
// page. The Related panel renders that as "no hadith quotes this āyah"; a 404
// would render as a load failure instead. Same reasoning as the translations
// route next door.
export const dynamicParams = true;

export async function generateStaticParams() {
  const verses = await relatedHadithVerses();
  return verses.map(({ sura, aya }) => ({ number: String(sura), aya: String(aya) }));
}

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
