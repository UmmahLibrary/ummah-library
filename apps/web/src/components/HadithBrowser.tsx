"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HADITH_GRADE_LABEL,
  type Hadith,
  type HadithCollection,
  type HadithGrade,
  hadithGradeCategory,
  searchText,
} from "@ummahlibrary/core";
import { N, Icon, Khatam } from "@ummahlibrary/ui";

interface Collection {
  id: string;
  name: string;
}

/** Display metadata (names with diacritics, author, count, short label, order). */
const META: Record<string, { name: string; short: string; by: string; count: string; order: number }> = {
  "eng-bukhari": { name: "Ṣaḥīḥ al-Bukhārī", short: "Bukhārī", by: "Imam al-Bukhārī", count: "7,563", order: 0 },
  "eng-muslim": { name: "Ṣaḥīḥ Muslim", short: "Muslim", by: "Imam Muslim", count: "7,500", order: 1 },
  "eng-abudawud": { name: "Sunan Abī Dāwūd", short: "Abū Dāwūd", by: "Abū Dāwūd", count: "5,274", order: 2 },
  "eng-tirmidhi": { name: "Jāmiʿ at-Tirmidhī", short: "Tirmidhī", by: "At-Tirmidhī", count: "3,956", order: 3 },
  "eng-nasai": { name: "Sunan an-Nasāʾī", short: "Nasāʾī", by: "An-Nasāʾī", count: "5,761", order: 4 },
  "eng-ibnmajah": { name: "Sunan Ibn Mājah", short: "Ibn Mājah", by: "Ibn Mājah", count: "4,341", order: 5 },
};
const ORDER = (id: string): number => META[id]?.order ?? 99;
const shortName = (id: string): string => META[id]?.short ?? id;

const GRADE_COLOR: Record<HadithGrade, string> = {
  sahih: "#5BBF8A",
  hasan: "#E6B855",
  daif: "#C98A57",
  unknown: "#8A93A6",
};
const GRADE_FILTERS: { key: "all" | HadithGrade; label: string }[] = [
  { key: "all", label: "All grades" },
  { key: "sahih", label: "Ṣaḥīḥ" },
  { key: "hasan", label: "Ḥasan" },
  { key: "daif", label: "Ḍaʿīf" },
];

const PAGE = 30;

const card = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;

function highlight(text: string, q: string): React.ReactNode {
  const at = q.length >= 2 ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return text;
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

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function HadithBrowser({ collections }: { collections: Collection[] }) {
  const [query, setQuery] = useState("");
  const [book, setBook] = useState<"all" | string>("all");
  const [grade, setGrade] = useState<"all" | HadithGrade>("all");
  const [loaded, setLoaded] = useState<Record<string, HadithCollection>>({});
  const [visible, setVisible] = useState(PAGE);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debounced, setDebounced] = useState("");

  // Background-prefetch every collection so global search fills in; each static
  // file is cached, so this is a one-time per-device cost (ADR 0022).
  useEffect(() => {
    let cancelled = false;
    for (const c of collections) {
      fetch(`/api/v1/hadith/${c.id}`)
        .then((r) => (r.ok ? (r.json() as Promise<HadithCollection>) : null))
        .then((col) => {
          if (!cancelled && col) setLoaded((prev) => ({ ...prev, [c.id]: col }));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [collections]);

  function run(value: string) {
    setQuery(value);
    setVisible(PAGE);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setDebounced(value.trim()), 160);
  }

  const allLoaded = Object.keys(loaded).length >= collections.length;
  const q = debounced;

  // Flatten the loaded collections once; filter by book + grade; rank by query.
  const results = useMemo(() => {
    const pool: Hadith[] = [];
    for (const id of Object.keys(loaded)) {
      if (book !== "all" && id !== book) continue;
      pool.push(...loaded[id]!.hadiths);
    }
    const filtered =
      grade === "all" ? pool : pool.filter((h) => hadithGradeCategory(h.collectionId, h.grades) === grade);
    return q.length >= 2 ? searchText(filtered, q, 300) : filtered;
  }, [loaded, book, grade, q]);

  const sectionName = (h: Hadith): string =>
    loaded[h.collectionId]?.sections[String(h.reference.book)] ?? "";

  const active = q.length >= 2 || book !== "all" || grade !== "all";
  const ordered = [...collections].sort((a, b) => ORDER(a.id) - ORDER(b.id));

  const clearAll = () => {
    run("");
    setDebounced("");
    setBook("all");
    setGrade("all");
  };

  return (
    <div>
      {/* Search field */}
      <div
        style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", height: 56, marginBottom: 14 }}
      >
        <Icon name="search" size={22} color={N.muted} />
        <input
          type="search"
          value={query}
          onChange={(e) => run(e.target.value)}
          placeholder="Search hadith — a word, phrase, narrator, or reference…"
          aria-label="Search hadith"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 16 }}
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

      {/* BOOK + GRADE filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: N.faint, fontWeight: 700, marginRight: 2, fontFamily: N.ui }}>BOOK</span>
        <Chip on={book === "all"} onClick={() => setBook("all")}>
          All
        </Chip>
        {ordered.map((c) => (
          <Chip key={c.id} on={book === c.id} onClick={() => setBook(book === c.id ? "all" : c.id)}>
            {shortName(c.id)}
          </Chip>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: N.faint, fontWeight: 700, marginRight: 2, fontFamily: N.ui }}>GRADE</span>
        {GRADE_FILTERS.map((g) => (
          <Chip key={g.key} on={grade === g.key} onClick={() => setGrade(g.key)}>
            {g.label}
          </Chip>
        ))}
      </div>

      {!active ? (
        /* ── Idle: collections grid ── */
        <>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
              marginBottom: 12,
              fontFamily: N.ui,
            }}
          >
            Collections
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {ordered.map((c) => {
              const meta = META[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBook(c.id)}
                  className="noor-press"
                  style={{ ...card, padding: 22, textAlign: "left", cursor: "pointer", color: N.fg, display: "block", width: "100%" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 11,
                        background: N.goldSoft,
                        border: `1px solid ${N.gold}`,
                        display: "grid",
                        placeItems: "center",
                        color: N.gold,
                      }}
                    >
                      <Icon name="book" size={20} color={N.gold} />
                    </span>
                    <Icon name="arrowR" size={18} color={N.faint} />
                  </div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, marginTop: 16, color: N.fg, fontFamily: N.ui }}>
                    {meta?.name ?? c.name}
                  </div>
                  <div style={{ fontSize: 13, color: N.faint, marginTop: 3, fontFamily: N.ui }}>{meta?.by ?? ""}</div>
                  <div style={{ fontSize: 13, color: N.gold, marginTop: 10, fontWeight: 600, fontFamily: N.ui }}>
                    {meta?.count ?? loaded[c.id]?.hadiths.length ?? ""} hadith
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Active: results ── */
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13.5, color: N.muted, fontFamily: N.ui }}>
              <span style={{ color: N.fg, fontWeight: 700 }}>{results.length}</span> result{results.length !== 1 ? "s" : ""}
              {q && (
                <>
                  {" "}
                  for “<span style={{ color: N.gold }}>{q}</span>”
                </>
              )}
              {book !== "all" && <> in {shortName(book)}</>}
              {!allLoaded && <span style={{ color: N.faint }}> · indexing…</span>}
            </div>
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: "none",
                border: "none",
                color: N.gold,
                fontFamily: N.ui,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="close" size={15} color={N.gold} /> Clear
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.slice(0, visible).map((h) => {
              const cat = hadithGradeCategory(h.collectionId, h.grades);
              const color = GRADE_COLOR[cat];
              const section = sectionName(h);
              return (
                <div key={`${h.collectionId}:${h.number}`} style={{ ...card, padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 12.5, color: N.muted, fontWeight: 600, fontFamily: N.ui, minWidth: 0 }}>
                      {shortName(h.collectionId)}
                      {section && <span style={{ color: N.faint }}> · {section}</span>}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color,
                        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
                        background: `color-mix(in srgb, ${color} 13%, transparent)`,
                        borderRadius: 6,
                        padding: "3px 9px",
                        fontWeight: 700,
                        flexShrink: 0,
                        fontFamily: N.ui,
                      }}
                    >
                      {HADITH_GRADE_LABEL[cat]}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: N.fg, fontFamily: N.ui }}>
                    {highlight(h.text, q)}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: `1px solid ${N.borderSoft}`,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 13, color: N.gold, fontWeight: 600, fontFamily: N.ui }}>
                      Book {h.reference.book} · Hadith {h.reference.hadith}
                    </span>
                    {h.grades.length > 0 && (
                      <span style={{ fontSize: 11.5, color: N.faint, fontFamily: N.ui }}>
                        {h.grades.slice(0, 2).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {results.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              style={{
                ...card,
                width: "100%",
                marginTop: 12,
                padding: 14,
                color: N.gold,
                fontFamily: N.ui,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Show more ({results.length - visible} more)
            </button>
          )}

          {allLoaded && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 14, opacity: 0.5 }}>
                <Khatam size={54} color={N.goldDim} sw={1.2} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, fontFamily: N.ui }}>No hadith found</div>
              <div style={{ fontSize: 14, color: N.muted, fontFamily: N.ui }}>
                Try a different word, or remove a filter.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
