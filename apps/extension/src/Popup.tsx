import { useEffect, useMemo, useState } from "react";
import { formatHijri, gregorianToHijri, verseOfDay } from "@ummahlibrary/core";
import type { Surah, Translation } from "@ummahlibrary/core";
import { Logo, N } from "@ummahlibrary/ui";
import { fetchVerse, getEditions, getSurahs } from "./lib/api";
import type { VerseData } from "./lib/api";
import { DEFAULT_EDITION } from "./lib/config";
import { todayGregorian, todayISO } from "./lib/date";
import { homeUrl, openUrl, settingsUrl, surahUrl } from "./lib/links";
import { getPref, setPref } from "./lib/storage";
import { filterSurahs } from "./lib/surah-filter";

const PAD = 16;

export function Popup() {
  return (
    <main style={{ padding: PAD, display: "flex", flexDirection: "column", gap: 14 }}>
      <Header />
      <VerseOfDay />
      <SurahJump />
      <Footer />
    </main>
  );
}

function Header() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    void getPref<number>("hijriAdjust", 0).then((adjust) =>
      setLabel(formatHijri(gregorianToHijri(todayGregorian(), adjust))),
    );
  }, []);

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <a
        href={homeUrl()}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none" }}
        aria-label="Open Ummah Library"
      >
        <Logo scale={0.92} />
      </a>
      {label && (
        <span
          style={{
            fontSize: 11,
            color: N.gold,
            fontWeight: 600,
            fontFamily: N.ui,
            border: `1px solid ${N.border}`,
            borderRadius: 999,
            padding: "3px 9px",
            whiteSpace: "nowrap",
          }}
          title="Today's Hijri date"
        >
          {label}
        </span>
      )}
    </header>
  );
}

const LABEL_STYLE = {
  fontSize: 10.5,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: N.gold,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

function VerseOfDay() {
  const [edition, setEdition] = useState<string>(DEFAULT_EDITION);
  const [editions, setEditions] = useState<readonly Translation[]>([]);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    void getPref<string>("edition", DEFAULT_EDITION).then(setEdition);
    void getEditions().then(setEditions);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const ref = verseOfDay(todayISO());
    void fetchVerse(ref.sura, ref.aya, edition).then((v) => {
      if (cancelled) return;
      setVerse(v);
      setState(v ? "ready" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [edition]);

  function onEdition(next: string) {
    setEdition(next);
    void setPref("edition", next);
  }

  return (
    <section
      style={{
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={LABEL_STYLE}>Verse of the day</span>
        {editions.length > 0 && (
          <select
            aria-label="Translation"
            value={edition}
            onChange={(e) => onEdition(e.target.value)}
            style={{
              background: N.bg2,
              color: N.muted,
              border: `1px solid ${N.border}`,
              borderRadius: 8,
              fontSize: 11,
              padding: "2px 4px",
              maxWidth: 150,
            }}
          >
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {state === "loading" && (
        <>
          <div className="ul-skeleton" style={{ height: 26, width: "92%" }} />
          <div className="ul-skeleton" style={{ height: 16, width: "100%" }} />
          <div className="ul-skeleton" style={{ height: 16, width: "70%" }} />
        </>
      )}

      {state === "error" && (
        <p style={{ margin: 0, color: N.muted, fontSize: 13 }}>
          Couldn’t load today’s verse. Check your connection and reopen.
        </p>
      )}

      {state === "ready" && verse && (
        <a
          href={surahUrl(verse.sura, verse.aya)}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div
            dir="rtl"
            lang="ar"
            style={{ fontFamily: N.ar, fontSize: 22, lineHeight: 1.95, color: N.fg }}
          >
            {verse.arabic}
          </div>
          {verse.translation && (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: N.muted }}>{verse.translation}</div>
          )}
          <div style={{ fontSize: 12, color: N.gold, fontWeight: 600, fontFamily: N.ui }}>
            Sūra {verse.sura} : {verse.aya} →
          </div>
        </a>
      )}
    </section>
  );
}

function SurahJump() {
  const [surahs, setSurahs] = useState<readonly Surah[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void getSurahs().then(setSurahs);
  }, []);

  const results = useMemo(() => filterSurahs(surahs, query), [surahs, query]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={LABEL_STYLE}>Jump to a sūra</span>
      <input
        type="search"
        value={query}
        placeholder="Name or number — e.g. Yāsīn, 36"
        aria-label="Search for a sūra"
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) openUrl(surahUrl(results[0].number));
        }}
        style={{
          background: N.bg2,
          color: N.fg,
          border: `1px solid ${N.border}`,
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 13,
          outline: "none",
        }}
      />
      {results.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {results.map((s) => (
            <li key={s.number}>
              <a
                href={surahUrl(s.number)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "7px 8px",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: N.fg,
                }}
              >
                <span style={{ color: N.faint, fontSize: 12, width: 22, fontFamily: N.ui }}>
                  {s.number}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.transliteration}</span>
                <span style={{ color: N.muted, fontSize: 12 }}>{s.englishName}</span>
                <span dir="rtl" lang="ar" style={{ marginInlineStart: "auto", fontFamily: N.ar, color: N.muted }}>
                  {s.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Footer() {
  const link = { color: N.muted, fontSize: 12, textDecoration: "none", fontFamily: N.ui } as const;
  return (
    <footer
      style={{
        borderTop: `1px solid ${N.borderSoft}`,
        paddingTop: 10,
        display: "flex",
        gap: 16,
        justifyContent: "center",
      }}
    >
      <a href={homeUrl()} target="_blank" rel="noreferrer" style={link}>
        Open Ummah Library
      </a>
      <a href={settingsUrl()} target="_blank" rel="noreferrer" style={link}>
        Settings
      </a>
    </footer>
  );
}
