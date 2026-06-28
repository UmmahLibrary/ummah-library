/**
 * Audio playback helpers (#136) — pure and shared by the web and mobile reciters,
 * so playback-speed steps and A→B range selection behave identically on both. No
 * I/O, no platform APIs.
 */

/** Selectable playback speeds, slowest→fastest (`1` is normal). */
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/** Clamp any rate into the supported `[0.5, 2]` band; a non-finite value → `1`. */
export function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(2, Math.max(0.5, rate));
}

/** The next speed in {@link PLAYBACK_SPEEDS}, wrapping around — for a tap-to-cycle control. */
export function cyclePlaybackRate(rate: number): number {
  const i = PLAYBACK_SPEEDS.indexOf(rate as (typeof PLAYBACK_SPEEDS)[number]);
  // From an off-grid value start at the first step; otherwise advance and wrap.
  return PLAYBACK_SPEEDS[i < 0 ? 0 : (i + 1) % PLAYBACK_SPEEDS.length]!;
}

/**
 * One word's recitation timing within its ayah (ADR 0036): the 0-based word index
 * and the millisecond window it is recited in, relative to the start of that
 * ayah's audio file. The compact, bundled form derived from quran-align
 * (CC-BY-4.0) — each ayah's words appear in recitation order.
 */
export type WordTiming = readonly [wordIndex: number, startMs: number, endMs: number];

/** A surah's word-by-word recitation timings for one reciter (ADR 0036). */
export interface SurahTiming {
  reciterId: string;
  surah: number;
  /** Ayah number → that ayah's per-word timings, in recitation (word) order. */
  ayahs: Record<number, readonly WordTiming[]>;
}

/**
 * The inclusive A→B slice of an ordered verse list, for range repeat. The order is
 * normalized (a reversed A/B selection is swapped). If either bound is missing or
 * not present in the list, the whole list is returned — i.e. repeat-all.
 */
export function repeatRange<T extends { sura: number; aya: number }>(
  verses: readonly T[],
  from: string | null | undefined,
  to: string | null | undefined,
): T[] {
  if (!from || !to) return [...verses];
  const keyOf = (v: T): string => `${v.sura}:${v.aya}`;
  let a = verses.findIndex((v) => keyOf(v) === from);
  let b = verses.findIndex((v) => keyOf(v) === to);
  if (a < 0 || b < 0) return [...verses];
  if (a > b) [a, b] = [b, a];
  return verses.slice(a, b + 1);
}
