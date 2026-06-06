import Link from "next/link";
import { JUZ_STARTS, TOTAL_JUZ } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";

export const metadata = { title: "Juzʾ" };

/** The last surah a juzʾ touches (the next juzʾ starts at aya 1 of a new surah,
 * or mid-surah). */
function juzEndSura(n: number): number {
  if (n >= TOTAL_JUZ) return 114;
  const next = JUZ_STARTS[n]!;
  return next.aya > 1 ? next.sura : next.sura - 1;
}

export default async function JuzIndexPage() {
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
          <p>Read by juzʾ — each spans one or more surahs.</p>
        </div>
      </header>

      <nav className="surah-grid">
        {JUZ_STARTS.map((start, i) => {
          const n = i + 1;
          const first = byNumber.get(start.sura);
          const lastSura = juzEndSura(n);
          const last = byNumber.get(lastSura);
          const span =
            lastSura === start.sura
              ? first?.transliteration
              : `${first?.transliteration} – ${last?.transliteration}`;
          return (
            <Link key={n} href={`/juz/${n}`} className="surah-card">
              <span className="surah-num">{n}</span>
              <span className="meta">
                <span className="name-en">Juzʾ {n}</span>
                <br />
                <span className="sub">{span}</span>
              </span>
              <span className="name-ar arabic">{first?.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
