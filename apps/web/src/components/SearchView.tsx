"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchText } from "@ummahlibrary/core";
import { N, Icon, Khatam } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";

const ENGLISH_EDITION = "eng-mustafakhattaba";
const ENGLISH_URL = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${ENGLISH_EDITION}.min.json`;
const HISTORY_KEY = "ul.searchHistory";
const MAX_HISTORY = 6;

const TOPICS = ["mercy", "patience", "Mulk", "forgiveness", "knowledge", "Raḥmān", "guidance", "light"];

interface SurahRef {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
}

type ResultType = "ayah" | "surah" | "name" | "adhkar";

/** A unit in the unified index. `text` is the haystack core's searchText folds. */
interface SearchItem {
  type: ResultType;
  text: string;
  /** Primary line (English / transliteration). */
  title: string;
  ar?: string;
  /** Transliteration line (names, adhkār). */
  tr?: string;
  /** Secondary line. */
  sub?: string;
  /** Top-right reference label. */
  ref: string;
  href: string;
  /** For ayahs: whether the Arabic or the English line matched. */
  source?: "ar" | "en";
}

/** Per-type presentation: badge label, accent colour, icon. */
const TYPE_META: Record<ResultType, { label: string; color: string; icon: IconName }> = {
  ayah: { label: "Verse", color: "#E6B855", icon: "book" },
  surah: { label: "Surah", color: "#E6B855", icon: "book" },
  name: { label: "Name of Allah", color: "#4F90FF", icon: "star" },
  adhkar: { label: "Adhkār", color: "#B677EE", icon: "repeat" },
};

/** Filter pills — only those with results are shown. `ayah` also counts surahs. */
const FILTERS: { key: "all" | ResultType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ayah", label: "Quran" },
  { key: "name", label: "Names" },
  { key: "adhkar", label: "Adhkār" },
];

/** Empty-state "Search across" shortcuts. Hadith opens its page (its full text
 *  isn't indexed on the client — see ADR 0021). */
const SOURCES: { label: string; icon: IconName; href: string }[] = [
  { label: "Quran", icon: "book", href: "/" },
  { label: "Hadith", icon: "globe", href: "/hadith" },
  { label: "Adhkār", icon: "repeat", href: "/adhkar" },
  { label: "99 Names", icon: "star", href: "/names" },
];

interface NameDTO {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  description: string;
}
interface DhikrDTO {
  id: string;
  arabic: string;
  translation: string;
  transliteration: string;
  occasions: string[];
  reference?: string;
}

/** Build the unified index once: surahs (prop) + Quran ayahs (Arabic corpus +
 *  English translation) + the 99 Names + the adhkār. Resilient to any one
 *  source failing (e.g. the offline English CDN). */
async function buildIndex(surahs: SurahRef[]): Promise<SearchItem[]> {
  const labelFor = new Map(surahs.map((s) => [s.number, `${s.transliteration} · ${s.englishName}`]));
  const items: SearchItem[] = [];

  for (const s of surahs) {
    items.push({
      type: "surah",
      text: `${s.transliteration} ${s.englishName} surah ${s.number}`,
      title: s.transliteration,
      ar: s.name,
      sub: `${s.englishName} · ${s.ayahCount} ayahs`,
      ref: `Surah ${s.number}`,
      href: `/surah/${s.number}`,
    });
  }

  const [arabic, english, names, adhkar] = await Promise.all([
    fetch("/api/v1/search/corpus")
      .then((r) => (r.ok ? (r.json() as Promise<{ verses: { s: number; a: number; t: string }[] }>) : null))
      .catch(() => null),
    fetch(ENGLISH_URL)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ quran: { chapter: number; verse: number; text: string }[] }>) : null,
      )
      .catch(() => null),
    fetch("/api/v1/names")
      .then((r) => (r.ok ? (r.json() as Promise<{ names: NameDTO[] }>) : null))
      .catch(() => null),
    fetch("/api/v1/adhkar")
      .then((r) => (r.ok ? (r.json() as Promise<{ dhikr: DhikrDTO[] }>) : null))
      .catch(() => null),
  ]);

  for (const v of arabic?.verses ?? []) {
    items.push({
      type: "ayah",
      source: "ar",
      text: v.t,
      title: "",
      ar: v.t,
      ref: `${labelFor.get(v.s) ?? `Surah ${v.s}`} ${v.s}:${v.a}`,
      href: `/surah/${v.s}#${v.s}:${v.a}`,
    });
  }
  for (const v of english?.quran ?? []) {
    items.push({
      type: "ayah",
      source: "en",
      text: v.text,
      title: v.text,
      ref: `${labelFor.get(v.chapter) ?? `Surah ${v.chapter}`} ${v.chapter}:${v.verse}`,
      href: `/surah/${v.chapter}#${v.chapter}:${v.verse}`,
    });
  }
  for (const n of names?.names ?? []) {
    items.push({
      type: "name",
      text: `${n.transliteration} ${n.meaning} ${n.description}`,
      title: n.transliteration,
      ar: n.arabic,
      sub: n.meaning,
      ref: `Name ${n.number} of 99`,
      href: "/names",
    });
  }
  for (const d of adhkar?.dhikr ?? []) {
    const when = d.occasions.map((o) => o[0]?.toUpperCase() + o.slice(1)).join(" · ");
    items.push({
      type: "adhkar",
      text: `${d.translation} ${d.transliteration}`,
      title: d.translation,
      ar: d.arabic,
      tr: d.transliteration,
      sub: [when, d.reference].filter(Boolean).join(" · ") || "Adhkār",
      ref: when || "Adhkār",
      href: "/adhkar",
    });
  }

  return items;
}

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function highlight(text: string, q: string): React.ReactNode {
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark style={{ background: N.goldSoft, color: N.goldHi, borderRadius: 3, padding: "0 2px" }}>
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function SearchView({ surahs }: { surahs: SurahRef[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ResultType>("all");
  const [results, setResults] = useState<(SearchItem & { score: number })[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const indexRef = useRef<SearchItem[] | null>(null);
  const queryRef = useRef("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHistory(readHistory());
    void buildIndex(surahs).then((items) => {
      indexRef.current = items;
      setIndexReady(true);
      // If the user already typed before the index finished, search now.
      const pending = queryRef.current.trim();
      if (pending.length >= 2) setResults(searchText(items, pending, 60));
    });
  }, [surahs]);

  const q = query.trim();

  function run(value: string) {
    setQuery(value);
    queryRef.current = value;
    setFilter("all");
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const index = indexRef.current;
      setResults(index && value.trim().length >= 2 ? searchText(index, value, 60) : []);
    }, 140);
  }

  function remember(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }

  // Count by filter key (surahs fold into "ayah"/Quran).
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: results.length };
    for (const r of results) {
      const k = r.type === "surah" ? "ayah" : r.type;
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [results]);

  const filtered =
    filter === "all"
      ? results
      : results.filter((r) => r.type === filter || (filter === "ayah" && r.type === "surah"));

  const card = {
    background: N.card,
    border: `1px solid ${N.border}`,
    borderRadius: 16,
  } as const;
  const chip = {
    ...card,
    padding: "10px 17px",
    color: N.fg,
    fontFamily: N.ui,
    fontSize: 14,
    cursor: "pointer",
  } as const;
  const sectionLabel = {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: N.faint,
    fontWeight: 700,
    fontFamily: N.ui,
  };

  return (
    <div>
      {/* Search field */}
      <div
        style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", height: 56, marginBottom: 16 }}
      >
        <Icon name="search" size={22} color={N.muted} />
        <input
          type="search"
          placeholder="Search verses, names, adhkār…"
          value={query}
          onChange={(e) => run(e.target.value)}
          onBlur={() => remember(query)}
          autoFocus
          aria-label="Search"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 17 }}
        />
        {query && (
          <button
            type="button"
            onClick={() => run("")}
            aria-label="Clear search"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
          >
            <Icon name="close" size={18} color={N.faint} />
          </button>
        )}
      </div>

      {/* Type filters */}
      {q.length >= 2 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {FILTERS.map((f) => {
            const count = counts[f.key] ?? 0;
            if (f.key !== "all" && !count) return null;
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: `1px solid ${on ? N.gold : N.border}`,
                  background: on ? N.goldSoft : N.card,
                  color: on ? N.gold : N.muted,
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: N.ui,
                }}
              >
                {f.label} <span style={{ opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {q.length < 2 ? (
        /* ── Empty state (shown immediately; index loads in the background) ── */
        <div>
          {history.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={sectionLabel}>Recent</span>
                <button
                  type="button"
                  onClick={clearHistory}
                  style={{ background: "none", border: "none", color: N.faint, fontFamily: N.ui, fontSize: 12.5, cursor: "pointer" }}
                >
                  Clear
                </button>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => run(h)}
                    style={{ ...chip, display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <Icon name="repeat" size={14} color={N.faint} /> {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...sectionLabel, marginBottom: 12 }}>Try a topic</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 28 }}>
            {TOPICS.map((t) => (
              <button key={t} type="button" onClick={() => run(t)} style={chip}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ ...sectionLabel, marginBottom: 12 }}>Search across</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {SOURCES.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 10, textDecoration: "none" }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: N.goldSoft,
                    border: `1px solid ${N.gold}`,
                    display: "grid",
                    placeItems: "center",
                    color: N.gold,
                  }}
                >
                  <Icon name={s.icon} size={19} color={N.gold} />
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* ── Results ── */
        <div>
          <div style={{ fontSize: 13.5, color: N.muted, marginBottom: 14, fontFamily: N.ui }}>
            {!indexReady ? (
              "Searching…"
            ) : (
              <>
                <span style={{ color: N.fg, fontWeight: 700 }}>{filtered.length}</span> result
                {filtered.length !== 1 ? "s" : ""} for “<span style={{ color: N.gold }}>{q}</span>”
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {filtered.map((r, i) => {
              const m = TYPE_META[r.type];
              return (
                <Link
                  key={`${r.type}:${r.ref}:${r.source ?? ""}:${i}`}
                  href={r.href}
                  onClick={() => remember(q)}
                  style={{ ...card, padding: "16px 18px", textDecoration: "none", display: "block" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: m.color,
                        background: `color-mix(in srgb, ${m.color} 14%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${m.color} 40%, transparent)`,
                        borderRadius: 999,
                        padding: "3px 10px",
                        fontFamily: N.ui,
                      }}
                    >
                      <Icon name={m.icon} size={13} color={m.color} /> {m.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: N.gold, fontWeight: 600, flexShrink: 0, fontFamily: N.ui }}>
                      {r.ref}
                    </span>
                  </div>

                  {r.ar && (
                    <div
                      className="noor-ar"
                      style={{
                        fontSize: r.type === "name" ? 26 : 21,
                        lineHeight: 1.9,
                        textAlign: "right",
                        color: N.fg,
                        marginBottom: r.type === "name" ? 4 : 10,
                      }}
                    >
                      {r.ar}
                    </div>
                  )}
                  {r.title && (
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: r.type === "name" ? N.gold : N.muted,
                        fontWeight: r.type === "name" ? 700 : 400,
                        fontFamily: N.ui,
                      }}
                    >
                      {highlight(r.title, q)}
                    </div>
                  )}
                  {r.tr && (
                    <div style={{ fontSize: 13, fontStyle: "italic", color: N.faint, marginTop: 4, fontFamily: N.ui }}>
                      {r.tr}
                    </div>
                  )}
                  {r.sub && (
                    <div style={{ fontSize: 12.5, color: N.faint, marginTop: 6, fontFamily: N.ui }}>
                      {highlight(r.sub, q)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {indexReady && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 14, opacity: 0.5 }}>
                <Khatam size={54} color={N.goldDim} sw={1.2} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, fontFamily: N.ui }}>Nothing found</div>
              <div style={{ fontSize: 14, color: N.muted, fontFamily: N.ui }}>
                Try another word, or a topic like “mercy” or “patience”.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
