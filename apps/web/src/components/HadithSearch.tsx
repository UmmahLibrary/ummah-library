"use client";

import { useRef, useState } from "react";
import { searchText } from "@ummahlibrary/core";

interface Collection {
  id: string;
  name: string;
}

interface IndexItem {
  text: string;
  collectionId: string;
  collectionName: string;
  number: number;
  grades: string[];
}

const wholeEditionUrl = (id: string): string =>
  `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${id}.min.json`;

/** Fetch every collection's full edition (one request each) and flatten it. */
async function loadIndex(collections: Collection[]): Promise<IndexItem[]> {
  const editions = await Promise.all(
    collections.map((c) =>
      fetch(wholeEditionUrl(c.id))
        .then((r) =>
          r.ok
            ? (r.json() as Promise<{
                hadiths: {
                  hadithnumber: number;
                  text: string;
                  grades?: ({ name: string; grade: string } | string)[];
                }[];
              }>)
            : null,
        )
        .then((data) => ({ collection: c, data }))
        .catch(() => ({ collection: c, data: null })),
    ),
  );

  const items: IndexItem[] = [];
  for (const { collection, data } of editions) {
    for (const h of data?.hadiths ?? []) {
      items.push({
        text: h.text,
        collectionId: collection.id,
        collectionName: collection.name,
        number: h.hadithnumber,
        grades: (h.grades ?? []).map((g) => (typeof g === "string" ? g : `${g.name}: ${g.grade}`)),
      });
    }
  }
  return items;
}

export function HadithSearch({ collections }: { collections: Collection[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(IndexItem & { score: number })[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const indexRef = useRef<IndexItem[] | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function ensureIndex() {
    if (indexRef.current || status === "loading") return;
    setStatus("loading");
    loadIndex(collections)
      .then((items) => {
        indexRef.current = items;
        setStatus(items.length > 0 ? "ready" : "error");
      })
      .catch(() => setStatus("error"));
  }

  function run(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const index = indexRef.current;
      setResults(index ? searchText(index, q, 50) : []);
    }, 160);
  }

  if (collections.length === 0) return null;

  return (
    <div className="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search hadith — e.g. patience, intentions, kindness"
        value={query}
        onFocus={ensureIndex}
        onChange={(e) => run(e.target.value)}
        aria-label="Search hadith"
      />

      {status === "loading" && <p className="hifz-muted">Loading hadith for search…</p>}
      {status === "error" && (
        <p className="hifz-muted">Couldn’t load the hadith index. Check your connection.</p>
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
          <li key={`${r.collectionId}:${r.number}`} className="search-result">
            <div className="search-result-link">
              <span className="search-result-ref">
                {r.collectionName} · #{r.number}
                {r.grades.length > 0 ? <span className="search-tag">{r.grades[0]}</span> : null}
              </span>
              <span className="search-result-text">{r.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
