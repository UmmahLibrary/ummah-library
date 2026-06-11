"use client";

import { useEffect, useState } from "react";
import { N, Icon } from "./noor";

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

/** Display metadata (names with diacritics, author, narration count, design order). */
const METADATA: Record<string, { name: string; by: string; count: string; order: number }> = {
  "eng-bukhari": { name: "Ṣaḥīḥ al-Bukhārī", by: "Imam al-Bukhārī", count: "7,563", order: 0 },
  "eng-muslim": { name: "Ṣaḥīḥ Muslim", by: "Imam Muslim", count: "7,500", order: 1 },
  "eng-abudawud": { name: "Sunan Abī Dāwūd", by: "Abū Dāwūd", count: "5,274", order: 2 },
  "eng-tirmidhi": { name: "Jāmiʿ at-Tirmidhī", by: "At-Tirmidhī", count: "3,956", order: 3 },
  "eng-nasai": { name: "Sunan an-Nasāʾī", by: "An-Nasāʾī", count: "5,761", order: 4 },
  "eng-ibnmajah": { name: "Sunan Ibn Mājah", by: "Ibn Mājah", count: "4,341", order: 5 },
};

const ORDER = (id: string): number => METADATA[id]?.order ?? 99;

export function HadithBrowser({ collections }: { collections: Collection[] }) {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [section, setSection] = useState(1);
  const [data, setData] = useState<Section | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!collectionId) return;
    let active = true;
    setStatus("loading");
    setData(null);
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

  // Collection card grid
  if (!collectionId) {
    const ordered = [...collections].sort((a, b) => ORDER(a.id) - ORDER(b.id));
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {ordered.map((c) => {
          const meta = METADATA[c.id];
          return (
            <button
              key={c.id}
              onClick={() => {
                setCollectionId(c.id);
                setSection(1);
              }}
              className="noor-press"
              style={{
                display: "block",
                width: "100%",
                padding: 22,
                borderRadius: 16,
                border: `1px solid ${N.border}`,
                background: N.card,
                color: N.fg,
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = N.goldDim;
                e.currentTarget.style.background = N.cardHi;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = N.border;
                e.currentTarget.style.background = N.card;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div
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
                </div>
                <Icon name="arrowR" size={18} color={N.faint} />
              </div>
              <div style={{ fontSize: 16.5, fontWeight: 700, marginTop: 16, color: N.fg, fontFamily: N.ui }}>
                {meta?.name ?? c.name}
              </div>
              <div style={{ fontSize: 13, color: N.faint, marginTop: 3, fontFamily: N.ui }}>
                {meta?.by ?? ""}
              </div>
              {meta && (
                <div style={{ fontSize: 13, color: N.gold, marginTop: 10, fontWeight: 600, fontFamily: N.ui }}>
                  {meta.count} hadith
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const col = collections.find((c) => c.id === collectionId);

  return (
    <div>
      {/* Back + book navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setCollectionId(null);
            setData(null);
            setStatus("idle");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 999,
            border: `1px solid ${N.border}`,
            background: N.card,
            color: N.muted,
            fontFamily: N.ui,
            fontSize: 13.5,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Icon name="arrowL" size={16} />
          Collections
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, fontFamily: N.ui, color: N.fg }}>
            {(collectionId && METADATA[collectionId]?.name) || col?.name}
          </div>
          {data?.name && (
            <div style={{ fontSize: 12.5, color: N.muted, fontFamily: N.ui, marginTop: 1 }}>
              Book {section} · {data.name}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            disabled={section <= 1}
            onClick={() => setSection((s) => Math.max(1, s - 1))}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: `1px solid ${N.border}`,
              background: N.card,
              color: section <= 1 ? N.faint : N.muted,
              fontFamily: N.ui,
              fontSize: 13,
              cursor: section <= 1 ? "default" : "pointer",
            }}
          >
            ‹ Prev
          </button>
          <button
            onClick={() => setSection((s) => s + 1)}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: `1px solid ${N.border}`,
              background: N.card,
              color: N.muted,
              fontFamily: N.ui,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {status === "loading" &&
        Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              padding: "18px 20px",
              borderRadius: 12,
              border: `1px solid ${N.border}`,
              background: N.card,
              marginBottom: 10,
            }}
            aria-hidden="true"
          >
            <div
              style={{
                height: 12,
                width: "30%",
                borderRadius: 6,
                background: N.borderSoft,
                marginBottom: 10,
              }}
            />
            <div style={{ height: 11, width: "92%", borderRadius: 5, background: N.borderSoft }} />
            <div
              style={{
                height: 11,
                width: "78%",
                borderRadius: 5,
                background: N.borderSoft,
                marginTop: 6,
              }}
            />
          </div>
        ))}
      {status === "loading" && (
        <span className="sr-only" role="status">
          Loading hadith…
        </span>
      )}

      {/* Error */}
      {status === "error" && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${N.border}`,
            background: N.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
          role="alert"
        >
          <span style={{ fontSize: 14, color: N.muted, fontFamily: N.ui }}>
            Couldn't load this book. You may have reached the end of the collection.
          </span>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: `1px solid ${N.border}`,
              background: N.cardHi,
              color: N.fg,
              fontFamily: N.ui,
              fontSize: 13,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Hadith cards */}
      {status === "ready" &&
        data?.hadiths.map((h) => {
          const grades = h.grades.slice(0, 3);
          return (
            <div
              key={h.number}
              style={{
                padding: "18px 20px",
                borderRadius: 12,
                border: `1px solid ${N.border}`,
                background: N.card,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: N.ui,
                    color: N.faint,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                  }}
                >
                  #{h.number}
                </span>
                {grades.map((g) => (
                  <span
                    key={g}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: N.goldSoft,
                      color: N.gold,
                      fontFamily: N.ui,
                      fontWeight: 600,
                    }}
                  >
                    {g.length > 30 ? g.slice(0, 30) + "…" : g}
                  </span>
                ))}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  lineHeight: 1.75,
                  color: N.fg,
                  fontFamily: N.ui,
                }}
              >
                {h.text}
              </p>
            </div>
          );
        })}
    </div>
  );
}
