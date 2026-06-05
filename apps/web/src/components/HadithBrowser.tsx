"use client";

import { useEffect, useState } from "react";

interface Collection {
  id: string;
  name: string;
}

interface Hadith {
  number: number;
  text: string;
  grades: string[];
  reference: { book: number; hadith: number };
}

interface Section {
  collectionId: string;
  section: number;
  name: string;
  hadiths: Hadith[];
}

export function HadithBrowser({ collections }: { collections: Collection[] }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [section, setSection] = useState(1);
  const [data, setData] = useState<Section | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!collectionId) return;
    let active = true;
    setStatus("loading");
    fetch(`/api/v1/hadith/${collectionId}/sections/${section}`)
      .then((res) => (res.ok ? (res.json() as Promise<Section>) : Promise.reject(new Error())))
      .then((d) => {
        if (active) {
          setData(d);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [collectionId, section]);

  if (collections.length === 0) return null;

  return (
    <div>
      <div className="hadith-controls">
        <select
          className="audio-reciter"
          value={collectionId}
          onChange={(e) => {
            setCollectionId(e.target.value);
            setSection(1);
          }}
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="hadith-nav">
          <button
            type="button"
            className="chip"
            disabled={section <= 1}
            onClick={() => setSection((s) => Math.max(1, s - 1))}
          >
            ‹ Prev
          </button>
          <span className="hadith-section-label">
            Book {section}
            {data?.name ? ` · ${data.name}` : ""}
          </span>
          <button type="button" className="chip" onClick={() => setSection((s) => s + 1)}>
            Next ›
          </button>
        </div>
      </div>

      {status === "loading" && <p className="hifz-muted">Loading…</p>}
      {status === "error" && (
        <p className="hifz-muted">
          Couldn’t load this book. You may have reached the end of the collection.
        </p>
      )}
      {status === "ready" &&
        data?.hadiths.map((h) => (
          <div key={h.number} className="hadith">
            <div className="hadith-meta">
              #{h.number}
              {h.grades.length > 0 ? ` · ${h.grades.join(" · ")}` : ""}
            </div>
            <p className="hadith-text">{h.text}</p>
          </div>
        ))}
    </div>
  );
}
