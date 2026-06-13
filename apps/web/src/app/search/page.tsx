import type { Metadata } from "next";
import { quranRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { SearchView } from "../../components/SearchView";

export const metadata: Metadata = {
  title: "Search",
  description:
    "One search across the Quran (Arabic + English), the 99 Names of Allah, and the adhkār — instant results as you type, on Ummah Library.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage() {
  const surahs = await quranRepository.listSurahs();
  return (
    <NoorPageFrame
      title="Search"
      sub="One search across the Quran, the 99 Names, and adhkār"
      glyph="🔍"
      back="/"
      maxW={820}
    >
      <SearchView
        surahs={surahs.map((s) => ({
          number: s.number,
          name: s.name,
          transliteration: s.transliteration,
          englishName: s.englishName,
          ayahCount: s.ayahCount,
        }))}
      />
    </NoorPageFrame>
  );
}
