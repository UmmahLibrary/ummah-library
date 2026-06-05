import Link from "next/link";
import { JUZ_STARTS } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";

export const metadata = { title: "Juzʾ" };

export default async function JuzPage() {
  const surahs = await quranRepository.listSurahs();
  const byNumber = new Map(surahs.map((s) => [s.number, s]));

  return (
    <>
      <Link href="/" className="back-link">
        ← All surahs
      </Link>
      <header className="site-head">
        <div>
          <h1>Juzʾ</h1>
          <p>Jump to the start of any of the 30 ajzāʾ.</p>
        </div>
      </header>

      <nav className="surah-grid">
        {JUZ_STARTS.map((start, i) => {
          const surah = byNumber.get(start.sura);
          return (
            <Link
              key={i}
              href={`/surah/${start.sura}#${start.sura}:${start.aya}`}
              className="surah-card"
            >
              <span className="surah-num">{i + 1}</span>
              <span className="meta">
                <span className="name-en">Juzʾ {i + 1}</span>
                <br />
                <span className="sub">
                  {surah?.transliteration} {start.sura}:{start.aya}
                </span>
              </span>
              <span className="name-ar arabic">{surah?.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
