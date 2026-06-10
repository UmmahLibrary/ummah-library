"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ayahKey, verseOfDay } from "@ummahlibrary/core";

interface Loaded {
  sura: number;
  aya: number;
  arabic: string;
  translation: string | null;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function VerseOfDay() {
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

  if (!v)
    return (
      <section className="votd">
        <div className="votd-label">Verse of the day</div>
        <div
          className="skeleton-line"
          style={{ height: "2rem", borderRadius: "6px", marginBottom: "0.75rem" }}
        />
        <div
          className="skeleton-line"
          style={{ height: "1rem", width: "78%", marginBottom: "0.5rem" }}
        />
        <div className="skeleton-line" style={{ height: "0.85rem", width: "22%" }} />
      </section>
    );
  const key = ayahKey({ sura: v.sura, aya: v.aya });

  return (
    <section className="votd">
      <div className="votd-label">Verse of the day</div>
      <Link href={`/surah/${v.sura}#${key}`} className="votd-link">
        <p className="votd-ar" dir="rtl" lang="ar">
          {v.arabic}
        </p>
        {v.translation && <p className="votd-tr">{v.translation}</p>}
        <span className="votd-ref">{key}</span>
      </Link>
    </section>
  );
}
