"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ayahKey, verseOfDay } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";

interface Loaded {
  sura: number;
  aya: number;
  arabic: string;
  translation: string | null;
}

/** Local calendar date as YYYY-MM-DD — the seed for the deterministic daily verse. */
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const cardStyle = {
  borderRadius: 16,
  padding: "22px 26px",
  background: N.card,
  border: `1px solid ${N.border}`,
  marginBottom: 16,
  display: "flex",
  gap: 28,
  alignItems: "center",
  flexWrap: "wrap",
  textDecoration: "none",
  transition: "border-color .15s",
} as const;

const labelStyle = {
  fontSize: 11.5,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: N.gold,
  fontWeight: 700,
  marginBottom: 8,
  fontFamily: N.ui,
} as const;

/**
 * The day's ayah — deterministic per calendar date (`verseOfDay`), resolved on the
 * client so it advances each day without a rebuild. Replaces the old hardcoded
 * verse, which never changed.
 */
export function HomeVerseOfDay({ nameOf }: { nameOf: (sura: number) => string }) {
  const [v, setV] = useState<Loaded | null>(null);

  useEffect(() => {
    const ref = verseOfDay(today());
    let cancelled = false;
    fetch(`/api/v1/surahs/${ref.sura}/ayahs/${ref.aya}?edition=eng-khattab`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ayah?: { text?: string }; translation?: { text?: string } } | null) => {
        if (cancelled || !data?.ayah?.text) return;
        setV({
          sura: ref.sura,
          aya: ref.aya,
          arabic: data.ayah.text,
          translation: data.translation?.text ?? null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!v) {
    return (
      <div style={cardStyle} aria-busy="true">
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="skeleton-line" style={{ height: "1.8rem", borderRadius: 6 }} />
          <div className="skeleton-line" style={{ height: "1.8rem", width: "68%", borderRadius: 6 }} />
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <div style={labelStyle}>Verse of the day</div>
          <div className="skeleton-line" style={{ height: "1rem", marginBottom: 8 }} />
          <div className="skeleton-line" style={{ height: "1rem", width: "82%" }} />
        </div>
      </div>
    );
  }

  const key = ayahKey({ sura: v.sura, aya: v.aya });
  const name = nameOf(v.sura);

  return (
    <Link href={`/surah/${v.sura}#${key}`} style={cardStyle}>
      <div
        className="noor-ar"
        style={{ flex: "1 1 280px", fontSize: 28, lineHeight: 2.1, color: N.fg }}
        dir="rtl"
        lang="ar"
      >
        {v.arabic}
      </div>
      <div style={{ flex: "1 1 260px" }}>
        <div style={labelStyle}>Verse of the day</div>
        {v.translation && (
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: N.muted, fontFamily: N.ui }}>
            {v.translation}
          </div>
        )}
        <div style={{ fontSize: 13.5, color: N.gold, marginTop: 10, fontWeight: 600, fontFamily: N.ui }}>
          {name ? `${name} ${key}` : key}
        </div>
      </div>
    </Link>
  );
}
