"use client";

import { useEffect, useState } from "react";
import { DEFAULT_EDITIONS, EDITIONS_KEY, readEditions } from "../lib/editions";
import { fetchEditionSurah } from "../lib/catalogue";
import Link from "next/link";
import { ayahKey, verseOfDay } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { useT } from "../i18n/I18nProvider";

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
  const t = useT();

  useEffect(() => {
    const ref = verseOfDay(today());
    let cancelled = false;
    // The translation follows the reader's choice (ADR 0041): none for
    // "None — Arabic only", otherwise their first chosen edition's text.
    const load = async () => {
      try {
        const r = await fetch(`/api/v1/surahs/${ref.sura}/ayahs/${ref.aya}?edition=eng-khattab`);
        const data = (r.ok ? await r.json() : null) as {
          ayah?: { text?: string };
          translation?: { text?: string };
        } | null;
        if (cancelled || !data?.ayah?.text) return;
        const ids = await readEditions();
        let translation: string | null = null;
        if (ids.length > 0) {
          translation =
            ids[0] === DEFAULT_EDITIONS[0]
              ? (data.translation?.text ?? null)
              : ((await fetchEditionSurah(ids[0]!, ref.sura)).get(ref.aya) ?? null);
        }
        if (cancelled) return;
        setV({ sura: ref.sura, aya: ref.aya, arabic: data.ayah.text, translation });
      } catch {
        /* offline: keep the skeleton */
      }
    };
    void load();
    window.addEventListener(EDITIONS_KEY, load);
    return () => {
      cancelled = true;
      window.removeEventListener(EDITIONS_KEY, load);
    };
  }, []);

  if (!v) {
    return (
      <div style={cardStyle} aria-busy="true">
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="skeleton-line" style={{ height: "1.8rem", borderRadius: 6 }} />
          <div
            className="skeleton-line"
            style={{ height: "1.8rem", width: "68%", borderRadius: 6 }}
          />
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <div style={labelStyle}>{t("vod.label")}</div>
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
        <div style={labelStyle}>{t("vod.label")}</div>
        {v.translation && (
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: N.muted, fontFamily: N.ui }}>
            {v.translation}
          </div>
        )}
        <div
          style={{
            fontSize: 13.5,
            color: N.gold,
            marginTop: 10,
            fontWeight: 600,
            fontFamily: N.ui,
          }}
        >
          {name ? `${name} ${key}` : key}
        </div>
      </div>
    </Link>
  );
}
