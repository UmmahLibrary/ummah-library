import Link from "next/link";
import { quranRepository } from "@ummahlibrary/api";
import { ReadingShelf } from "../components/ReadingShelf";
import { SurahIndex } from "../components/SurahIndex";
import { ThemeToggle } from "../components/ThemeToggle";
import { HifzNavLink } from "../components/HifzNavLink";
import { HijriToday } from "../components/HijriToday";
import { ReadingGoalBadge } from "../components/ReadingGoalBadge";

export default async function HomePage() {
  const surahs = await quranRepository.listSurahs();

  return (
    <>
      <header className="site-head">
        <div>
          <h1>Ummah Library</h1>
          <p>Read the Quran — {surahs.length} surahs, open source.</p>
          <HijriToday />
          <ReadingGoalBadge />
        </div>
        <nav className="head-nav">
          <Link href="/search" className="head-link">
            Search
          </Link>
          <Link href="/goals" className="head-link">
            Goals
          </Link>
          <Link href="/juz" className="head-link">
            Juzʾ
          </Link>
          <Link href="/page/1" className="head-link">
            Mushaf
          </Link>
          <Link href="/hadith" className="head-link">
            Hadith
          </Link>
          <Link href="/adhkar" className="head-link">
            Adhkar
          </Link>
          <Link href="/prayer-times" className="head-link">
            Prayer times
          </Link>
          <Link href="/qibla" className="head-link">
            Qibla
          </Link>
          <Link href="/calendar" className="head-link">
            Calendar
          </Link>
          <Link href="/zakat" className="head-link">
            Zakat
          </Link>
          <HifzNavLink />
          <ThemeToggle />
        </nav>
      </header>

      <ReadingShelf
        surahs={surahs.map((s) => ({
          number: s.number,
          transliteration: s.transliteration,
          englishName: s.englishName,
        }))}
      />

      <SurahIndex
        surahs={surahs.map((s) => ({
          number: s.number,
          name: s.name,
          transliteration: s.transliteration,
          englishName: s.englishName,
          ayahCount: s.ayahCount,
        }))}
      />

      <p className="foot">Sadaqah Jariyah · AGPL-3.0</p>
    </>
  );
}
