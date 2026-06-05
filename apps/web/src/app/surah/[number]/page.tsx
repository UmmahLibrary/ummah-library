import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { pluginRegistry, quranRepository, translationRepository } from "@ummahlibrary/api";
import { ReaderControls } from "../../../components/ReaderControls";
import { SurahAudio } from "../../../components/SurahAudio";
import { AyahTafsir } from "../../../components/AyahTafsir";
import { HifzButton } from "../../../components/HifzButton";
import { AyahActions } from "../../../components/AyahActions";
import { HashHighlighter } from "../../../components/HashHighlighter";

const RECITERS = pluginRegistry.byKind("reciter");
const TAFSIR = pluginRegistry.byKind("tafsir")[0] ?? null;

const DEFAULT_EDITION = "eng-khattab";

// Render all 114 surahs at build time — no data access at runtime.
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({ number: String(i + 1) }));
}

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

async function loadSurah(numberParam: string) {
  const number = Number(numberParam);
  if (!isValidSurahNumber(number)) return null;
  const [surah, ayahs, editions, bismillah] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    translationRepository.listTranslations(),
    quranRepository.getBismillah(),
  ]);
  if (!surah) return null;

  const translations = await Promise.all(
    editions.map((e) => translationRepository.getSurahTranslation(e.id, number)),
  );
  const byEdition = editions.map((edition, i) => ({
    edition,
    text: new Map(translations[i]!.map((t) => [t.aya, t.text])),
  }));

  return { number, surah, ayahs, editions, byEdition, bismillah };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const data = await loadSurah(number);
  if (!data) return { title: "Not found" };
  return { title: `${data.surah.transliteration} — ${data.surah.englishName}` };
}

export default async function SurahPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: numberParam } = await params;
  const data = await loadSurah(numberParam);
  if (!data) notFound();
  const { number, surah, ayahs, editions, byEdition, bismillah } = data;

  return (
    <>
      <HashHighlighter />
      <Link href="/" className="back-link">
        ← All surahs
      </Link>

      <header className="reader-head">
        <div className="name-ar arabic">{surah.name}</div>
        <div className="name-en">
          {surah.transliteration} · {surah.englishName}
        </div>
        <div className="sub">
          Surah {surah.number} · {surah.ayahCount} āyāt ·{" "}
          {surah.revelationPlace === "meccan" ? "Meccan" : "Medinan"}
        </div>
      </header>

      <ReaderControls
        surahNumber={surah.number}
        editions={editions.map((e) => ({ id: e.id, name: e.name, language: e.language }))}
      />

      <SurahAudio surah={surah.number} ayahCount={surah.ayahCount} reciters={RECITERS} />

      {/* Surah 1's Basmala is ayah 1 itself; others show it as a header. */}
      {surah.hasBismillah && surah.number !== 1 && <p className="basmala arabic">{bismillah}</p>}

      <div>
        {ayahs.map((ayah) => (
          <div key={ayah.aya} id={`${surah.number}:${ayah.aya}`} className="ayah">
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
                data-play-aya={ayah.aya}
                aria-label={`Play āyah ${ayah.aya}`}
              >
                ﴿{toArabicDigits(ayah.aya)}﴾
              </button>
            </p>
            {byEdition.map(({ edition, text }) => {
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
                data-play-single={ayah.aya}
                aria-label={`Play āyah ${ayah.aya}`}
              >
                ▶ Play
              </button>
              <HifzButton surah={surah.number} aya={ayah.aya} />
              <AyahActions surah={surah.number} aya={ayah.aya} />
            </div>
            {TAFSIR && (
              <AyahTafsir
                surah={surah.number}
                aya={ayah.aya}
                tafsirId={TAFSIR.id}
                tafsirName={TAFSIR.name}
              />
            )}
          </div>
        ))}
      </div>

      <nav className="reader-nav">
        {number > 1 ? <Link href={`/surah/${number - 1}`}>← Previous surah</Link> : <span />}
        {number < TOTAL_SURAHS ? <Link href={`/surah/${number + 1}`}>Next surah →</Link> : <span />}
      </nav>

      <p className="foot">Arabic: Tanzil (CC-BY 3.0) · Translations via Ummah Library datasets</p>
    </>
  );
}
