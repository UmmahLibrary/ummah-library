import type { Metadata } from "next";
import { quranRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { SearchView } from "../../components/SearchView";

export const metadata: Metadata = {
  title: "Search the Quran",
  description:
    "Search the full Quran across the Uthmani Arabic and the English translation — instant results as you type, on Ummah Library.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage() {
  const surahs = await quranRepository.listSurahs();
  return (
    <NoorPageFrame
      title="Search"
      sub="Find any surah, verse, or topic"
      glyph="🔍"
      back="/"
    >
      <SearchView
        surahs={surahs.map((s) => ({
          number: s.number,
          transliteration: s.transliteration,
          englishName: s.englishName,
        }))}
      />
    </NoorPageFrame>
  );
}
