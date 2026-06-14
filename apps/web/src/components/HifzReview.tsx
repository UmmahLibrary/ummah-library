"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type ReviewRating, reviewByRating } from "@ummahlibrary/core";
import { type HifzRecord, allRecords, dueRecords, setCard } from "../lib/hifz-store";
import { N, Khatam } from "@ummahlibrary/ui";

interface SurahArabic {
  ayahs: { aya: number; text: string }[];
}

// Shared per-surah fetch so a review session makes at most one call per surah.
const arabicCache = new Map<number, Promise<Map<number, string>>>();
function loadSurahArabic(surah: number): Promise<Map<number, string>> {
  let pending = arabicCache.get(surah);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}`)
      .then((res) => (res.ok ? (res.json() as Promise<SurahArabic>) : { ayahs: [] }))
      .then((data) => new Map(data.ayahs.map((a) => [a.aya, a.text])));
    arabicCache.set(surah, pending);
  }
  return pending;
}

const RATINGS: { rating: ReviewRating; label: string }[] = [
  { rating: "again", label: "Again" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" },
];

export function HifzReview() {
  const [ready, setReady] = useState(false);
  const [total, setTotal] = useState(0);
  const [queue, setQueue] = useState<HifzRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [arabic, setArabic] = useState<string | null>(null);

  useEffect(() => {
    setTotal(allRecords().length);
    setQueue(dueRecords(new Date()));
    setReady(true);
  }, []);

  const current = queue[index];

  useEffect(() => {
    if (!current) return;
    setArabic(null);
    let active = true;
    void loadSurahArabic(current.ref.sura).then((m) => {
      if (active) setArabic(m.get(current.ref.aya) ?? "");
    });
    return () => {
      active = false;
    };
  }, [current]);

  function rate(rating: ReviewRating) {
    if (!current) return;
    setCard(current.ref, reviewByRating(current.card, rating, new Date()));
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (!ready) return null;

  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px 30px" }}>
        <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 16, opacity: 0.5 }}>
          <Khatam size={64} color={N.goldDim} sw={1.2} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: N.fg, marginBottom: 8, fontFamily: N.ui }}>
          Begin your hifz journey
        </div>
        <div style={{ fontSize: 14.5, color: N.muted, maxWidth: 440, margin: "0 auto", lineHeight: 1.6, fontFamily: N.ui }}>
          You aren’t memorizing any āyāt yet. Open a{" "}
          <Link href="/" style={{ color: N.gold, fontWeight: 600 }}>
            surah
          </Link>{" "}
          and tap <strong style={{ color: N.gold }}>＋ Hifz</strong> on an āyah — it’ll appear here on
          a spaced-repetition schedule tuned to your recall.
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="hifz-done">
        <p className="hifz-done-title">All caught up 🎉</p>
        <p className="hifz-muted">
          {total} āyah{total === 1 ? "" : "t"} tracked · nothing due right now.
        </p>
      </div>
    );
  }

  return (
    <div className="hifz-card">
      <div className="hifz-progress">
        Reviewing {index + 1} / {queue.length} due · {total} tracked
      </div>
      <div className="hifz-ref">
        Surah {current.ref.sura} · Āyah {current.ref.aya}
      </div>

      {revealed ? (
        <p className="hifz-ar arabic">{arabic === null ? "…" : arabic}</p>
      ) : (
        <button type="button" className="hifz-reveal" onClick={() => setRevealed(true)}>
          Reveal āyah
        </button>
      )}

      {revealed && (
        <div className="hifz-ratings">
          {RATINGS.map(({ rating, label }) => (
            <button
              key={rating}
              type="button"
              className={`hifz-rate hifz-rate--${rating}`}
              onClick={() => rate(rating)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
