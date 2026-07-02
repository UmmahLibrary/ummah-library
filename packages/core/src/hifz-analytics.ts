/**
 * Hifz analytics — pure derivations over the SM-2 state and a lightweight review
 * log: per-surah strength (strong vs. weak), a calendar activity heatmap, and
 * review streaks. No I/O and no clock of its own — `now`/`today` are injected
 * (see `hifz.ts`) — so every function is deterministic and unit-tested. Persistence
 * (the card store and the review log) lives in the app adapters; this file only
 * turns that data into view-model summaries, shared by web and mobile.
 */
import type { VerseKey } from "./entities";
import { type HifzCard, isDue } from "./hifz";

/** One tracked ayah and its SM-2 card (the app record shape). */
export interface HifzAyahRecord {
  ref: VerseKey;
  card: HifzCard;
}

/** 0 = new / never reviewed · 1 = solidly known (interval ≥ 30 days). */
export function cardStrength(card: HifzCard): number {
  if (card.lastReviewed === null) return 0;
  return Math.min(1, card.intervalDays / 30);
}

/** Per-surah memorization summary aggregated from its tracked ayah cards. */
export interface SurahProgress {
  surahNumber: number;
  trackedCount: number;
  dueCount: number;
  avgStrength: number; // 0–1
  nextDue: string | null; // earliest due ISO timestamp among tracked cards
}

/** Aggregate per-ayah records into per-surah summaries. */
export function surahProgressMap(
  records: readonly HifzAyahRecord[],
  now: Date,
): Map<number, SurahProgress> {
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

/**
 * The tracked surahs most in need of work, weakest first (lowest average
 * strength, ties broken by surah order). Only surahs with tracked ayāt.
 */
export function weakestSurahs(
  progress: Iterable<SurahProgress>,
  count: number,
): SurahProgress[] {
  return [...progress]
    .filter((p) => p.trackedCount > 0)
    .sort((a, b) => a.avgStrength - b.avgStrength || a.surahNumber - b.surahNumber)
    .slice(0, Math.max(0, count));
}

// ── Review activity log ──────────────────────────────────────────────────────

/** Number of reviews completed per day, keyed by `YYYY-MM-DD` (UTC). */
export type HifzActivityLog = Record<string, number>;

/** UTC `YYYY-MM-DD` for an instant (matches the streak store's day key). */
export function activityDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Record one completed review on `now`, returning a new log (input unchanged). */
export function logReview(log: HifzActivityLog, now: Date): HifzActivityLog {
  const key = activityDateKey(now);
  return { ...log, [key]: (log[key] ?? 0) + 1 };
}

/** One day in the heatmap grid. `level` buckets `count` into 0–4 for shading. */
export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function intensity(count: number): HeatmapDay["level"] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * A week-aligned activity grid ending on `today`: `weeks` columns of 7 days
 * (Sunday-first), oldest day first. The final column holds the current week, so
 * days after `today` sit at the end as empty (level 0) cells. Chunk into groups
 * of 7 for a columns-as-weeks render.
 */
export function activityHeatmap(
  log: HifzActivityLog,
  today: Date,
  weeks = 26,
): HeatmapDay[] {
  const cols = Math.max(1, weeks);
  // Sunday of the current week, then back to the first column's Sunday.
  const todayWeekday = today.getUTCDay(); // 0 = Sunday
  const start = addUtcDays(today, -todayWeekday - (cols - 1) * 7);

  const days: HeatmapDay[] = [];
  for (let i = 0; i < cols * 7; i++) {
    const date = activityDateKey(addUtcDays(start, i));
    const count = log[date] ?? 0;
    days.push({ date, count, level: intensity(count) });
  }
  return days;
}

// ── Streaks ──────────────────────────────────────────────────────────────────

/** Consecutive-day review streaks derived from the activity log. */
export interface HifzStreaks {
  /** Days in a row ending today (a not-yet-reviewed today still counts if yesterday was active). */
  current: number;
  /** The longest run of consecutive active days ever recorded. */
  longest: number;
}

function runEndingAt(log: HifzActivityLog, anchor: Date): number {
  let count = 0;
  let cursor = anchor;
  while ((log[activityDateKey(cursor)] ?? 0) > 0) {
    count++;
    cursor = addUtcDays(cursor, -1);
  }
  return count;
}

export function hifzStreaks(log: HifzActivityLog, today: Date): HifzStreaks {
  // Current: count from today; if today is blank, allow the run ending yesterday
  // so an as-yet-unreviewed day doesn't drop the streak to zero mid-day.
  const current =
    (log[activityDateKey(today)] ?? 0) > 0
      ? runEndingAt(log, today)
      : runEndingAt(log, addUtcDays(today, -1));

  // Longest: scan the active days in date order for the longest consecutive run.
  const active = Object.keys(log)
    .filter((k) => (log[k] ?? 0) > 0)
    .sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of active) {
    run = prev !== null && key === activityDateKey(addUtcDays(new Date(`${prev}T00:00:00.000Z`), 1)) ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = key;
  }
  return { current, longest };
}
