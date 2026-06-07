/**
 * Standalone tasbīḥ counter — dhikr presets and the pure tally maths (cycles of
 * a target count with completed rounds). The web keeps the running total in
 * `localStorage`; this is deterministic and unit-tested.
 */

export interface DhikrPhrase {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export const DHIKR_PHRASES: readonly DhikrPhrase[] = [
  { id: "subhanallah", arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubḥānAllāh", meaning: "Glory be to Allah" },
  { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alḥamdulillāh", meaning: "All praise is due to Allah" },
  { id: "allahuakbar", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allāhu Akbar", meaning: "Allah is the Greatest" },
  {
    id: "tahlil",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    transliteration: "Lā ilāha illā-llāh",
    meaning: "There is no god but Allah",
  },
  { id: "istighfar", arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullāh", meaning: "I seek Allah’s forgiveness" },
];

/** Common per-round targets. */
export const TASBIH_TARGETS: readonly number[] = [33, 99, 100];

export interface TasbihState {
  /** Position within the current round (0…target-1). */
  count: number;
  /** Completed rounds of `target`. */
  rounds: number;
  total: number;
}

/** Derive the display state from a running total and the per-round target. */
export function tasbihState(total: number, target: number): TasbihState {
  const t = Math.max(1, Math.floor(target));
  const safeTotal = Math.max(0, Math.floor(total));
  return { count: safeTotal % t, rounds: Math.floor(safeTotal / t), total: safeTotal };
}
