"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type ReciterPlugin, pageNumberOf } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import { AyahTranslations } from "./AyahTranslations";
import { AyahTransliteration } from "./AyahTransliteration";
import { AyahWords } from "./AyahWords";
import { AyahActions } from "./AyahActions";
import { AyahStar } from "./AyahStar";
import { ReadingAudio } from "./ReadingAudio";
import { MemorizeBar } from "./MemorizeBar";
import { ReadingTranslationPicker } from "./ReadingTranslationPicker";
import { ReadingTranslationFlow } from "./ReadingTranslationFlow";
import { ReaderToolbar } from "./ReaderToolbar";
import { WordByWord } from "./WordByWord";
import { HashHighlighter } from "./HashHighlighter";
import { ReaderShortcuts } from "./ReaderShortcuts";
import { ReadingTracker } from "./ReadingTracker";
import { PlanReaderChip } from "./PlanReaderChip";
import { recordMushafPage } from "../lib/reading-goals";
import { writeReadingMode } from "../lib/reader-prefs";
import { writeLastRead } from "../lib/reader-prefs-store";

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

/** Group consecutive ayahs by their Madani-mushaf page. */
function pagesOf(sura: number, ayahs: Ayah[]): { page: number; ayahs: Ayah[] }[] {
  const groups: { page: number; ayahs: Ayah[] }[] = [];
  for (const ayah of ayahs) {
    const page = pageNumberOf({ sura, aya: ayah.aya });
    const last = groups[groups.length - 1];
    if (last && last.page === page) last.ayahs.push(ayah);
    else groups.push({ page, ayahs: [ayah] });
  }
  return groups;
}

/** A subtle Madani-page divider, shown where each mushaf page begins. */
function PageMarker({ n }: { n: number }) {
  return (
    <div
      data-page={n}
      aria-label={`Page ${n}`}
      style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", userSelect: "none" }}
    >
      <div style={{ flex: 1, height: 1, background: N.borderSoft }} />
      <span
        style={{
          fontSize: 11.5,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: N.ui,
          fontWeight: 700,
          color: N.faint,
        }}
      >
        Page {n}
      </span>
      <div style={{ flex: 1, height: 1, background: N.borderSoft }} />
    </div>
  );
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
  const pages = useMemo(() => pagesOf(surah.number, ayahs), [surah.number, ayahs]);
  // First āyah of each Madani page — the resume position for the continuous
  // Reading/Mushaf modes, which have no per-āyah anchors to measure.
  const pageFirstAya = useMemo(
    () => new Map(pages.map((p) => [p.page, p.ayahs[0]?.aya ?? 0])),
    [pages],
  );
  const lastPageRef = useRef(0);
  const currentAyaRef = useRef(0);
  const markTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True only while the *user* is driving the scroll. Programmatic scrolls — the
  // resume scroll, audio auto-follow, and the browser's scroll-anchoring when
  // translations load and shift the layout — must NOT move the current-āyah
  // marker, or it flickers between āyāt. Audio sets the marker directly instead.
  const userScrollingRef = useRef(false);
  const userIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark, persist, and remember the reader's current āyah. The marker (a soft
  // gold bar) shows where you are; the same āyah is saved as the resume point
  // and is where the dock ▶ starts playback from.
  const markCurrentAya = useCallback(
    (aya: number) => {
      if (aya <= 0 || aya === currentAyaRef.current) return;
      currentAyaRef.current = aya;
      document
        .querySelectorAll(".ayah--current")
        .forEach((el) => el.classList.remove("ayah--current"));
      document.getElementById(`${surah.number}:${aya}`)?.classList.add("ayah--current");
      writeLastRead(surah.number, aya, surah.ayahCount);
    },
    [surah.number, surah.ayahCount],
  );

  // Scroll-driven marking is debounced to the *settled* position, so the marker
  // doesn't race through āyāt during a programmatic resume scroll / re-centre.
  const scheduleMark = useCallback(
    (aya: number) => {
      if (markTimerRef.current) clearTimeout(markTimerRef.current);
      markTimerRef.current = setTimeout(() => markCurrentAya(aya), 140);
    },
    [markCurrentAya],
  );

  // Mark the resumed / deep-linked āyah immediately on open, so the marker lands
  // on the right āyah from the start (the scroll then settles onto it) rather
  // than appearing only after the page stops moving.
  useEffect(() => {
    const m = /^(\d+):(\d+)$/.exec(decodeURIComponent(window.location.hash.slice(1)));
    if (m && Number(m[1]) === surah.number) markCurrentAya(Number(m[2]));
    return () => {
      if (markTimerRef.current) clearTimeout(markTimerRef.current);
    };
  }, [surah.number, markCurrentAya]);

  // Track genuine user scrolling. A real input (wheel / touch / arrow keys)
  // opens a short window during which scroll events may move the marker; it
  // closes ~1s after the last input, so later programmatic scrolls don't.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const wake = () => {
      userScrollingRef.current = true;
      if (userIdleRef.current) clearTimeout(userIdleRef.current);
      userIdleRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 1000);
    };
    const keys = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) wake();
    };
    box.addEventListener("wheel", wake, { passive: true });
    box.addEventListener("touchstart", wake, { passive: true });
    box.addEventListener("touchmove", wake, { passive: true });
    window.addEventListener("keydown", keys);
    return () => {
      box.removeEventListener("wheel", wake);
      box.removeEventListener("touchstart", wake);
      box.removeEventListener("touchmove", wake);
      window.removeEventListener("keydown", keys);
      if (userIdleRef.current) clearTimeout(userIdleRef.current);
    };
  }, []);

  // Restore persisted reading mode on mount. The mode is restored pre-paint into
  // `data-reading-mode` by the layout bootstrap (the sole sync read, for FOUC).
  useEffect(() => {
    const saved = document.documentElement.dataset.readingMode as ReadingMode | undefined;
    if (saved && SEG_TO_MODE[MODE_TO_SEG[saved] ?? ""] !== undefined) {
      setMode(saved);
    }
  }, []);

  // Sync mode to the DOM (CSS-based switching) and persist it through the store.
  useEffect(() => {
    document.documentElement.dataset.readingMode = mode;
    void writeReadingMode(mode);
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
    // Record the furthest Madani page scrolled into view. Only the visible
    // mode's markers count — hidden modes' markers have a null offsetParent.
    const top = box.scrollTop + 80;
    let current = 0;
    box.querySelectorAll<HTMLElement>("[data-page]").forEach((m) => {
      if (m.offsetParent !== null && m.offsetTop <= top) current = Number(m.dataset.page);
    });
    if (current > 0 && current !== lastPageRef.current) {
      lastPageRef.current = current;
      void recordMushafPage(current);
    }
    // Resume position: the āyah straddling the vertical centre of the viewport.
    // Record the centre (not the top), because resuming re-centres the āyah
    // (HashHighlighter) — anchoring to the top made resume land several āyāt
    // earlier. Verse mode has precise per-āyah anchors; the continuous
    // Reading/Mushaf modes fall back to the current page's opening āyah.
    const readingLine = box.scrollTop + box.clientHeight / 2;
    let aya = 0;
    box.querySelectorAll<HTMLElement>(".ayah").forEach((el) => {
      if (el.offsetParent !== null && el.offsetTop <= readingLine) {
        const n = Number(el.id.split(":")[1]);
        if (n > aya) aya = n;
      }
    });
    if (aya === 0 && current > 0) aya = pageFirstAya.get(current) ?? 0;
    // Only a user-driven scroll moves the marker; programmatic scrolls don't.
    if (aya > 0 && userScrollingRef.current) scheduleMark(aya);
  }, [pageFirstAya, scheduleMark]);

  // Count the opening page so short sūrahs (no scroll) still register.
  useEffect(() => {
    const first = pageNumberOf({ sura: surah.number, aya: ayahs[0]?.aya ?? 1 });
    lastPageRef.current = first;
    void recordMushafPage(first);
  }, [surah.number, ayahs]);

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
      {pages.map((pg) => (
        <div key={pg.page}>
          <PageMarker n={pg.page} />
          <p className="mushaf arabic">
            {pg.ayahs.map((ayah) => (
              <span key={ayah.aya}>
                {ayah.text}
                <AyahStar n={ayah.aya} />{" "}
              </span>
            ))}
          </p>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Helpers that don't render UI */}
      <ReaderShortcuts storageKey={`surah:${surah.number}`} />
      <ReadingTracker />
      <HashHighlighter />
      <PlanReaderChip />

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
              {surah.number}<span className="noor-hide-sm"> · {surah.transliteration}</span>
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
              {pages.map((pg) => (
                <div key={pg.page}>
                  <PageMarker n={pg.page} />
                  {pg.ayahs.map((ayah) => (
                    <div key={ayah.aya} id={`${surah.number}:${ayah.aya}`} className="ayah">
                      <p className="ayah-ar arabic">
                        <AyahWords surah={surah.number} aya={ayah.aya} text={ayah.text} />
                        <button
                          type="button"
                          className="ayah-marker"
                          data-play-key={`${surah.number}:${ayah.aya}`}
                          aria-label={`Play from āyah ${ayah.aya}`}
                        >
                          ﴿{toArabicDigits(ayah.aya)}﴾
                        </button>
                      </p>
                      <AyahTransliteration surah={surah.number} aya={ayah.aya} />
                      <AyahTranslations surah={surah.number} aya={ayah.aya} />
                      <AyahActions surah={surah.number} aya={ayah.aya} tafsirs={tafsirs} />
                    </div>
                  ))}
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

          {/* Mushaf mode: a bordered page with continuous Arabic only */}
          <div className="mode-reading-tr">
            <div className="mushaf-page">
              {arabicContinuous}
              <div className="mushaf-surah-name" dir="rtl">
                ﴿ {surah.name} ﴾
              </div>
            </div>
          </div>

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

      {/* Memorize / hide-and-peek — floats above the dock */}
      <MemorizeBar />

      {/* Audio player — fixed bottom dock, drives playback for all modes */}
      <ReadingAudio
        verses={ayahs.map((a) => ({ sura: surah.number, aya: a.aya }))}
        reciters={reciters}
        variant="dock"
        // Listening advances the current/resume āyah too, not just scrolling.
        onAyah={(v) => markCurrentAya(v.aya)}
        // The dock ▶ starts from the āyah you're on, not the surah start.
        startVerse={() =>
          currentAyaRef.current > 0 ? { sura: surah.number, aya: currentAyaRef.current } : null
        }
      />
    </>
  );
}
