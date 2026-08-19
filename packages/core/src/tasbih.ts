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

/** Default per-round target for each built-in phrase — used the first time a
 *  phrase is selected, before it has its own stored progress. */
export const DEFAULT_TASBIH_TARGETS: Record<string, number> = {
  subhanallah: 33,
  alhamdulillah: 33,
  allahuakbar: 34,
  tahlil: 100,
};

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

/** One phrase's own running total and round size. */
export interface TasbihPhraseProgress {
  total: number;
  target: number;
}

/**
 * The persisted tasbih counter: the currently-displayed phrase, plus every
 * phrase's own progress keyed by phrase id. Each dhikr keeps its own total —
 * switching phrases (to check on another, or to work through the classic
 * 33/33/34 post-prayer sequence) must never lose or merge a phrase's count.
 */
export interface TasbihRecord {
  phraseId: string;
  phrases: Record<string, TasbihPhraseProgress>;
}

/** A phrase's stored progress, or a fresh zero at its default target when it
 *  hasn't been counted yet. */
export function tasbihPhraseProgress(record: TasbihRecord, phraseId: string): TasbihPhraseProgress {
  return record.phrases[phraseId] ?? { total: 0, target: DEFAULT_TASBIH_TARGETS[phraseId] ?? 33 };
}
