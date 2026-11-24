import { quranRepository } from "@ummahlibrary/api";
import type { Metadata } from "next";
import { NoorHomePage } from "../components/NoorHomePage";

const SHARE_TITLE = "Ummah Library — the open-source Quran & Islamic library";
const SHARE_DESCRIPTION =
  "Read, listen, memorise and track — free, private and offline. No ads, no tracking, no account. A community Sadaqah Jariyah, licensed AGPL-3.0.";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: SHARE_TITLE, description: SHARE_DESCRIPTION },
  twitter: { title: SHARE_TITLE, description: SHARE_DESCRIPTION },
};

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
        revelationOrder: s.revelationOrder,
      }))}
    />
  );
}
