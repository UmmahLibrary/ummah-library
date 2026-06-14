/**
 * Pure Hifz helpers shared by the dashboard and review screens. Mirrors the web
 * reader's `lib/hifz-store` / `lib/hifz-streak` so both clients summarise the
 * same local-first SM-2 state identically (ADR 0006). The SM-2 engine itself
 * lives in `@ummahlibrary/core`; this module only derives view-model summaries.
 */
import { type HifzCard, type VerseKey, isDue } from "@ummahlibrary/core";

interface Record {
  ref: VerseKey;
  card: HifzCard;
}

/** 0 = new / never reviewed · 1 = solidly known (interval ≥ 30 days). */
export function cardStrength(card: HifzCard): number {
  if (card.lastReviewed === null) return 0;
  return Math.min(1, card.intervalDays / 30);
}

export interface SurahProgress {
  surahNumber: number;
  trackedCount: number;
  dueCount: number;
  avgStrength: number; // 0–1
  nextDue: string | null; // earliest due ISO timestamp among tracked cards
}

/** Aggregate per-ayah records into per-surah summaries. */
export function surahProgressMap(records: Record[], now: Date): Map<number, SurahProgress> {
  const map = new Map<number, SurahProgress>();
  for (const r of records) {
    const sura = r.ref.sura;
    const p = map.get(sura) ?? {
      surahNumber: sura,
      trackedCount: 0,
      dueCount: 0,
      avgStrength: 0,
      nextDue: null,
    };
    p.trackedCount++;
    p.avgStrength += cardStrength(r.card);
    if (isDue(r.card, now)) p.dueCount++;
    if (!p.nextDue || r.card.due < p.nextDue) p.nextDue = r.card.due;
    map.set(sura, p);
  }
  for (const [sura, p] of map) {
    p.avgStrength = p.trackedCount > 0 ? p.avgStrength / p.trackedCount : 0;
    map.set(sura, p);
  }
  return map;
}

/** Render a card's next-due timestamp relative to now. */
export function relativeDue(nextDue: string | null, now: Date): string {
  if (!nextDue) return "—";
  const diff = Math.round((new Date(nextDue).getTime() - now.getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

// ── Daily review streak ──────────────────────────────────────────────────────

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

export const EMPTY_STREAK: StreakData = { count: 0, lastDate: "" };

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Advance the streak for a completed review on `now`. Idempotent within a day;
 * a one-day gap continues the streak, a longer gap resets it to 1.
 */
export function advanceStreak(current: StreakData, now: Date): StreakData {
  const today = toDateStr(now);
  if (current.lastDate === today) return current;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    count: current.lastDate === toDateStr(yesterday) ? current.count + 1 : 1,
    lastDate: today,
  };
}
