/**
 * Pure Hifz helpers shared by the dashboard and review screens. Mirrors the web
 * reader's `lib/hifz-store` / `lib/hifz-streak` so both clients summarise the
 * same local-first SM-2 state identically (ADR 0006). The SM-2 engine itself
 * lives in `@ummahlibrary/core`; this module only derives view-model summaries.
 */
import { localISODate } from "./utils";

// Strength + per-surah progress derivations are pure logic; they live in core
// (shared with the web reader) and are re-exported here so existing imports keep
// their path. `surahProgressMap(records, now)` — pass `allRecords()`.
export {
  cardStrength,
  surahProgressMap,
  weakestSurahs,
  type SurahProgress,
  type HifzAyahRecord,
} from "@ummahlibrary/core";

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

/** Local calendar date — the streak's "day" is the reader's own day, matching
 *  every other streak in the app (prayer tracker, reading goals), not UTC. */
export function toDateStr(d: Date): string {
  return localISODate(d);
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
