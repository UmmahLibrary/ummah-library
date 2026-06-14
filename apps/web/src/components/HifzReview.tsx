"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type ReviewRating, reviewByRating } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import { type HifzRecord, allRecords, dueRecords, setCard } from "../lib/hifz-store";
import { touchStreak } from "../lib/hifz-streak";

interface SurahArabic {
  ayahs: { aya: number; text: string }[];
}

const arabicCache = new Map<number, Promise<Map<number, string>>>();
function loadSurahArabic(surah: number): Promise<Map<number, string>> {
  let pending = arabicCache.get(surah);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}`)
      .then((r) => (r.ok ? (r.json() as Promise<SurahArabic>) : { ayahs: [] }))
      .then((d) => new Map(d.ayahs.map((a) => [a.aya, a.text])));
    arabicCache.set(surah, pending);
  }
  return pending;
}

const RATINGS: { rating: ReviewRating; label: string; color: string }[] = [
  { rating: "again", label: "Again", color: "#C56A52" },
  { rating: "hard", label: "Hard", color: N.muted },
  { rating: "good", label: "Good", color: N.gold },
  { rating: "easy", label: "Easy", color: "#5BBF8A" },
];

export function HifzReview({
  surahNames,
}: {
  surahNames: Record<number, { transliteration: string; name: string }>;
}) {
  const [ready, setReady] = useState(false);
  const [total, setTotal] = useState(0);
  const [queue, setQueue] = useState<HifzRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [arabic, setArabic] = useState<string | null>(null);
  const streakTouched = useRef(false);

  useEffect(() => {
    const all = allRecords();
    const due = dueRecords(new Date());
    setTotal(all.length);
    setQueue(due);
    setReady(true);
  }, []);

  const current = queue[index];

  useEffect(() => {
    if (!current) return;
    setArabic(null);
    setRevealed(false);
    let active = true;
    void loadSurahArabic(current.ref.sura).then((m) => {
      if (active) setArabic(m.get(current.ref.aya) ?? "");
    });
    return () => { active = false; };
  }, [current]);

  function rate(rating: ReviewRating) {
    if (!current) return;
    setCard(current.ref, reviewByRating(current.card, rating, new Date()));
    if (!streakTouched.current) {
      touchStreak();
      streakTouched.current = true;
    }
    setIndex((i) => i + 1);
  }

  if (!ready) return null;

  const surahMeta = current ? surahNames[current.ref.sura] : null;
  const progress = queue.length > 0 ? index / queue.length : 1;

  // ── Empty: nothing tracked ──────────────────────────────────────────
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "56px 20px 32px" }}>
        <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 18, opacity: 0.45 }}>
          <Khatam size={72} color={N.goldDim} sw={1.2} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: N.fg, marginBottom: 10, fontFamily: N.ui }}>
          Nothing to review yet
        </div>
        <div style={{ fontSize: 14.5, color: N.muted, maxWidth: 400, margin: "0 auto", lineHeight: 1.65, fontFamily: N.ui }}>
          Open a{" "}
          <Link href="/" style={{ color: N.gold, fontWeight: 600 }}>surah</Link>{" "}
          and tap <strong style={{ color: N.gold }}>＋ Hifz</strong> on an āyah to start.
        </div>
      </div>
    );
  }

  // ── Done: all due cards reviewed ────────────────────────────────────
  if (!current) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px 32px" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: N.fg, marginBottom: 8, fontFamily: N.ui }}>
          All caught up!
        </div>
        <div style={{ fontSize: 14.5, color: N.muted, marginBottom: 28, fontFamily: N.ui }}>
          {queue.length} āyah{queue.length !== 1 ? "āt" : ""} reviewed · {total} tracked in total.
        </div>
        <Link
          href="/hifz"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 20px",
            borderRadius: 11,
            background: N.goldSoft,
            border: `1px solid ${N.gold}`,
            color: N.gold,
            fontFamily: N.ui,
            fontWeight: 700,
            fontSize: 14.5,
            textDecoration: "none",
          }}
        >
          <Icon name="arrowL" size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  // ── Active review card ──────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: N.border }}>
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: "100%",
              borderRadius: 2,
              background: N.gold,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span style={{ fontSize: 12.5, color: N.faint, fontFamily: N.ui, whiteSpace: "nowrap" }}>
          {index} / {queue.length}
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          background: `linear-gradient(160deg, ${N.cardHi}, ${N.card})`,
          border: `1px solid ${N.border}`,
          borderRadius: 20,
          padding: "28px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative star */}
        <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.06, pointerEvents: "none" }}>
          <Khatam size={140} color={N.gold} sw={1} />
        </div>

        {/* Surah reference */}
        <div style={{ fontSize: 12.5, color: N.faint, letterSpacing: 0.8, fontFamily: N.ui, marginBottom: 6 }}>
          {surahMeta?.transliteration ?? `Surah ${current.ref.sura}`} · Āyah {current.ref.aya}
        </div>
        {surahMeta && (
          <div className="arabic" style={{ fontSize: 18, color: N.goldDim, marginBottom: 18 }}>
            {surahMeta.name}
          </div>
        )}

        {revealed ? (
          <p
            className="arabic"
            style={{
              fontSize: "clamp(26px, 5vw, 38px)",
              lineHeight: 2,
              color: N.fg,
              margin: 0,
              direction: "rtl",
            }}
          >
            {arabic === null ? "…" : arabic}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            style={{
              margin: "16px auto",
              padding: "13px 32px",
              borderRadius: 12,
              border: `1px solid ${N.border}`,
              background: N.card,
              color: N.muted,
              fontFamily: N.ui,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="book" size={16} color={N.muted} /> Reveal āyah
          </button>
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {RATINGS.map(({ rating, label, color }) => (
            <button
              key={rating}
              type="button"
              onClick={() => rate(rating)}
              style={{
                padding: "12px 8px",
                borderRadius: 12,
                border: `1px solid ${color}`,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                color,
                fontFamily: N.ui,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
