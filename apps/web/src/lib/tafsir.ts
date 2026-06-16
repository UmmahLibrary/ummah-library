"use client";

/**
 * Shared selected-tafsir state through the `SettingsStore` port (web adapter
 * `webSettingsStore`, ADR 0024) under `ul.tafsir`. `TafsirPicker` writes it and
 * dispatches a window event so every open `AyahTafsir` block re-fetches in the
 * new edition.
 */
import { webSettingsStore as store } from "./settings-store";

export const TAFSIR_KEY = "ul.tafsir";

export async function readTafsir(fallback: string): Promise<string> {
  return (await store.read()).tafsir || fallback;
}

export async function writeTafsir(id: string): Promise<void> {
  await store.writeTafsir(id);
  window.dispatchEvent(new CustomEvent(TAFSIR_KEY, { detail: id }));
}
