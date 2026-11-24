"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, N } from "@ummahlibrary/ui";
import { TAFSIR_KEY, readTafsir } from "../lib/tafsir";

interface TafsirMeta {
  id: string;
  name: string;
}
interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
}
interface SurahResponse {
  ayahs: { aya: number; text: string }[];
}
export interface TafsirSurah {
  number: number;
  transliteration: string;
  ayahCount: number;
}

// Arabic/Urdu/Persian tafsir reads right-to-left (same rule as TafsirCompare).
const isRtl = (id: string) => /^(ar|ur|fa|ps|ckb)-/.test(id);

const selectStyle = {
  background: N.card,
  color: N.fg,
  border: `1px solid ${N.border}`,
  borderRadius: 10,
  minHeight: 44,
  padding: "8px 12px",
  fontSize: 14,
  fontFamily: N.ui,
} as const;

const stepBtn = {
  ...selectStyle,
  cursor: "pointer",
  minWidth: 44,
  fontWeight: 600,
} as const;

/**
 * Read any āyah's commentary in the selected edition (shared via the
 * TafsirPicker): pick a surah and āyah, or step through with Previous/Next — the
 * same reach as the mobile Tafsir screen. Starts at Al-Fātiḥah 1.
 */
export function TafsirSample({
  tafsirs,
  surahs,
}: {
  tafsirs: TafsirMeta[];
  surahs: TafsirSurah[];
}) {
  const [tafsirId, setTafsirId] = useState(tafsirs[0]?.id ?? "");
  const [surah, setSurah] = useState(1);
  const [aya, setAya] = useState(1);
  const [arabic, setArabic] = useState<Record<number, string>>({});
  const [entries, setEntries] = useState<Record<number, string> | null>(null);
  const [failed, setFailed] = useState(false);
  const ayahCount = surahs.find((s) => s.number === surah)?.ayahCount ?? 1;
  const surahName = surahs.find((s) => s.number === surah)?.transliteration ?? `Surah ${surah}`;

  useEffect(() => {
    void readTafsir(tafsirs[0]?.id ?? "").then(setTafsirId);
    const onChange = (e: Event) => setTafsirId((e as CustomEvent<string>).detail);
    window.addEventListener(TAFSIR_KEY, onChange as EventListener);
    return () => window.removeEventListener(TAFSIR_KEY, onChange as EventListener);
  }, [tafsirs]);

  // The surah's Arabic, once per surah.
  useEffect(() => {
    let active = true;
    setArabic({});
    fetch(`/api/v1/surahs/${surah}`)
      .then((r) => (r.ok ? (r.json() as Promise<SurahResponse>) : { ayahs: [] }))
      .then((data) => {
        if (active) setArabic(Object.fromEntries(data.ayahs.map((a) => [a.aya, a.text])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [surah]);

  // The edition's commentary for the whole surah, once per (surah, edition).
  useEffect(() => {
    if (!tafsirId) return;
    let active = true;
    setEntries(null);
    setFailed(false);
    fetch(`/api/v1/surahs/${surah}/tafsirs/${tafsirId}`)
      .then((r) => (r.ok ? (r.json() as Promise<TafsirResponse>) : { entries: [] }))
      .then((data) => {
        if (active) setEntries(Object.fromEntries(data.entries.map((e) => [e.aya, e.text])));
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [surah, tafsirId]);

  const sourceName = tafsirs.find((t) => t.id === tafsirId)?.name ?? "Tafsir";
  const text = entries?.[aya] ?? "";
  const state: "loading" | "ready" | "empty" | "failed" = failed
    ? "failed"
    : entries === null
      ? "loading"
      : text
        ? "ready"
        : "empty";

  const go = (nextSurah: number, nextAya: number) => {
    setSurah(nextSurah);
    setAya(nextAya);
  };
  const prev = () => {
    if (aya > 1) go(surah, aya - 1);
    else if (surah > 1) go(surah - 1, surahs.find((s) => s.number === surah - 1)?.ayahCount ?? 1);
  };
  const next = () => {
    if (aya < ayahCount) go(surah, aya + 1);
    else if (surah < 114) go(surah + 1, 1);
  };

  return (
    <>
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}
      >
        <select
          aria-label="Surah"
          value={surah}
          onChange={(e) => go(Number(e.target.value), 1)}
          style={{ ...selectStyle, flex: "1 1 200px" }}
        >
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.transliteration}
            </option>
          ))}
        </select>
        <select
          aria-label="Āyah"
          value={aya}
          onChange={(e) => setAya(Number(e.target.value))}
          style={selectStyle}
        >
          {Array.from({ length: ayahCount }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Āyah {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={prev}
          disabled={surah === 1 && aya === 1}
          aria-label="Previous āyah"
          style={stepBtn}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          disabled={surah === 114 && aya === ayahCount}
          aria-label="Next āyah"
          style={stepBtn}
        >
          ›
        </button>
      </div>
      <div
        style={{
          borderRadius: 18,
          padding: "30px clamp(20px, 4vw, 36px)",
          background: N.card,
          border: `1px solid ${N.border}`,
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 11.5,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: N.faint,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 18,
          }}
        >
          {surahName} · Āyah {aya}
        </div>
        <div
          className="noor-quran"
          style={{
            textAlign: "center",
            fontSize: "clamp(26px, 5vw, 34px)",
            lineHeight: 1.9,
            color: N.goldHi,
            marginBottom: 14,
          }}
        >
          <span dir="rtl" lang="ar">
            {arabic[aya] ?? ""}
          </span>
        </div>
        <div style={{ height: 1, background: N.borderSoft, margin: "22px 0" }} />
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: N.gold,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 12,
          }}
        >
          Tafsīr · {sourceName}
        </div>
        <div
          aria-live="polite"
          dir={state === "ready" && isRtl(tafsirId) ? "rtl" : undefined}
          lang={state === "ready" ? tafsirId.split("-")[0] : undefined}
          style={{
            fontSize: 15.5,
            lineHeight: 1.75,
            color: state === "ready" ? N.fg : N.faint,
            fontFamily: N.ui,
            whiteSpace: "pre-line",
          }}
        >
          {state === "loading"
            ? "Loading commentary…"
            : state === "failed"
              ? `Couldn’t load ${sourceName} right now.`
              : state === "empty"
                ? "No commentary for this āyah in this edition — it may be explained together with a neighbouring āyah."
                : text}
        </div>
      </div>
      <Link
        href={`/surah/${surah}#${surah}:${aya}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 14,
          padding: 16,
          background: N.card,
          border: `1px solid ${N.border}`,
          color: N.gold,
          fontSize: 14.5,
          fontWeight: 600,
          fontFamily: N.ui,
          textDecoration: "none",
        }}
      >
        Read {surahName} {surah}:{aya} in the reader <Icon name="arrowR" size={16} color={N.gold} />
      </Link>
    </>
  );
}
