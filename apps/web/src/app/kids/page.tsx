import type { Metadata } from "next";
import { quranRepository } from "@ummahlibrary/api";
import { KidsHome } from "../../components/KidsHome";
import { KIDS_SURAHS } from "../../lib/kids-store";

export const metadata: Metadata = {
  title: "For children",
  description: "Short surahs with big buttons, word-by-word audio and nothing to distract.",
};

export default async function KidsPage() {
  const all = await quranRepository.listSurahs();
  const surahs = KIDS_SURAHS.map((n) => all.find((s) => s.number === n)!).map((s) => ({
    number: s.number,
    name: s.name,
    transliteration: s.transliteration,
    englishName: s.englishName,
    ayahCount: s.ayahCount,
  }));
  return <KidsHome surahs={surahs} />;
}
