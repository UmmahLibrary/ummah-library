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
  // Bump to re-run the fetch effect when the user retries after an error.
  const [attempt, setAttempt] = useState(0);

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
  }, [collectionId, section, attempt]);

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

      {status === "loading" &&
        Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="hadith hadith-skeleton" aria-hidden="true">
            <div className="hadith-meta">
              <span className="skeleton-line" />
            </div>
            <p className="hadith-text">
              <span className="skeleton-line" style={{ width: "92%", display: "block" }} />
              <span
                className="skeleton-line"
                style={{ width: "78%", display: "block", marginTop: "0.5rem" }}
              />
            </p>
          </div>
        ))}
      {status === "loading" && (
        <span className="sr-only" role="status">
          Loading hadith…
        </span>
      )}
      {status === "error" && (
        <div className="hadith-error" role="alert">
          <span>Couldn’t load this book. You may have reached the end of the collection.</span>
          <button type="button" className="chip" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
        </div>
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
