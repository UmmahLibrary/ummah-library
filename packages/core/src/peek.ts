/**
 * Hide-and-peek memorization helpers (#134) — pure and shared by the web and
 * mobile readers, so the testing/recall mode reveals text identically on both.
 *
 * The model is a single monotonic **reveal cursor**: a count of how many items
 * (words, or whole āyāt) from the start of the passage are uncovered. The reader
 * conceals everything, then advances the cursor — by one word, or through the end
 * of the current āyah — until the passage is fully shown. No I/O, no platform APIs.
 */

/** Granularity at which a concealed passage is progressively revealed. */
export type PeekStep = "word" | "ayah";

/** The total number of words across a passage given each āyah's word count. */
export function totalWords(wordsPerAyah: readonly number[]): number {
  return wordsPerAyah.reduce((sum, n) => sum + Math.max(0, n), 0);
}

/** Clamp a reveal cursor into `[0, total]`; a non-finite cursor → `0`. */
export function clampReveal(revealed: number, total: number): number {
  if (!Number.isFinite(revealed)) return 0;
  return Math.min(Math.max(0, total), Math.max(0, Math.floor(revealed)));
}

/** Reveal one more word — the next concealed word — clamped to the total. */
export function revealWord(revealed: number, total: number): number {
  return clampReveal(revealed + 1, total);
}

/**
 * Reveal through the end of the āyah that contains the next concealed word.
 * If everything is already shown, the cursor is unchanged. `wordsPerAyah` lists
 * each āyah's word count in reading order.
 */
export function revealAyah(revealed: number, wordsPerAyah: readonly number[]): number {
  const total = totalWords(wordsPerAyah);
  const cursor = clampReveal(revealed, total);
  if (cursor >= total) return total;
  // Walk cumulative boundaries; stop at the first āyah whose end passes the cursor.
  let end = 0;
  for (const count of wordsPerAyah) {
    end += Math.max(0, count);
    if (end > cursor) return end;
  }
  return total;
}

/** Whether the word at `index` (0-based, in reading order) is currently revealed. */
export function isWordRevealed(index: number, revealed: number): boolean {
  return index < revealed;
}
