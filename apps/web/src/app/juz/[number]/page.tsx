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
import { ReadingModeToggle } from "../../../components/ReadingModeToggle";
import { EditionManager } from "../../../components/EditionManager";
import { DEFAULT_EDITIONS } from "../../../lib/editions";

const RECITERS = pluginRegistry.byKind("reciter");
const DEFAULT_EDITION = DEFAULT_EDITIONS[0]!;

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
  const [bismillah, editions] = await Promise.all([
    quranRepository.getBismillah(),
    translationRepository.listTranslations(),
  ]);

  const sections = [];
  const verses: VerseKey[] = [];
  for (let sura = start.sura; sura <= end.sura; sura++) {
    const ayaStart = sura === start.sura ? start.aya : 1;
    const ayaEnd = sura === end.sura ? end.aya : ayahCountOf(sura);
    const [surah, allAyahs, translations] = await Promise.all([
      quranRepository.getSurah(sura),
      quranRepository.getSurahAyahs(sura),
      Promise.all(editions.map((e) => translationRepository.getSurahTranslation(e.id, sura))),
    ]);
    if (!surah) continue;
    const byEdition = editions.map((edition, i) => ({
      edition,
      text: new Map(translations[i]!.map((t) => [t.aya, t.text])),
    }));
    const ayahs = allAyahs
      .filter((a) => a.aya >= ayaStart && a.aya <= ayaEnd)
      .map((a) => ({ aya: a.aya, text: a.text }));
    for (const a of ayahs) verses.push({ sura, aya: a.aya });
    sections.push({
      surah,
      ayahs,
      byEdition,
      showBismillah: ayaStart === 1 && surah.hasBismillah && surah.number !== 1,
    });
  }
  return { n, sections, verses, bismillah, editions };
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
  const { n, sections, verses, bismillah, editions } = data;

  return (
    <>
      <Link href="/juz" className="back-link">
        ← All juzʾ
      </Link>
      <header className="reader-head">
        <div className="name-en">Juzʾ {n}</div>
        <div className="sub">{verses.length} āyāt</div>
      </header>

      <ReadingModeToggle />

      <div className="mode-translation">
        <EditionManager
          editions={editions.map((e) => ({
            id: e.id,
            name: e.name,
            author: e.author,
            language: e.language,
            direction: e.direction,
          }))}
        />

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
                {section.byEdition.map(({ edition, text }) => {
                  const line = text.get(ayah.aya);
                  if (!line) return null;
                  const off = edition.id !== DEFAULT_EDITION ? " tr--off" : "";
                  return (
                    <p
                      key={edition.id}
                      className={`ayah-tr${off}`}
                      data-edition={edition.id}
                      lang={edition.language}
                      dir={edition.direction}
                    >
                      <span className="tr-name">{edition.name}</span>
                      {line}
                    </p>
                  );
                })}
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
      </div>

      <div className="mode-reading">
        {sections.map((section) => (
          <section key={section.surah.number}>
            <header className="juz-surah-head">
              <span className="name-ar arabic">{section.surah.name}</span>
              <span className="sub">
                {section.surah.transliteration} · {section.surah.englishName}
              </span>
            </header>
            {section.showBismillah && <p className="basmala arabic">{bismillah}</p>}
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

      <div className="mode-reading-tr">
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
              <div key={ayah.aya} className="read-ayah">
                <p className="read-ar arabic">
                  {ayah.text}
                  <span className="end-marker">﴿{toArabicDigits(ayah.aya)}﴾</span>
                </p>
                {section.byEdition.map(({ edition, text }) => {
                  const line = text.get(ayah.aya);
                  if (!line) return null;
                  const off = edition.id !== DEFAULT_EDITION ? " tr--off" : "";
                  return (
                    <p
                      key={edition.id}
                      className={`read-tr${off}`}
                      data-edition={edition.id}
                      lang={edition.language}
                      dir={edition.direction}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            ))}
          </section>
        ))}
      </div>

      <nav className="reader-nav">
        {n > 1 ? <Link href={`/juz/${n - 1}`}>← Previous juzʾ</Link> : <span />}
        {n < TOTAL_JUZ ? <Link href={`/juz/${n + 1}`}>Next juzʾ →</Link> : <span />}
      </nav>
      <p className="foot">Arabic: Tanzil (CC-BY 3.0) · Translations via Ummah Library datasets</p>
    </>
  );
}
