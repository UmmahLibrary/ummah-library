/**
 * Adhkar (remembrances) domain — the occasion catalogue and the pure counter
 * logic for a dhikr session. The text itself is bundled content (ingested from
 * Ḥiṣn al-Muslim, see docs/adr/0016-adhkar.md); everything here is deterministic
 * and unit-tested. No I/O, no framework.
 */

import type { AdhkarOccasion, Dhikr } from "./entities";

export interface AdhkarOccasionInfo {
  id: AdhkarOccasion;
  /** English label. */
  label: string;
  /** Arabic label. */
  arabic: string;
}

/** The two daily adhkar sets, in the order they're presented. */
export const ADHKAR_OCCASIONS: readonly AdhkarOccasionInfo[] = [
  { id: "morning", label: "Morning", arabic: "أذكار الصباح" },
  { id: "evening", label: "Evening", arabic: "أذكار المساء" },
];

/** The dhikrs for an occasion, in display order. */
export function filterByOccasion(items: readonly Dhikr[], occasion: AdhkarOccasion): Dhikr[] {
  return items.filter((d) => d.occasions.includes(occasion)).sort((a, b) => a.order - b.order);
}

/** The next tally after one tap — never past the recommended repeat count. */
export function nextTally(current: number, repeat: number): number {
  return Math.min(Math.max(0, current) + 1, repeat);
}

/** Whether a dhikr's recommended repetitions have been reached. */
export function isDhikrComplete(count: number, repeat: number): boolean {
  return count >= repeat;
}

export interface AdhkarProgress {
  completed: number;
  total: number;
}

/** How many dhikrs in a set have reached their repeat count, given tap tallies. */
export function sessionProgress(
  items: readonly Dhikr[],
  counts: Readonly<Record<string, number>>,
): AdhkarProgress {
  let completed = 0;
  for (const d of items) {
    if (isDhikrComplete(counts[d.id] ?? 0, d.repeat)) completed++;
  }
  return { completed, total: items.length };
}
