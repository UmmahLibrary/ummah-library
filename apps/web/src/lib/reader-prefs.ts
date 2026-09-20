/**
 * The reader's inline display preferences — reciter, font scale, reading mode —
 * persisted through the `SettingsStore` port (web adapter `webSettingsStore`,
 * ADR 0024) instead of direct `localStorage` in the reader components.
 *
 * Note: the `data-reading-mode` bootstrap in `layout.tsx` still reads
 * `localStorage` synchronously before paint (FOUC prevention) — the one place
 * that can't go through an async store, the same exception theme bootstrap uses.
 */
import { webSettingsStore as store } from "./settings-store";

/** Fired whenever the font scale changes, so open views can re-read live (e.g. a sync-applied change). */
export const SCALE_EVENT = "ul.scale";

export async function readReciter(): Promise<string | null> {
  return (await store.read()).reciter;
}
export function writeReciter(id: string): Promise<void> {
  return store.writeReciter(id);
}

export async function readScale(): Promise<number> {
  return (await store.read()).scale ?? 1;
}
export async function writeScale(scale: number): Promise<void> {
  await store.writeScale(scale);
  try {
    window.dispatchEvent(new CustomEvent(SCALE_EVENT));
  } catch {
    /* non-browser */
  }
}

export function writeReadingMode(mode: string): Promise<void> {
  return store.writeReadingMode(mode);
}
