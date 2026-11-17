import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { pluginRegistry, quranRepository } from "@ummahlibrary/api";
import { ListenClient } from "../../../components/ListenClient";

const RECITERS = pluginRegistry.byKind("reciter");

// Static for all 114 surahs, like the reader.
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ number: String(i + 1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const surah = await quranRepository.getSurah(Number(number));
  if (!surah) return { title: "Not found" };
  return {
    title: `Listen · ${surah.transliteration}`,
    description: `Listen to Surah ${surah.transliteration} (${surah.englishName}) with the translation, āyah by āyah.`,
    alternates: { canonical: `/listen/${surah.number}` },
  };
}

export default async function ListenPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: raw } = await params;
  const number = Number(raw);
  if (!isValidSurahNumber(number)) notFound();
  const [surah, ayahs, prev, next] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    number > 1 ? quranRepository.getSurah(number - 1) : Promise.resolve(null),
    number < TOTAL_SURAHS ? quranRepository.getSurah(number + 1) : Promise.resolve(null),
  ]);
  if (!surah) notFound();
  return (
    <ListenClient
      surah={{
        number: surah.number,
        name: surah.name,
        transliteration: surah.transliteration,
        englishName: surah.englishName,
        ayahCount: surah.ayahCount,
      }}
      ayahs={ayahs.map((a) => ({ aya: a.aya, text: a.text }))}
      reciters={RECITERS}
      prev={prev ? { number: prev.number, transliteration: prev.transliteration } : null}
      next={next ? { number: next.number, transliteration: next.transliteration } : null}
    />
  );
}
