import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { N } from "../../../components/noor";
import { SurahReaderClient } from "../../../components/SurahReaderClient";
import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { pluginRegistry, quranRepository } from "@ummahlibrary/api";

const RECITERS = pluginRegistry.byKind("reciter");
const TAFSIRS = pluginRegistry.byKind("tafsir").map((t) => ({ id: t.id, name: t.name }));

// Render all 114 surahs at build time — no data access at runtime.
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ number: String(i + 1) }));
}

async function loadSurah(numberParam: string) {
  const number = Number(numberParam);
  if (!isValidSurahNumber(number)) return null;
  const [surah, ayahs, bismillah, prevSurah, nextSurah] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    quranRepository.getBismillah(),
    number > 1 ? quranRepository.getSurah(number - 1) : Promise.resolve(null),
    number < TOTAL_SURAHS ? quranRepository.getSurah(number + 1) : Promise.resolve(null),
  ]);
  if (!surah) return null;
  return { number, surah, ayahs, bismillah, prevSurah, nextSurah };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const data = await loadSurah(number);
  if (!data) return { title: "Not found" };
  const { surah } = data;
  const place = surah.revelationPlace === "meccan" ? "Mecca" : "Medina";
  const title = `${surah.transliteration} — ${surah.englishName}`;
  const description =
    `Read Surah ${surah.transliteration} (${surah.englishName}), chapter ${surah.number} of ` +
    `the Quran — ${surah.ayahCount} āyāt, revealed in ${place}. Uthmani Arabic with ` +
    `translations, tafsir and recitation on Ummah Library.`;
  const url = `/surah/${surah.number}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SurahPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: numberParam } = await params;
  const data = await loadSurah(numberParam);
  if (!data) notFound();
  const { surah, ayahs, bismillah, prevSurah, nextSurah } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `Surah ${surah.transliteration} — ${surah.englishName}`,
    alternateName: surah.name,
    inLanguage: "ar",
    position: surah.number,
    isPartOf: { "@type": "Book", name: "The Holy Quran" },
    url: `https://app.ummahlibrary.org/surah/${surah.number}`,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: N.bg,
        color: N.fg,
        overflow: "hidden",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SurahReaderClient
        surah={{
          number: surah.number,
          name: surah.name,
          transliteration: surah.transliteration,
          englishName: surah.englishName,
          ayahCount: surah.ayahCount,
          revelationPlace: surah.revelationPlace,
          hasBismillah: surah.hasBismillah,
        }}
        ayahs={ayahs.map((a) => ({ aya: a.aya, text: a.text }))}
        bismillah={bismillah}
        prevSurah={
          prevSurah
            ? { number: prevSurah.number, transliteration: prevSurah.transliteration }
            : null
        }
        nextSurah={
          nextSurah
            ? { number: nextSurah.number, transliteration: nextSurah.transliteration }
            : null
        }
        reciters={RECITERS}
        tafsirs={TAFSIRS}
      />
    </div>
  );
}
