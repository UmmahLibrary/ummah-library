import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOTAL_SURAHS, isValidSurahNumber } from "@ummahlibrary/core";
import { quranRepository, translationRepository } from "@ummahlibrary/api";

const TRANSLATION_ID = "eng-khattab";

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
  const [surah, ayahs, translation, bismillah] = await Promise.all([
    quranRepository.getSurah(number),
    quranRepository.getSurahAyahs(number),
    translationRepository.getSurahTranslation(TRANSLATION_ID, number),
    quranRepository.getBismillah(),
  ]);
  if (!surah) return null;
  const tr = new Map(translation.map((t) => [t.aya, t.text]));
  return { number, surah, ayahs, tr, bismillah };
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
  const { number, surah, ayahs, tr, bismillah } = data;

  return (
    <>
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

      {/* Surah 1's Basmala is ayah 1 itself; others show it as a header. */}
      {surah.hasBismillah && surah.number !== 1 && <p className="basmala arabic">{bismillah}</p>}

      <div>
        {ayahs.map((ayah) => (
          <div key={ayah.aya} className="ayah">
            <p className="ayah-ar arabic">
              {ayah.text}
              <span className="ayah-marker">﴿{toArabicDigits(ayah.aya)}﴾</span>
            </p>
            {tr.get(ayah.aya) && (
              <p className="ayah-tr">
                <span className="n">{ayah.aya}</span>
                {tr.get(ayah.aya)}
              </p>
            )}
          </div>
        ))}
      </div>

      <nav className="reader-nav">
        {number > 1 ? <Link href={`/surah/${number - 1}`}>← Previous surah</Link> : <span />}
        {number < TOTAL_SURAHS ? <Link href={`/surah/${number + 1}`}>Next surah →</Link> : <span />}
      </nav>

      <p className="foot">
        Arabic: Tanzil (CC-BY 3.0) · Translation: The Clear Quran, Mustafa Khattab
      </p>
    </>
  );
}
