"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type SearchEntry, type SearchResult, searchVerses } from "@ummahlibrary/core";
import { N, Icon, Khatam } from "./noor";

const SUGGESTIONS = ["Mercy", "Patience", "Forgiveness", "Light", "Al-Mulk", "Ar-Raḥmān", "Yā Sīn"];

const ENGLISH_EDITION = "eng-mustafakhattaba";
const ENGLISH_URL = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${ENGLISH_EDITION}.min.json`;
const HISTORY_KEY = "ul.searchHistory";
const MAX_HISTORY = 8;

interface SurahRef {
  number: number;
  transliteration: string;
  englishName: string;
}

/** Load the Arabic corpus + English translation once and build a flat index. */
async function loadIndex(): Promise<SearchEntry[]> {
  const [arabic, english] = await Promise.all([
    fetch("/api/v1/search/corpus")
      .then((r) =>
        r.ok ? (r.json() as Promise<{ verses: { s: number; a: number; t: string }[] }>) : null,
      )
      .catch(() => null),
    fetch(ENGLISH_URL)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ quran: { chapter: number; verse: number; text: string }[] }>)
          : null,
      )
      .catch(() => null),
  ]);

  const entries: SearchEntry[] = [];
  for (const v of arabic?.verses ?? []) {
    entries.push({ key: `${v.s}:${v.a}`, sura: v.s, aya: v.a, text: v.t, source: "ar" });
  }
  for (const v of english?.quran ?? []) {
    entries.push({
      key: `${v.chapter}:${v.verse}`,
      sura: v.chapter,
      aya: v.verse,
      text: v.text,
      source: "en",
    });
  }
  return entries;
}

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function SearchView({ surahs }: { surahs: SurahRef[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [history, setHistory] = useState<string[]>([]);
  const indexRef = useRef<SearchEntry[] | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const names = useMemo(() => new Map(surahs.map((s) => [s.number, s])), [surahs]);

  useEffect(() => {
    setHistory(readHistory());
    setStatus("loading");
    loadIndex()
      .then((entries) => {
        indexRef.current = entries;
        setStatus(entries.length > 0 ? "ready" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  function run(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const index = indexRef.current;
      setResults(index ? searchVerses(index, q, 60) : []);
    }, 140);
  }

  function remember(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }

  const label = (n: number): string => {
    const s = names.get(n);
    return s ? `${s.transliteration} · ${s.englishName}` : `Surah ${n}`;
  };

  const chip = {
    background: N.card,
    border: `1px solid ${N.border}`,
    borderRadius: 999,
    padding: "10px 18px",
    color: N.fg,
    fontFamily: N.ui,
    fontSize: 14,
    cursor: "pointer",
  } as const;

  const showSuggest = status === "ready" && query.trim() === "";

  return (
    <div>
      {/* Search input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: N.card,
          border: `1px solid ${N.border}`,
          borderRadius: 16,
          padding: "0 18px",
          height: 56,
          marginBottom: 22,
        }}
      >
        <Icon name="search" size={22} color={N.muted} />
        <input
          type="search"
          placeholder="Try “Mulk”, “mercy”, or a surah number…"
          value={query}
          onChange={(e) => run(e.target.value)}
          onBlur={() => remember(query)}
          autoFocus
          aria-label="Search the Quran"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: N.fg,
            fontFamily: N.ui,
            fontSize: 17,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => run("")}
            aria-label="Clear search"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0, color: N.faint }}
          >
            <Icon name="close" size={18} color={N.faint} />
          </button>
        )}
      </div>

      {status === "loading" && (
        <p style={{ color: N.muted, fontFamily: N.ui }}>Building the search index…</p>
      )}
      {status === "error" && (
        <p style={{ color: N.muted, fontFamily: N.ui }}>
          Couldn’t load the search index. Check your connection.
        </p>
      )}

      {/* Suggestions / recent (empty query) */}
      {showSuggest && (
        <div>
          {history.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: N.faint, marginBottom: 12, fontFamily: N.ui }}>
                Recent searches
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                {history.map((h) => (
                  <button key={h} type="button" style={chip} onClick={() => run(h)}>
                    {h}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 13, color: N.faint, marginBottom: 12, fontFamily: N.ui }}>Suggested</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" style={chip} onClick={() => run(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {status === "ready" && query.trim() !== "" && (
        <>
          <p style={{ fontSize: 13, color: N.faint, marginBottom: 12, fontFamily: N.ui }}>
            {results.length === 0
              ? `No matches for “${query.trim()}”.`
              : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r) => (
              <Link
                key={`${r.key}:${r.source}`}
                href={`/surah/${r.sura}#${r.sura}:${r.aya}`}
                style={{
                  display: "block",
                  background: N.card,
                  border: `1px solid ${N.border}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      width: 28,
                      height: 28,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Khatam size={28} color={N.goldDim} sw={1.2} />
                    <span style={{ position: "absolute", fontSize: 10.5, fontWeight: 700, color: N.gold, fontFamily: N.ui }}>
                      {r.sura}
                    </span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: N.gold, fontFamily: N.ui }}>
                    {label(r.sura)} · {r.sura}:{r.aya}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: N.goldSoft,
                      color: N.gold,
                      fontWeight: 600,
                      fontFamily: N.ui,
                    }}
                  >
                    {r.source === "ar" ? "Arabic" : "English"}
                  </span>
                </div>
                {r.source === "ar" ? (
                  <div className="noor-ar" style={{ fontSize: 21, lineHeight: 1.9, color: N.fg, textAlign: "right" }}>
                    {r.text}
                  </div>
                ) : (
                  <div style={{ fontSize: 15, lineHeight: 1.65, color: N.muted, fontFamily: N.ui }}>{r.text}</div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
