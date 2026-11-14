import { notFound } from "next/navigation";
import { pluginRegistry, quranRepository } from "@ummahlibrary/api";
import { KidsReader } from "../../../components/KidsReader";
import { KIDS_SURAHS } from "../../../lib/kids-store";

const RECITERS = pluginRegistry.byKind("reciter");

export const dynamicParams = false;

export function generateStaticParams() {
  return KIDS_SURAHS.map((n) => ({ number: String(n) }));
}

export default async function KidsSurahPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: raw } = await params;
  const number = Number(raw);
  if (!KIDS_SURAHS.includes(number)) notFound();
  const [surah, ayahs, bismillah] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    quranRepository.getBismillah(),
  ]);
  if (!surah) notFound();
  return (
    <KidsReader
      surah={{
        number: surah.number,
        name: surah.name,
        transliteration: surah.transliteration,
        englishName: surah.englishName,
      }}
      ayahs={ayahs.map((a) => ({ aya: a.aya, text: a.text }))}
      reciters={RECITERS}
      bismillah={surah.hasBismillah && surah.number !== 1 ? bismillah : null}
    />
  );
}
