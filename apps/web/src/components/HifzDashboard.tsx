"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOTAL_AYAHS } from "@ummahlibrary/core";
import { N, Khatam, Btn } from "@ummahlibrary/ui";
import { allRecords, dueRecords, surahProgressMap, type SurahProgress } from "../lib/hifz-store";
import { getStreak } from "../lib/hifz-streak";

export interface SurahMeta {
  number: number;
  name: string;
  transliteration: string;
  ayahCount: number;
}

interface QueueItem extends SurahProgress {
  name: string;
  transliteration: string;
  ayahCount: number;
}

function relativeDue(nextDue: string | null): string {
  if (!nextDue) return "—";
  const diff = Math.round((new Date(nextDue).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

function StrengthBar({ value }: { value: number }) {
  const color = value > 0.65 ? N.gold : value > 0.35 ? "#C9A24B" : N.goldDim;
  return (
    <div style={{ flex: 1, maxWidth: 100, height: 4, borderRadius: 2, background: N.border }}>
      <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", borderRadius: 2, background: color }} />
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: N.gold, letterSpacing: -1, fontFamily: N.ui }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3, fontFamily: N.ui }}>{label}</div>
    </div>
  );
}

export function HifzDashboard({ surahs }: { surahs: SurahMeta[] }) {
  const [ready, setReady] = useState(false);
  const [totalTracked, setTotalTracked] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    try {
      const now = new Date();
      const all = allRecords();
      const due = dueRecords(now);
      const streakData = getStreak();
      const progressMap = surahProgressMap(now);
      const surahByNum = new Map(surahs.map((s) => [s.number, s]));

      setTotalTracked(all.length);
      setDueCount(due.length);
      setStreak(streakData.count);

      const items: QueueItem[] = [];
      for (const [surahNum, progress] of progressMap) {
        const meta = surahByNum.get(surahNum);
        if (!meta) continue;
        items.push({ ...progress, name: meta.name, transliteration: meta.transliteration, ayahCount: meta.ayahCount });
      }
      items.sort((a, b) => b.dueCount - a.dueCount || a.surahNumber - b.surahNumber);
      setQueue(items);
    } finally {
      setReady(true);
    }
  }, [surahs]);

  if (!ready) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: N.card, border: `1px solid ${N.border}`, borderRadius: 14, padding: "18px 20px", height: 72, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  const memorizedPct = totalTracked === 0 ? "0%" : `${Math.round((totalTracked / TOTAL_AYAHS) * 100)}%`;

  if (totalTracked === 0) {
    return (
      <div style={{ textAlign: "center", padding: "56px 20px 32px" }}>
        <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 18, opacity: 0.45 }}>
          <Khatam size={72} color={N.goldDim} sw={1.2} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: N.fg, marginBottom: 10, fontFamily: N.ui }}>
          Begin your ḥifẓ journey
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: N.muted,
            maxWidth: 400,
            margin: "0 auto",
            lineHeight: 1.65,
            fontFamily: N.ui,
          }}
        >
          Open a{" "}
          <Link href="/" style={{ color: N.gold, fontWeight: 600 }}>
            surah
          </Link>{" "}
          and tap <strong style={{ color: N.gold }}>＋ Hifz</strong> on any āyah — it will appear here
          on a spaced-repetition schedule tuned to your recall.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 }}>
        <StatCard value={memorizedPct} label="Quran memorized" />
        <StatCard value={String(dueCount)} label="Due today" />
        <StatCard value={streak > 0 ? `${streak} 🔥` : "—"} label="Day streak" />
        <StatCard value={String(totalTracked)} label="Āyāt tracked" />
      </div>

      {/* CTA */}
      {dueCount > 0 && (
        <div
          style={{
            background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
            border: `1px solid ${N.border}`,
            borderRadius: 16,
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: N.fg, fontFamily: N.ui }}>
              {dueCount} āyah{dueCount !== 1 ? "āt" : ""} ready for review
            </div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 4, fontFamily: N.ui }}>
              Keep your streak alive — a few minutes is all it takes.
            </div>
          </div>
          <Link href="/hifz/review">
            <Btn variant="gold" icon="play">
              Start review
            </Btn>
          </Link>
        </div>
      )}

      {/* Queue */}
      <div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: N.faint,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 10,
          }}
        >
          Review queue
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.map((item) => (
            <Link
              key={item.surahNumber}
              href={`/surah/${item.surahNumber}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: N.card,
                  border: `1px solid ${item.dueCount > 0 ? N.border : N.borderSoft}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Surah number badge */}
                <div
                  style={{ width: 38, height: 38, position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}
                >
                  <Khatam size={38} color={N.goldDim} sw={1.2} />
                  <span
                    style={{ position: "absolute", fontSize: 11.5, fontWeight: 700, color: N.gold, fontFamily: N.ui }}
                  >
                    {item.surahNumber}
                  </span>
                </div>

                {/* Name + strength */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                    {item.transliteration}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
                  >
                    <StrengthBar value={item.avgStrength} />
                    <span style={{ fontSize: 12, color: N.faint, fontFamily: N.ui, whiteSpace: "nowrap" }}>
                      {item.trackedCount} / {item.ayahCount} āyāt ·{" "}
                      {Math.round(item.avgStrength * 100)}% strength
                    </span>
                  </div>
                </div>

                {/* Due badge */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  {item.dueCount > 0 ? (
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: N.gold,
                        background: N.goldSoft,
                        border: `1px solid ${N.gold}`,
                        borderRadius: 8,
                        padding: "3px 9px",
                        fontFamily: N.ui,
                      }}
                    >
                      {item.dueCount} due
                    </span>
                  ) : (
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: N.faint, fontFamily: N.ui }}>
                      {relativeDue(item.nextDue)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
