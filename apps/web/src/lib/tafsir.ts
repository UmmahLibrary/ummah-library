"use client";

/**
 * Shared selected-tafsir state. The chosen edition lives in `localStorage`
 * under `ul.tafsir`; `TafsirPicker` writes it and dispatches a `ul:tafsir`
 * window event so every open `AyahTafsir` block re-fetches in the new edition.
 */
export const TAFSIR_KEY = "ul.tafsir";

export function readTafsir(fallback: string): string {
  try {
    return localStorage.getItem(TAFSIR_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function writeTafsir(id: string): void {
  try {
    localStorage.setItem(TAFSIR_KEY, id);
  } catch {
    /* storage unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(TAFSIR_KEY, { detail: id }));
}
