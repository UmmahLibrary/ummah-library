import type { Metadata } from "next";
import { quranRepository } from "@ummahlibrary/api";
import { NoorHomePage } from "../../components/NoorHomePage";

export const metadata: Metadata = {
  title: "The Quran",
  description: "All 114 surahs of the Quran — browse by surah, juzʾ or place of revelation.",
  alternates: { canonical: "/quran" },
};

export default async function QuranIndexPage() {
  const surahs = await quranRepository.listSurahs();
  return (
    <NoorHomePage
      variant="quran"
      surahs={surahs.map((s) => ({
        number: s.number,
        name: s.name,
        transliteration: s.transliteration,
        englishName: s.englishName,
        ayahCount: s.ayahCount,
        revelationPlace: s.revelationPlace,
        revelationOrder: s.revelationOrder,
      }))}
    />
  );
}
