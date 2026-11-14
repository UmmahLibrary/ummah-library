"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { N, Icon } from "@ummahlibrary/ui";
import { KIDS_EVENT, readKidsFinished } from "../lib/kids-store";
import { readComfort, writeComfort } from "../lib/comfort-store";
import { HoldButton } from "./HoldButton";
import { useIntl } from "../i18n/I18nProvider";

interface SurahLite {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
}

/**
 * Kids mode home (ADR 0041): short surahs as big tiles, a calm "finished"
 * tick, nothing else. No streaks, no notifications, no pop-ups. A grown-up
 * leaves Kids mode by pressing and holding (so a child doesn't by accident).
 */
export function KidsHome({ surahs }: { surahs: readonly SurahLite[] }) {
  const [finished, setFinished] = useState<Set<number>>(new Set());
  const [kidsMode, setKidsMode] = useState(false);
  const { t, tf, num } = useIntl();

  useEffect(() => {
    const refresh = () => setFinished(readKidsFinished());
    refresh();
    setKidsMode(readComfort().mode === "kids");
    window.addEventListener(KIDS_EVENT, refresh);
    return () => window.removeEventListener(KIDS_EVENT, refresh);
  }, []);

  return (
    <div
      className="noor-scroll"
      style={{ height: "100%", minHeight: "100dvh", overflowY: "auto", background: N.bg }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "24px clamp(16px, 4vw, 28px) 60px",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontFamily: N.ui, fontSize: 28, fontWeight: 800, color: N.fg }}>
            {t("kids.title")}
          </h1>
          {kidsMode ? (
            <HoldButton
              label={t("kids.holdToLeave")}
              onHold={() => {
                writeComfort({ mode: "standard" });
                window.location.href = "/";
              }}
            />
          ) : (
            <button
              type="button"
              className="nf-btn"
              onClick={() => {
                writeComfort({ mode: "kids" });
                setKidsMode(true);
              }}
            >
              {t("kids.turnOn")}
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontFamily: N.ui, fontSize: 17, color: N.muted }}>
          {t("kids.intro")}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: 14,
          }}
        >
          {surahs.map((s) => {
            const done = finished.has(s.number);
            return (
              <Link
                key={s.number}
                href={`/kids/${s.number}`}
                className="nf-tile"
                style={{ minHeight: 96, borderColor: done ? N.gold : undefined }}
              >
                <span className="ic" aria-hidden="true" style={{ fontWeight: 800, fontSize: 18 }}>
                  {done ? <Icon name="check" size={26} /> : num(s.number)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {s.transliteration}
                  <small>
                    {tf("reader.ayatCount", { n: s.ayahCount })}
                    {done ? ` · ${t("kids.finished")}` : ""}
                  </small>
                </span>
                <span
                  className="noor-ar"
                  lang="ar"
                  dir="rtl"
                  style={{ fontSize: 26, color: N.goldHi }}
                >
                  {s.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
