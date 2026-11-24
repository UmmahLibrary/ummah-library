import { quranRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { HifzDashboard } from "../../components/HifzDashboard";

export const metadata = {
  title: "Hifz",
  description: "Memorise the Quran with spaced review — track the āyāt you are learning.",
  alternates: { canonical: "/hifz" },
};

export default async function HifzPage() {
  const surahs = await quranRepository.listSurahs();
  const surahMeta = surahs.map((s) => ({
    number: s.number,
    name: s.name,
    transliteration: s.transliteration,
    ayahCount: s.ayahCount,
  }));

  return (
    <NoorPageFrame
      title="Ḥifẓ Review"
      sub="Spaced-repetition memorization, tuned to your recall"
      glyph="✦"
      back="/"
    >
      <HifzDashboard surahs={surahMeta} />
    </NoorPageFrame>
  );
}
