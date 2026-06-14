import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TOTAL_PAGES_MADANI,
  ayahCountOf,
  isValidPageNumber,
  juzNumberOf,
  pageRange,
} from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";
import { ReadingTracker } from "../../../components/ReadingTracker";

// Render all 604 Madani-Mushaf pages at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_PAGES_MADANI }, (_, i) => ({ number: String(i + 1) }));
}

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

async function loadPage(numberParam: string) {
  const n = Number(numberParam);
  if (!isValidPageNumber(n)) return null;
  const { start, end } = pageRange(n);
  const bismillah = await quranRepository.getBismillah();

  const sections = [];
  for (let sura = start.sura; sura <= end.sura; sura++) {
    const ayaStart = sura === start.sura ? start.aya : 1;
    const ayaEnd = sura === end.sura ? end.aya : ayahCountOf(sura);
    const [surah, allAyahs] = await Promise.all([
      quranRepository.getSurah(sura),
      quranRepository.getSurahAyahs(sura),
    ]);
    if (!surah) continue;
    const ayahs = allAyahs
      .filter((a) => a.aya >= ayaStart && a.aya <= ayaEnd)
      .map((a) => ({ aya: a.aya, text: a.text }));
    sections.push({
      surah,
      ayahs,
      // A page shows the surah header only where that surah actually begins.
      startsSurah: ayaStart === 1,
    });
  }
  return { n, sections, juz: juzNumberOf(start), bismillah };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const n = Number(number);
  if (!isValidPageNumber(n)) return { title: "Not found" };
  const title = `Mushaf — page ${n}`;
  const description = `Read page ${n} of ${TOTAL_PAGES_MADANI} of the Madani Mushaf in Uthmani Arabic on Ummah Library.`;
  return {
    title,
    description,
    alternates: { canonical: `/page/${n}` },
    openGraph: { title, description, url: `/page/${n}`, type: "article" },
  };
}

export default async function MushafPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const data = await loadPage(number);
  if (!data) notFound();
  const { n, sections, juz, bismillah } = data;

  return (
    <>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 clamp(16px,4vw,36px) 48px" }}>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Mushaf</div>
        <div className="sub">
          Page {n} of {TOTAL_PAGES_MADANI} · Juzʾ {juz}
        </div>
      </header>

      <ReadingTracker page={n} />
      <div className="mushaf-page">
        {sections.map((section) => (
          <section key={section.surah.number}>
            {section.startsSurah && (
              <header className="mushaf-surah-head">
                <span className="name-ar arabic">{section.surah.name}</span>
                <span className="sub">
                  {section.surah.transliteration} · {section.surah.englishName}
                </span>
              </header>
            )}
            {section.startsSurah && section.surah.hasBismillah && section.surah.number !== 1 && (
              <p className="basmala arabic">{bismillah}</p>
            )}
            <p className="mushaf arabic">
              {section.ayahs.map((ayah) => (
                <span key={ayah.aya}>
                  {ayah.text}
                  <span className="end-marker">﴿{toArabicDigits(ayah.aya)}﴾</span>{" "}
                </span>
              ))}
            </p>
          </section>
        ))}
      </div>

      <nav className="reader-nav">
        {n > 1 ? <Link href={`/page/${n - 1}`}>← Previous page</Link> : <span />}
        {n < TOTAL_PAGES_MADANI ? <Link href={`/page/${n + 1}`}>Next page →</Link> : <span />}
      </nav>
      <p className="foot">Arabic: Tanzil (CC-BY 3.0) · Madani Mushaf page layout</p>
      </div>
    </>
  );
}
