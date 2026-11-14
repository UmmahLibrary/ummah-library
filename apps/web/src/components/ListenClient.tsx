"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ReciterPlugin, juzNumberOf } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { ReadingAudio } from "./ReadingAudio";
import { AyahWords } from "./AyahWords";
import { AyahTranslations } from "./AyahTranslations";
import { markActivity } from "../lib/reading-goals";

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

interface Props {
  surah: {
    number: number;
    name: string;
    transliteration: string;
    englishName: string;
    ayahCount: number;
  };
  ayahs: { aya: number; text: string }[];
  reciters: ReciterPlugin[];
  prev: { number: number; transliteration: string } | null;
  next: { number: number; transliteration: string } | null;
}

/**
 * Listen mode (ADR 0041): the player is the screen, for people who mostly
 * listen. The current āyah is shown large with its translation; the recitation
 * drives word highlighting through the shared audio engine (every āyah block
 * keeps its `id="sura:aya"` and `.w` word spans), and the list follows along.
 * The Quran text is rendered by the same AyahWords component as the reader —
 * no re-shaping, only a larger font size.
 */
export function ListenClient({ surah, ayahs, reciters, prev, next }: Props) {
  const [current, setCurrent] = useState(1);
  const startRef = useRef(1);

  // Start from the āyah in the hash (#61), e.g. "Listen instead" on Home.
  useEffect(() => {
    const n = Number(decodeURIComponent(window.location.hash.slice(1)));
    if (Number.isInteger(n) && n >= 1 && n <= surah.ayahCount) {
      startRef.current = n;
      setCurrent(n);
    }
  }, [surah.number, surah.ayahCount]);

  const onAyah = useCallback((v: { sura: number; aya: number }) => {
    startRef.current = v.aya;
    setCurrent(v.aya);
    history.replaceState(null, "", `#${v.aya}`);
    void markActivity(); // listening counts toward "days this week"
  }, []);

  const verse = ayahs.find((a) => a.aya === current) ?? ayahs[0]!;
  const step = (d: number) => Math.min(surah.ayahCount, Math.max(1, current + d));

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: N.bg,
        color: N.fg,
      }}
    >
      <div className="reader-bar">
        <Link href={`/surah/${surah.number}#${surah.number}:${current}`} className="reader-back">
          <Icon name="book" size={20} />
          <span>Read</span>
        </Link>
        <div style={{ flex: 1, minWidth: 0, fontFamily: N.ui }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Listen · {surah.transliteration}
          </div>
          <div style={{ fontSize: 13.5, color: N.muted }}>
            Āyah {current} of {surah.ayahCount} · Juz{" "}
            {juzNumberOf({ sura: surah.number, aya: current })}
          </div>
        </div>
        <Link href="/" className="reader-back">
          <Icon name="home" size={20} />
          <span>Today</span>
        </Link>
      </div>

      <div className="noor-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "20px clamp(16px, 4vw, 28px) 40px",
            display: "grid",
            gap: 18,
          }}
        >
          {/* The current āyah, large */}
          <section
            className="nf-card"
            aria-live="polite"
            aria-label={`${surah.transliteration}, āyah ${current}`}
            style={{
              gap: 14,
              position: "sticky",
              top: 0,
              zIndex: 2,
              maxHeight: "62dvh",
              overflowY: "auto",
              boxShadow: "0 10px 24px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontFamily: N.ui, fontSize: 15, fontWeight: 700, color: N.gold }}>
                Āyah {current}
              </span>
              <span
                className="noor-ar"
                lang="ar"
                dir="rtl"
                style={{ fontSize: 22, color: N.goldHi }}
              >
                {surah.name}
              </span>
            </div>
            <p
              className="ayah-ar arabic"
              lang="ar"
              dir="rtl"
              data-quran-text
              style={{
                margin: 0,
                fontSize: "calc(2.3rem * var(--reading-scale, 1))",
                textAlign: "center",
              }}
            >
              <AyahWords surah={surah.number} aya={verse.aya} text={verse.text} />
            </p>
            <AyahTranslations surah={surah.number} aya={verse.aya} />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="nf-btn"
                data-play-key={`${surah.number}:${step(-1)}`}
                disabled={current <= 1}
                style={{ minWidth: 120 }}
              >
                ⏮ Previous
              </button>
              <button
                type="button"
                className="nf-btn nf-btn--gold"
                data-play-one={`${surah.number}:${current}`}
                style={{ minWidth: 150 }}
              >
                <Icon name="repeat" size={18} /> Play this āyah
              </button>
              <button
                type="button"
                className="nf-btn"
                data-play-key={`${surah.number}:${step(1)}`}
                disabled={current >= surah.ayahCount}
                style={{ minWidth: 120 }}
              >
                Next ⏭
              </button>
            </div>
          </section>

          {/* Follow-along list: the audio engine highlights words here */}
          <div className="mode-translation" style={{ display: "grid", gap: 6 }}>
            {ayahs.map((a) => (
              <div
                key={a.aya}
                id={`${surah.number}:${a.aya}`}
                className={`ayah${a.aya === current ? " ayah--current" : ""}`}
                data-play-key={`${surah.number}:${a.aya}`}
                style={{ cursor: "pointer" }}
              >
                <p
                  className="ayah-ar arabic"
                  lang="ar"
                  dir="rtl"
                  style={{ fontSize: "calc(1.6rem * var(--reading-scale, 1))" }}
                >
                  <AyahWords surah={surah.number} aya={a.aya} text={a.text} />
                  <span className="ayah-marker" aria-hidden="true">
                    ﴿{toArabicDigits(a.aya)}﴾
                  </span>
                </p>
              </div>
            ))}
          </div>

          <nav
            style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
          >
            {prev ? (
              <Link href={`/listen/${prev.number}`} className="nf-btn">
                ← {prev.transliteration}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/listen/${next.number}`} className="nf-btn">
                {next.transliteration} →
              </Link>
            )}
          </nav>
        </div>
      </div>

      <ReadingAudio
        verses={ayahs.map((a) => ({ sura: surah.number, aya: a.aya }))}
        reciters={reciters}
        variant="dock"
        onAyah={onAyah}
        startVerse={() => ({ sura: surah.number, aya: startRef.current })}
        positionLabel={`Āyah ${current} of ${surah.ayahCount} · tap any āyah to play from it`}
      />
    </div>
  );
}
