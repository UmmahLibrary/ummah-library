"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type ReciterPlugin } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "./noor";
import { AyahTranslations } from "./AyahTranslations";
import { AyahActions } from "./AyahActions";
import { ReadingAudio } from "./ReadingAudio";
import { ReadingTranslationPicker } from "./ReadingTranslationPicker";
import { ReadingTranslationFlow } from "./ReadingTranslationFlow";
import { ReaderToolbar } from "./ReaderToolbar";
import { WordByWord } from "./WordByWord";
import { HashHighlighter } from "./HashHighlighter";
import { ReaderShortcuts } from "./ReaderShortcuts";
import { ReadingTracker } from "./ReadingTracker";

type ReadingMode = "translation" | "reading" | "reading-tr";

const MODE_TO_SEG: Record<ReadingMode, string> = {
  translation: "verse",
  reading: "reading",
  "reading-tr": "mushaf",
};
const SEG_TO_MODE: Record<string, ReadingMode> = {
  verse: "translation",
  reading: "reading",
  mushaf: "reading-tr",
};

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

interface SurahData {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
  revelationPlace: "meccan" | "medinan";
  hasBismillah: boolean;
}

interface Ayah {
  aya: number;
  text: string;
}

interface Props {
  surah: SurahData;
  ayahs: Ayah[];
  bismillah: string;
  prevSurah: { number: number; transliteration: string } | null;
  nextSurah: { number: number; transliteration: string } | null;
  reciters: ReciterPlugin[];
  tafsirs: { id: string; name: string }[];
}

export function SurahReaderClient({
  surah,
  ayahs,
  bismillah,
  prevSurah,
  nextSurah,
  reciters,
  tafsirs,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<ReadingMode>("translation");

  // Restore persisted reading mode on mount
  useEffect(() => {
    const saved = document.documentElement.dataset.readingMode as ReadingMode | undefined;
    if (saved && SEG_TO_MODE[MODE_TO_SEG[saved] ?? ""] !== undefined) {
      setMode(saved);
    } else {
      try {
        const ls = localStorage.getItem("ul.readingMode") as ReadingMode | null;
        if (ls && ls in MODE_TO_SEG) {
          setMode(ls);
          document.documentElement.dataset.readingMode = ls;
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Sync mode to DOM (for CSS-based mode switching used by existing components)
  useEffect(() => {
    document.documentElement.dataset.readingMode = mode;
    try {
      localStorage.setItem("ul.readingMode", mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const chooseMode = (seg: string) => {
    const next = SEG_TO_MODE[seg];
    if (next) setMode(next);
  };

  const onScroll = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const max = box.scrollHeight - box.clientHeight;
    setProgress(max > 0 ? Math.min(1, box.scrollTop / max) : 0);
  }, []);

  const segValue = MODE_TO_SEG[mode] ?? "verse";
  const segOptions = [
    { value: "verse", label: "Verse" },
    { value: "reading", label: "Reading" },
    { value: "mushaf", label: "Mushaf" },
  ];

  // The continuous Arabic flow — shared by Reading (Arabic + translation) and
  // Mushaf (Arabic only).
  const arabicContinuous = (
    <>
      {surah.hasBismillah && surah.number !== 1 && (
        <p className="basmala arabic">{bismillah}</p>
      )}
      <p className="mushaf arabic">
        {ayahs.map((ayah) => (
          <span key={ayah.aya}>
            {ayah.text}
            <span className="end-marker">﴿{toArabicDigits(ayah.aya)}﴾</span>{" "}
          </span>
        ))}
      </p>
    </>
  );

  return (
    <>
      {/* Helpers that don't render UI */}
      <ReaderShortcuts storageKey={`surah:${surah.number}`} />
      <ReadingTracker />
      <HashHighlighter />

      {/* Scroll progress bar */}
      <div style={{ height: 3, background: N.borderSoft, flexShrink: 0 }}>
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: N.goldGrad,
            transition: "width .1s linear",
          }}
        />
      </div>

      {/* Reader bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 clamp(14px,4vw,40px)",
          height: 58,
          borderBottom: `1px solid ${N.borderSoft}`,
          background: N.bg2,
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Left: back + separator + surah info */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: N.muted,
              textDecoration: "none",
              fontFamily: N.ui,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <Icon name="arrowL" size={18} />
            <span className="noor-hide-sm">Library</span>
          </Link>
          <span style={{ color: N.border }} className="noor-hide-sm">|</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: N.ui,
                color: N.fg,
              }}
            >
              {surah.number} · {surah.transliteration}
            </div>
            <div
              className="noor-hide-sm"
              style={{ fontSize: 12, color: N.faint, whiteSpace: "nowrap", fontFamily: N.ui }}
            >
              {surah.englishName} · {surah.revelationPlace === "meccan" ? "Meccan" : "Medinan"} ·{" "}
              {surah.ayahCount} ayahs
            </div>
          </div>
        </div>

        {/* Right: reader controls (text size, reciter, translations, mode, bookmark) */}
        <div style={{ flexShrink: 0 }}>
          <ReaderToolbar
            surahNumber={surah.number}
            reciters={reciters}
            tafsirs={tafsirs}
            segValue={segValue}
            segOptions={segOptions}
            onSeg={chooseMode}
          />
        </div>
      </div>

      {/* Scrollable reading surface */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="noor-scroll"
        id="main"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}
      >
        <div
          style={{
            maxWidth: mode === "reading-tr" ? 760 : 720,
            margin: "0 auto",
            padding: "clamp(20px,4vw,36px) clamp(16px,4vw,28px) 60px",
          }}
        >
          {/* Surah header */}
          <div
            style={{
              textAlign: "center",
              paddingBottom: 22,
              borderBottom: `1px solid ${N.borderSoft}`,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "inline-grid",
                placeItems: "center",
                position: "relative",
                marginBottom: 10,
              }}
            >
              <Khatam size={96} color={N.goldDim} sw={1} opacity={0.55} />
              <span
                style={{
                  position: "absolute",
                  fontSize: 30,
                  color: N.goldHi,
                  fontFamily: N.ar,
                  direction: "rtl",
                }}
              >
                {surah.name}
              </span>
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 800,
                fontFamily: N.ui,
                color: N.fg,
                letterSpacing: -0.3,
              }}
            >
              {surah.transliteration}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: N.faint,
                marginTop: 4,
                letterSpacing: 0.6,
                fontFamily: N.ui,
                textTransform: "uppercase",
              }}
            >
              {surah.englishName} ·{" "}
              {surah.revelationPlace === "meccan" ? "Meccan" : "Medinan"} ·{" "}
              {surah.ayahCount} āyāt
            </div>
          </div>

          {/* Verse mode */}
          <div className="mode-translation">
            <WordByWord />

            {surah.hasBismillah && surah.number !== 1 && (
              <p
                className="basmala arabic"
                style={{ color: N.fg, textAlign: "center", margin: "1.75rem 0 2.25rem" }}
              >
                {bismillah}
              </p>
            )}

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
                  <AyahActions surah={surah.number} aya={ayah.aya} tafsirs={tafsirs} />
                </div>
              ))}
            </div>
          </div>

          {/* Reading mode: continuous Arabic + a continuous translation */}
          <div className="mode-reading">
            {arabicContinuous}
            <div
              style={{ height: 1, background: N.borderSoft, margin: "1.75rem 0 1.5rem" }}
              aria-hidden="true"
            />
            <ReadingTranslationPicker />
            <ReadingTranslationFlow surah={surah.number} ayat={ayahs.map((a) => a.aya)} />
          </div>

          {/* Mushaf mode: continuous Arabic only */}
          <div className="mode-reading-tr">{arabicContinuous}</div>

          {/* Prev/next surah pager */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 30,
              paddingTop: 22,
              borderTop: `1px solid ${N.borderSoft}`,
            }}
          >
            {prevSurah ? (
              <Link
                href={`/surah/${prevSurah.number}`}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1px solid ${N.border}`,
                  background: N.card,
                  color: N.fg,
                  textDecoration: "none",
                  fontFamily: N.ui,
                  transition: "border-color .15s",
                }}
              >
                <Icon name="chevL" size={18} color={N.muted} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: N.faint }}>Previous</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {prevSurah.transliteration}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            {nextSurah ? (
              <Link
                href={`/surah/${nextSurah.number}`}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1px solid ${N.border}`,
                  background: N.card,
                  color: N.fg,
                  textDecoration: "none",
                  fontFamily: N.ui,
                  transition: "border-color .15s",
                }}
              >
                <div style={{ minWidth: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: N.faint }}>Next</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {nextSurah.transliteration}
                  </div>
                </div>
                <Icon name="chevR" size={18} color={N.muted} />
              </Link>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </nav>

          <p className="foot">
            Arabic: Tanzil (CC-BY 3.0) · Translations via Ummah Library datasets
          </p>
        </div>
      </div>

      {/* Audio player — fixed bottom dock, drives playback for all modes */}
      <ReadingAudio
        verses={ayahs.map((a) => ({ sura: surah.number, aya: a.aya }))}
        reciters={reciters}
        variant="dock"
      />
    </>
  );
}
