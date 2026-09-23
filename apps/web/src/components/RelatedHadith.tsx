"use client";

import { useEffect, useState } from "react";
import { HADITH_GRADE_LABEL, hadithGradeCategory } from "@ummahlibrary/core";
import type { HadithGrade } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";

interface RelatedHadithItem {
  collectionId: string;
  collectionName: string;
  number: number;
  text: string;
  arabic?: string;
  grades: string[];
  reference: { book: number; hadith: number };
  relation: "quotes";
  quote: string;
}

interface Response {
  verse: string;
  count: number;
  hadiths: RelatedHadithItem[];
}

// One shared fetch per āyah; a re-open reuses it rather than refetching.
const cache = new Map<string, Promise<RelatedHadithItem[]>>();
function loadRelated(surah: number, aya: number): Promise<RelatedHadithItem[]> {
  const key = `${surah}:${aya}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}/ayahs/${aya}/hadith`)
      .then((res) => {
        if (!res.ok) throw new Error(`related_unavailable:${res.status}`);
        return res.json() as Promise<Response>;
      })
      .then((data) => data.hadiths);
    cache.set(key, pending);
  }
  return pending;
}

const GRADE_COLOR: Record<HadithGrade, string> = {
  sahih: N.gold,
  hasan: N.gold,
  daif: N.muted,
  unknown: N.muted,
};

/**
 * Hadith that quote this āyah (#200, ADR 0042), mirroring the Tafsir panel's
 * toggle-and-panel shape.
 *
 * These links are **generated, not curated** — a hadith appears here because its
 * Arabic contains a contiguous run of this āyah's words. So the panel shows the
 * matched span as evidence and says plainly how the connection was made, rather
 * than presenting it as an editorial judgement it is not.
 */
export function RelatedHadith({ surah, aya }: { surah: number; aya: number }) {
  const [items, setItems] = useState<RelatedHadithItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setItems(null);
    setFailed(false);
    loadRelated(surah, aya)
      .then((list) => {
        if (active) setItems(list);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [surah, aya]);

  const frame = {
    marginTop: 10,
    padding: "14px 16px",
    background: N.card,
    border: `1px solid ${N.border}`,
    borderRadius: 12,
    fontFamily: N.ui,
  } as const;

  if (failed) {
    return (
      <div style={{ ...frame, fontSize: 13.5, color: N.muted }}>
        Couldn’t load related hadith. Check your connection and try again.
      </div>
    );
  }

  if (items === null) {
    return (
      <div style={{ ...frame, fontSize: 13.5, color: N.muted }} role="status" aria-busy="true">
        Looking for hadith that quote this āyah…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ ...frame, fontSize: 13.5, color: N.muted }}>
        No hadith in the six collections quotes this āyah word for word.
      </div>
    );
  }

  return (
    <div style={frame}>
      <div
        style={{
          fontSize: 11.5,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: N.faint,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {items.length} hadith {items.length === 1 ? "quotes" : "quote"} this āyah
      </div>
      <p style={{ fontSize: 12.5, color: N.faint, margin: "0 0 14px", lineHeight: 1.5 }}>
        Matched automatically where the hadith’s Arabic repeats this āyah’s words. A shared wording
        is not by itself a commentary on the verse.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((h) => {
          const grade = hadithGradeCategory(h.collectionId, h.grades);
          return (
            <article
              key={`${h.collectionId}:${h.number}`}
              style={{
                padding: "12px 14px",
                background: N.bg2,
                border: `1px solid ${N.borderSoft}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 7,
                }}
              >
                <a
                  href={`/hadith?collection=${h.collectionId}&section=${h.reference.book}`}
                  style={{ fontSize: 13.5, fontWeight: 700, color: N.gold, textDecoration: "none" }}
                >
                  {h.collectionName} · {h.number}
                </a>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: GRADE_COLOR[grade] }}>
                  {HADITH_GRADE_LABEL[grade]}
                </span>
              </div>

              {h.arabic && (
                <p
                  dir="rtl"
                  lang="ar"
                  style={{
                    fontFamily: N.ar,
                    fontSize: 17,
                    lineHeight: 2,
                    color: N.fg,
                    margin: "0 0 8px",
                  }}
                >
                  {h.arabic}
                </p>
              )}

              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: N.muted, margin: 0 }}>
                {h.text}
              </p>

              <div
                style={{
                  marginTop: 9,
                  paddingTop: 8,
                  borderTop: `1px solid ${N.borderSoft}`,
                  fontSize: 11.5,
                  color: N.faint,
                }}
              >
                Shared wording:{" "}
                <span dir="rtl" lang="ar" style={{ fontFamily: N.ar, fontSize: 13.5 }}>
                  {h.quote}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
