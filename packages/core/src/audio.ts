/**
 * Audio playback helpers (#136) — pure and shared by the web and mobile reciters,
 * so playback-speed steps and A→B range selection behave identically on both. No
 * I/O, no platform APIs.
 */
import type { VerseKey } from "./entities";
import type { AudioStore } from "./ports";
import { type ReciterPlugin, reciterAudioUrl } from "./plugins";
import { ayahCountOf } from "./quran-structure";

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

// ── Offline audio downloads (#202) ───────────────────────────────────────────

/** Progress of a surah audio download: ayahs saved so far vs the surah total. */
export interface AudioDownloadProgress {
  surah: number;
  done: number;
  total: number;
}

/**
 * Download every ayah of a surah for a reciter into the {@link AudioStore},
 * reporting progress and honouring cancellation. Idempotent — an ayah already
 * saved is skipped, so a resumed download only fetches the gaps. Pure
 * orchestration: every network/disk touch is the injected store's `save`, so it
 * stays deterministic and testable with a fake store.
 */
export async function downloadSurahAudio(
  store: AudioStore,
  reciter: ReciterPlugin,
  surah: number,
  opts: { onProgress?: (p: AudioDownloadProgress) => void; cancelled?: () => boolean } = {},
): Promise<void> {
  const total = ayahCountOf(surah);
  for (let aya = 1; aya <= total; aya++) {
    if (opts.cancelled?.()) return;
    const ref: VerseKey = { sura: surah, aya };
    if (!(await store.has(reciter.id, ref))) {
      await store.save(reciter.id, ref, reciterAudioUrl(reciter, ref));
    }
    opts.onProgress?.({ surah, done: aya, total });
  }
}

/** Whether the store holds every ayah of a surah for the reciter (a complete download). */
export async function isSurahDownloaded(
  store: AudioStore,
  reciterId: string,
  surah: number,
): Promise<boolean> {
  const saved = await store.savedSurahs();
  const entry = saved.find((s) => s.reciterId === reciterId && s.surah === surah);
  return entry !== undefined && entry.ayahCount >= ayahCountOf(surah);
}
