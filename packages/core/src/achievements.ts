/**
 * Achievements / badges: a pure, deterministic reward layer computed over the
 * habit signals the app already keeps locally (hifz, prayer, reading, names,
 * collections) — no accounts, no server, no leaderboards (ADR 0006, 0032).
 *
 * The catalogue is declarative: each badge unlocks when one metric meets a
 * target, so the set is extended by adding a row — not by writing logic. Apps
 * assemble a {@link BadgeStats} snapshot from their stores and call
 * {@link evaluateBadges}; persistence of which badges have been *acknowledged*
 * (for the unlock toast) is a separate concern behind the `AchievementsStore`.
 */

/** The local habit signals badges are scored against. Unknown values are `0`. */
export interface BadgeStats {
  /** Āyāt currently memorized (hifz cards). */
  memorized: number;
  /** Surahs with any memorization progress. */
  surahsStarted: number;
  /** Current prayer streak (days). */
  prayerStreak: number;
  /** Best streak across any tracked habit (days). */
  bestStreak: number;
  /** Names of Allah learned (0–99). */
  namesLearned: number;
  /** Āyāt saved to collections. */
  savedVerses: number;
}

export type BadgeCategory = "memorize" | "prayer" | "knowledge" | "library";

/** A single achievement: unlocked when `stats[metric] >= target`. */
export interface Badge {
  id: string;
  glyph: string;
  name: string;
  description: string;
  category: BadgeCategory;
  metric: keyof BadgeStats;
  target: number;
}

/** One badge's standing against a stats snapshot. */
export interface BadgeProgress {
  badge: Badge;
  /** The current value of the badge's metric. */
  value: number;
  unlocked: boolean;
  /** Completion toward the target, clamped to 0–1. */
  progress: number;
}

/**
 * The badge catalogue, in display order. Extend by adding a row; tiers of the
 * same metric give a sense of progression. Keep ids stable — they are the
 * persisted "acknowledged" keys.
 */
export const BADGES: readonly Badge[] = [
  { id: "first-ayah", glyph: "✦", name: "First āyah", description: "Memorize your first āyah", category: "memorize", metric: "memorized", target: 1 },
  { id: "memorizer-10", glyph: "📖", name: "Ten memorized", description: "Memorize 10 āyāt", category: "memorize", metric: "memorized", target: 10 },
  { id: "memorizer-50", glyph: "📚", name: "Fifty memorized", description: "Memorize 50 āyāt", category: "memorize", metric: "memorized", target: 50 },
  { id: "surah-starter", glyph: "📗", name: "Surah starter", description: "Begin memorizing a surah", category: "memorize", metric: "surahsStarted", target: 1 },
  { id: "surah-five", glyph: "📕", name: "Five surahs", description: "Begin five surahs", category: "memorize", metric: "surahsStarted", target: 5 },
  { id: "streak-7", glyph: "🔥", name: "7-day streak", description: "Keep any habit for 7 days", category: "prayer", metric: "bestStreak", target: 7 },
  { id: "streak-30", glyph: "🌙", name: "30-day streak", description: "Keep any habit for 30 days", category: "prayer", metric: "bestStreak", target: 30 },
  { id: "streak-100", glyph: "⭐", name: "100-day streak", description: "Keep any habit for 100 days", category: "prayer", metric: "bestStreak", target: 100 },
  { id: "prayer-7", glyph: "🕌", name: "Steadfast", description: "A 7-day prayer streak", category: "prayer", metric: "prayerStreak", target: 7 },
  { id: "names-10", glyph: "✨", name: "Ten Names", description: "Learn 10 of the 99 Names", category: "knowledge", metric: "namesLearned", target: 10 },
  { id: "names-99", glyph: "🌟", name: "All 99 Names", description: "Learn all 99 Names of Allah", category: "knowledge", metric: "namesLearned", target: 99 },
  { id: "collector-5", glyph: "🔖", name: "Collector", description: "Save 5 āyāt", category: "library", metric: "savedVerses", target: 5 },
  { id: "collector-25", glyph: "🗂️", name: "Curator", description: "Save 25 āyāt", category: "library", metric: "savedVerses", target: 25 },
];

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Score every badge in `catalogue` against a stats snapshot, in catalogue order. */
export function evaluateBadges(
  stats: BadgeStats,
  catalogue: readonly Badge[] = BADGES,
): BadgeProgress[] {
  return catalogue.map((badge) => {
    const value = Math.max(0, stats[badge.metric] ?? 0);
    return {
      badge,
      value,
      unlocked: value >= badge.target,
      progress: badge.target <= 0 ? 1 : clamp01(value / badge.target),
    };
  });
}

/** Ids of every currently-unlocked badge. */
export function unlockedIds(stats: BadgeStats, catalogue: readonly Badge[] = BADGES): string[] {
  return evaluateBadges(stats, catalogue)
    .filter((b) => b.unlocked)
    .map((b) => b.badge.id);
}

/** How many badges are unlocked. */
export function unlockedCount(stats: BadgeStats, catalogue: readonly Badge[] = BADGES): number {
  return unlockedIds(stats, catalogue).length;
}

/**
 * Badges unlocked now but not yet acknowledged — the set to celebrate with a
 * toast. `acknowledged` is the persisted list of ids already shown.
 */
export function newlyUnlocked(
  stats: BadgeStats,
  acknowledged: Iterable<string>,
  catalogue: readonly Badge[] = BADGES,
): Badge[] {
  const seen = new Set(acknowledged);
  return evaluateBadges(stats, catalogue)
    .filter((b) => b.unlocked && !seen.has(b.badge.id))
    .map((b) => b.badge);
}
