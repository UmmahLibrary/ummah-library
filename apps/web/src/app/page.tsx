import Link from "next/link";
import { quranRepository } from "@ummahlibrary/api";
import { ReadingShelf } from "../components/ReadingShelf";
import { SurahIndex } from "../components/SurahIndex";
import { ThemeToggle } from "../components/ThemeToggle";
import { HifzNavLink } from "../components/HifzNavLink";
import { HijriToday } from "../components/HijriToday";
import { ReadingGoalBadge } from "../components/ReadingGoalBadge";
import { VerseOfDay } from "../components/VerseOfDay";

export default async function HomePage() {
  const surahs = await quranRepository.listSurahs();

  return (
    <>
      <header className="site-head">
        <div>
          <h1>Ummah Library</h1>
          <p>Quran, Hadith, Adhkar &amp; Islamic tools — open source.</p>
          <HijriToday />
          <ReadingGoalBadge />
        </div>
        <nav className="head-nav">
          <Link href="/search" className="head-link head-link--search">
            🔍 Search
          </Link>
          <span className="nav-divider" aria-hidden="true" />
          <Link href="/juz" className="head-link">
            Juzʾ
          </Link>
          <Link href="/page/1" className="head-link">
            Mushaf
          </Link>
          <Link href="/hadith" className="head-link">
            Hadith
          </Link>
          <HifzNavLink />
          <Link href="/goals" className="head-link">
            Goals
          </Link>
          <Link href="/collections" className="head-link">
            Collections
          </Link>
          <span className="nav-divider" aria-hidden="true" />
          <Link href="/adhkar" className="head-link">
            Adhkar
          </Link>
          <Link href="/tasbih" className="head-link">
            Tasbih
          </Link>
          <Link href="/names" className="head-link">
            99 Names
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
          <span className="nav-divider" aria-hidden="true" />
          <ThemeToggle />
        </nav>
      </header>

      <VerseOfDay />

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

      <p className="foot">
        <Link href="/settings" className="foot-link">
          Your data &amp; settings
        </Link>{" "}
        ·{" "}
        <Link href="/offline" className="foot-link">
          Offline
        </Link>{" "}
        · Sadaqah Jariyah ·{" "}
        <a
          href="https://github.com/UmmahLibrary/ummah-library"
          className="foot-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          AGPL-3.0 on GitHub
        </a>
      </p>
    </>
  );
}
