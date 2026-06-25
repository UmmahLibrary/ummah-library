"use client";

/**
 * Shared selected-tafsir state through the `SettingsStore` port (web adapter
 * `webSettingsStore`, ADR 0024) under `ul.tafsir`. `TafsirPicker` writes it and
 * dispatches a window event so every open `AyahTafsir` block re-fetches in the
 * new edition.
 */
import { webSettingsStore as store } from "./settings-store";
import { readTafsirCompare, writeTafsirCompare } from "./tafsir-compare-store";

export const TAFSIR_KEY = "ul.tafsir";
/** Broadcast when the side-by-side comparison set changes (#141). */
export const TAFSIR_COMPARE_KEY = "ul.tafsirCompare";

export async function readTafsir(fallback: string): Promise<string> {
  return (await store.read()).tafsir || fallback;
}

export async function writeTafsir(id: string): Promise<void> {
  await store.writeTafsir(id);
  window.dispatchEvent(new CustomEvent(TAFSIR_KEY, { detail: id }));
}

/** The tafsir editions to show side by side; `[]` means "just the primary one". */
export function readCompare(): string[] {
  return readTafsirCompare();
}

/** Persist the comparison set and notify every open tafsir panel to re-render. */
export function writeCompare(ids: string[]): void {
  writeTafsirCompare(ids);
  window.dispatchEvent(new CustomEvent(TAFSIR_COMPARE_KEY, { detail: ids }));
}
