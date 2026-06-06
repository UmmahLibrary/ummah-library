import type { Metadata } from "next";
import Link from "next/link";
import { quranRepository } from "@ummahlibrary/api";
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
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Search</div>
        <div className="sub">Across the Arabic and the English translation</div>
      </header>
      <SearchView
        surahs={surahs.map((s) => ({
          number: s.number,
          transliteration: s.transliteration,
          englishName: s.englishName,
        }))}
      />
    </>
  );
}
