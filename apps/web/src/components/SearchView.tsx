"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type SearchEntry, type SearchResult, searchVerses } from "@ummahlibrary/core";

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

  return (
    <div className="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search the Quran — e.g. mercy, patience, الرحمن"
        value={query}
        onChange={(e) => run(e.target.value)}
        onBlur={() => remember(query)}
        autoFocus
        aria-label="Search the Quran"
      />

      {status === "loading" && <p className="hifz-muted">Building the search index…</p>}
      {status === "error" && (
        <p className="hifz-muted">Couldn’t load the search index. Check your connection.</p>
      )}

      {status === "ready" && query.trim() === "" && history.length > 0 && (
        <div className="search-history">
          <span className="shelf-label">Recent searches</span>
          <div className="shelf-chips">
            {history.map((h) => (
              <button key={h} type="button" className="chip" onClick={() => run(h)}>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "ready" && query.trim() !== "" && (
        <p className="search-count">
          {results.length === 0
            ? "No matches"
            : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}

      <ol className="search-results">
        {results.map((r) => (
          <li key={`${r.key}:${r.source}`} className="search-result">
            <Link href={`/surah/${r.sura}#${r.sura}:${r.aya}`} className="search-result-link">
              <span className="search-result-ref">
                {label(r.sura)} · {r.sura}:{r.aya}
                <span className={`search-tag search-tag--${r.source}`}>
                  {r.source === "ar" ? "Arabic" : "English"}
                </span>
              </span>
              <span className={r.source === "ar" ? "search-result-text arabic" : "search-result-text"}>
                {r.text}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
