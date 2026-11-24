"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReciterPlugin } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { ReadingAudio } from "./ReadingAudio";
import { AyahWords } from "./AyahWords";
import { TAP_HEAR_CLASS } from "../lib/tap-to-hear";
import { markKidsFinished, readKidsFinished } from "../lib/kids-store";
import { useIntl } from "../i18n/I18nProvider";

const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

/**
 * Kids reader (ADR 0041): very large Arabic, rendered by the same AyahWords
 * component as the main reader (same text, same font — only bigger), with
 * tap-a-word-to-hear switched on for this page. A calm "I finished" moment at
 * the end. No streaks, no notifications, no autoplay.
 */
export function KidsReader({
  surah,
  ayahs,
  reciters,
  bismillah,
}: {
  surah: { number: number; name: string; transliteration: string; englishName: string };
  ayahs: { aya: number; text: string }[];
  reciters: ReciterPlugin[];
  bismillah: string | null;
}) {
  const [finished, setFinished] = useState(false);
  const { t, tf, dir } = useIntl();

  useEffect(() => {
    setFinished(readKidsFinished().has(surah.number));
    // Tap any word to hear it — on for this page only, never persisted.
    document.body.classList.add(TAP_HEAR_CLASS);
    return () => document.body.classList.remove(TAP_HEAR_CLASS);
  }, [surah.number]);

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
        <Link href="/kids" className="reader-back" style={{ minWidth: 64, minHeight: 60 }}>
          <Icon name={dir === "rtl" ? "arrowR" : "arrowL"} size={22} />
          <span>{t("onb.back")}</span>
        </Link>
        <div style={{ flex: 1, minWidth: 0, fontFamily: N.ui }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{surah.transliteration}</h1>
          <div style={{ fontSize: 14, color: N.muted }}>{t("kids.tapWord")}</div>
        </div>
        <span className="noor-ar" lang="ar" dir="rtl" style={{ fontSize: 28, color: N.goldHi }}>
          {surah.name}
        </span>
      </div>

      <main id="main" className="noor-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div
          className="mode-translation"
          style={{
            maxWidth: 820,
            margin: "0 auto",
            padding: "24px clamp(16px, 4vw, 28px) 40px",
            display: "grid",
            gap: 10,
          }}
        >
          {bismillah && (
            <p
              className="basmala arabic"
              lang="ar"
              dir="rtl"
              style={{
                textAlign: "center",
                fontSize: "2.2rem",
                lineHeight: 2.2,
                margin: "0 0 8px",
              }}
            >
              {bismillah}
            </p>
          )}
          {ayahs.map((a) => (
            <div
              key={a.aya}
              id={`${surah.number}:${a.aya}`}
              className="ayah"
              style={{ padding: "8px 10px" }}
            >
              <p
                className="ayah-ar arabic"
                lang="ar"
                dir="rtl"
                style={{
                  fontSize: "calc(2.6rem * var(--reading-scale, 1))",
                  lineHeight: 2.3,
                  textAlign: "center",
                }}
              >
                <AyahWords surah={surah.number} aya={a.aya} text={a.text} />
                <button
                  type="button"
                  className="ayah-marker"
                  data-play-one={`${surah.number}:${a.aya}`}
                >
                  <span aria-hidden="true">﴿{toArabicDigits(a.aya)}﴾</span>
                  <span className="sr-only">{tf("kids.playAyah", { aya: a.aya })}</span>
                </button>
              </p>
            </div>
          ))}

          <div
            className="nf-card"
            style={{ justifyItems: "center", textAlign: "center", marginTop: 12 }}
          >
            {finished ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: N.ui,
                  fontSize: 20,
                  fontWeight: 800,
                  color: N.gold,
                }}
              >
                {tf("kids.youFinished", { surah: surah.transliteration })}
              </p>
            ) : (
              <button
                type="button"
                className="nf-btn nf-btn--gold"
                style={{ minHeight: 64, fontSize: 18, padding: "0 28px" }}
                onClick={() => {
                  markKidsFinished(surah.number);
                  setFinished(true);
                }}
              >
                <Icon name="check" size={22} /> {t("kids.iFinished")}
              </button>
            )}
            <Link href="/kids" className="nf-btn" style={{ minHeight: 60 }}>
              {t("kids.chooseAnother")}
            </Link>
          </div>
        </div>
      </main>

      <ReadingAudio
        verses={ayahs.map((a) => ({ sura: surah.number, aya: a.aya }))}
        reciters={reciters}
        variant="dock"
        positionLabel={t("kids.listenWhole")}
      />
    </div>
  );
}
