import Link from "next/link";
import { quranRepository } from "@ummahlibrary/api";

export default async function HomePage() {
  const surahs = await quranRepository.listSurahs();

  return (
    <>
      <header className="site-head">
        <div>
          <h1>Ummah Library</h1>
          <p>Read the Quran — {surahs.length} surahs, open source.</p>
        </div>
      </header>

      <nav className="surah-grid">
        {surahs.map((surah) => (
          <Link key={surah.number} href={`/surah/${surah.number}`} className="surah-card">
            <span className="surah-num">{surah.number}</span>
            <span className="meta">
              <span className="name-en">{surah.transliteration}</span>
              <br />
              <span className="sub">
                {surah.englishName} · {surah.ayahCount} āyāt
              </span>
            </span>
            <span className="name-ar arabic">{surah.name}</span>
          </Link>
        ))}
      </nav>

      <p className="foot">Sadaqah Jariyah · AGPL-3.0</p>
    </>
  );
}
