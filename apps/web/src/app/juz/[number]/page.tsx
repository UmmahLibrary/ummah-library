import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  JUZ_STARTS,
  TOTAL_JUZ,
  type VerseKey,
  ayahCountOf,
  isValidJuzNumber,
} from "@ummahlibrary/core";
import { pluginRegistry, quranRepository, translationRepository } from "@ummahlibrary/api";
import { ReadingAudio } from "../../../components/ReadingAudio";

const RECITERS = pluginRegistry.byKind("reciter");
const TRANSLATION = "eng-khattab";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_JUZ }, (_, i) => ({ number: String(i + 1) }));
}

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

/** The first and last verse of a juzʾ. */
function juzRange(n: number): { start: VerseKey; end: VerseKey } {
  const start = JUZ_STARTS[n - 1]!;
  if (n >= TOTAL_JUZ) return { start, end: { sura: 114, aya: 6 } };
  const next = JUZ_STARTS[n]!;
  const end =
    next.aya > 1
      ? { sura: next.sura, aya: next.aya - 1 }
      : { sura: next.sura - 1, aya: ayahCountOf(next.sura - 1) };
  return { start, end };
}

async function loadJuz(numberParam: string) {
  const n = Number(numberParam);
  if (!isValidJuzNumber(n)) return null;
  const { start, end } = juzRange(n);
  const bismillah = await quranRepository.getBismillah();

  const sections = [];
  const verses: VerseKey[] = [];
  for (let sura = start.sura; sura <= end.sura; sura++) {
    const ayaStart = sura === start.sura ? start.aya : 1;
    const ayaEnd = sura === end.sura ? end.aya : ayahCountOf(sura);
    const [surah, allAyahs, translation] = await Promise.all([
      quranRepository.getSurah(sura),
      quranRepository.getSurahAyahs(sura),
      translationRepository.getSurahTranslation(TRANSLATION, sura),
    ]);
    if (!surah) continue;
    const tr = new Map(translation.map((t) => [t.aya, t.text]));
    const ayahs = allAyahs
      .filter((a) => a.aya >= ayaStart && a.aya <= ayaEnd)
      .map((a) => ({ aya: a.aya, text: a.text, english: tr.get(a.aya) ?? "" }));
    for (const a of ayahs) verses.push({ sura, aya: a.aya });
    sections.push({
      surah,
      ayahs,
      showBismillah: ayaStart === 1 && surah.hasBismillah && surah.number !== 1,
    });
  }
  return { n, sections, verses, bismillah };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const n = Number(number);
  return { title: isValidJuzNumber(n) ? `Juzʾ ${n}` : "Not found" };
}

export default async function JuzReaderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const data = await loadJuz(number);
  if (!data) notFound();
  const { n, sections, verses, bismillah } = data;

  return (
    <>
      <Link href="/juz" className="back-link">
        ← All juzʾ
      </Link>
      <header className="reader-head">
        <div className="name-en">Juzʾ {n}</div>
        <div className="sub">{verses.length} āyāt</div>
      </header>

      <ReadingAudio verses={verses} reciters={RECITERS} />

      {sections.map((section) => (
        <section key={section.surah.number}>
          <header className="juz-surah-head">
            <span className="name-ar arabic">{section.surah.name}</span>
            <span className="sub">
              {section.surah.transliteration} · {section.surah.englishName}
            </span>
          </header>
          {section.showBismillah && <p className="basmala arabic">{bismillah}</p>}
          {section.ayahs.map((ayah) => (
            <div key={ayah.aya} id={`${section.surah.number}:${ayah.aya}`} className="ayah">
              <p className="ayah-ar arabic">
                {ayah.text.split(" ").flatMap((word, i) => [
                  <span key={i} className="w" data-w={i}>
                    {word}
                  </span>,
                  " ",
                ])}
                <button
                  type="button"
                  className="ayah-marker"
                  data-play-key={`${section.surah.number}:${ayah.aya}`}
                  aria-label={`Play from āyah ${ayah.aya}`}
                >
                  ﴿{toArabicDigits(ayah.aya)}﴾
                </button>
              </p>
              {ayah.english && <p className="ayah-tr">{ayah.english}</p>}
              <div className="ayah-actions">
                <button
                  type="button"
                  className="hifz-btn"
                  data-play-one={`${section.surah.number}:${ayah.aya}`}
                  aria-label={`Play āyah ${ayah.aya}`}
                >
                  ▶ Play
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}

      <nav className="reader-nav">
        {n > 1 ? <Link href={`/juz/${n - 1}`}>← Previous juzʾ</Link> : <span />}
        {n < TOTAL_JUZ ? <Link href={`/juz/${n + 1}`}>Next juzʾ →</Link> : <span />}
      </nav>
      <p className="foot">Arabic: Tanzil (CC-BY 3.0) · Translation: The Clear Quran</p>
    </>
  );
}
