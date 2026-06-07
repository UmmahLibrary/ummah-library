import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { pluginRegistry, quranRepository } from "@ummahlibrary/api";
import { ReaderControls } from "../../../components/ReaderControls";
import { ReadingAudio } from "../../../components/ReadingAudio";
import { AyahTafsir } from "../../../components/AyahTafsir";
import { TafsirPicker } from "../../../components/TafsirPicker";
import { AyahTranslations } from "../../../components/AyahTranslations";
import { ReadingTranslationFlow } from "../../../components/ReadingTranslationFlow";
import { HifzButton } from "../../../components/HifzButton";
import { AyahActions } from "../../../components/AyahActions";
import { HashHighlighter } from "../../../components/HashHighlighter";
import { ReaderShortcuts } from "../../../components/ReaderShortcuts";
import { ReadingTracker } from "../../../components/ReadingTracker";
import { WordByWord } from "../../../components/WordByWord";
import { ReadingModeToggle } from "../../../components/ReadingModeToggle";
import { ReadingTranslationPicker } from "../../../components/ReadingTranslationPicker";

const RECITERS = pluginRegistry.byKind("reciter");
const TAFSIRS = pluginRegistry.byKind("tafsir").map((t) => ({ id: t.id, name: t.name }));

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
  const [surah, ayahs, bismillah] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    quranRepository.getBismillah(),
  ]);
  if (!surah) return null;
  // Translations are fetched client-side from the runtime catalogue (ADR 0011).
  return { number, surah, ayahs, bismillah };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const data = await loadSurah(number);
  if (!data) return { title: "Not found" };
  const { surah } = data;
  const place = surah.revelationPlace === "meccan" ? "Mecca" : "Medina";
  const title = `${surah.transliteration} — ${surah.englishName}`;
  const description =
    `Read Surah ${surah.transliteration} (${surah.englishName}), chapter ${surah.number} of ` +
    `the Quran — ${surah.ayahCount} āyāt, revealed in ${place}. Uthmani Arabic with ` +
    `translations, tafsir and recitation on Ummah Library.`;
  const url = `/surah/${surah.number}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SurahPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: numberParam } = await params;
  const data = await loadSurah(numberParam);
  if (!data) notFound();
  const { number, surah, ayahs, bismillah } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `Surah ${surah.transliteration} — ${surah.englishName}`,
    alternateName: surah.name,
    inLanguage: "ar",
    position: surah.number,
    isPartOf: { "@type": "Book", name: "The Holy Quran" },
    url: `https://app.ummahlibrary.org/surah/${surah.number}`,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReaderShortcuts storageKey={`surah:${surah.number}`} />
      <ReadingTracker />
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

      <ReadingModeToggle />

      <div className="mode-translation">
        <ReaderControls surahNumber={surah.number} />

        <ReadingAudio
          verses={ayahs.map((a) => ({ sura: surah.number, aya: a.aya }))}
          reciters={RECITERS}
        />

        <WordByWord />

        {TAFSIRS.length > 1 && <TafsirPicker tafsirs={TAFSIRS} />}

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
                  data-play-key={`${surah.number}:${ayah.aya}`}
                  aria-label={`Play from āyah ${ayah.aya}`}
                >
                  ﴿{toArabicDigits(ayah.aya)}﴾
                </button>
              </p>
              <AyahTranslations surah={surah.number} aya={ayah.aya} />
              <div className="ayah-actions">
                <button
                  type="button"
                  className="hifz-btn"
                  data-play-one={`${surah.number}:${ayah.aya}`}
                  aria-label={`Play āyah ${ayah.aya}`}
                >
                  ▶ Play
                </button>
                <HifzButton surah={surah.number} aya={ayah.aya} />
                <AyahActions surah={surah.number} aya={ayah.aya} />
              </div>
              {TAFSIRS.length > 0 && (
                <AyahTafsir surah={surah.number} aya={ayah.aya} tafsirs={TAFSIRS} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mode-reading">
        {surah.hasBismillah && surah.number !== 1 && <p className="basmala arabic">{bismillah}</p>}
        <p className="mushaf arabic">
          {ayahs.map((ayah) => (
            <span key={ayah.aya}>
              {ayah.text}
              <span className="end-marker">﴿{toArabicDigits(ayah.aya)}﴾</span>{" "}
            </span>
          ))}
        </p>
      </div>

      {/* Reading → Translations: a single chosen translation in a continuous,
          chrome-free flow (no per-āyah Arabic), matching Quran.com. */}
      <div className="mode-reading-tr">
        <ReadingTranslationPicker />
        {surah.hasBismillah && surah.number !== 1 && <p className="basmala arabic">{bismillah}</p>}
        <ReadingTranslationFlow surah={surah.number} ayat={ayahs.map((a) => a.aya)} />
      </div>

      <nav className="reader-nav">
        {number > 1 ? <Link href={`/surah/${number - 1}`}>← Previous surah</Link> : <span />}
        {number < TOTAL_SURAHS ? <Link href={`/surah/${number + 1}`}>Next surah →</Link> : <span />}
      </nav>

      <p className="foot">Arabic: Tanzil (CC-BY 3.0) · Translations via Ummah Library datasets</p>
    </>
  );
}
