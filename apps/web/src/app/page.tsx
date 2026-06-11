import { quranRepository } from "@ummahlibrary/api";
import { NoorHomePage } from "../components/NoorHomePage";

export default async function HomePage() {
  const surahs = await quranRepository.listSurahs();

  return (
    <NoorHomePage
      surahs={surahs.map((s) => ({
        number: s.number,
        name: s.name,
        transliteration: s.transliteration,
        englishName: s.englishName,
        ayahCount: s.ayahCount,
        revelationPlace: s.revelationPlace,
      }))}
    />
  );
}
