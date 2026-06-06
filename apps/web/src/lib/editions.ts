/**
 * Shared translation-edition selection: the localStorage-backed set of editions
 * the reader shows, plus the single "Reading → Translations" choice.
 *
 * Translations are fetched from the runtime catalogue (ADR 0011) and rendered by
 * client components, so selection changes are broadcast as window events
 * (`ul.editions` / `ul.readingTranslation`) that those components listen for —
 * there is no longer a server-rendered set to toggle with CSS.
 */
import type { Translation } from "@ummahlibrary/core";

/** The edition fields the reader UI needs (a view over `Translation`). */
export type EditionChoice = Pick<Translation, "id" | "name" | "author" | "language" | "direction">;

export const EDITIONS_KEY = "ul.editions";
// A fawazahmed0/quran-api slug — the catalogue's id-space (ADR 0011).
export const DEFAULT_EDITIONS = ["eng-mustafakhattaba"];

/** The single edition shown in the "Reading → Translations" view. */
export const READING_TR_KEY = "ul.readingTranslation";

export function readEditions(): string[] {
  try {
    const raw = localStorage.getItem(EDITIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_EDITIONS;
  } catch {
    return DEFAULT_EDITIONS;
  }
}

export function writeEditions(ids: string[]): void {
  try {
    localStorage.setItem(EDITIONS_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(EDITIONS_KEY, { detail: ids }));
}

export function readReadingTranslation(): string | null {
  try {
    return localStorage.getItem(READING_TR_KEY);
  } catch {
    return null;
  }
}

export function writeReadingTranslation(id: string): void {
  try {
    localStorage.setItem(READING_TR_KEY, id);
  } catch {
    /* storage unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(READING_TR_KEY, { detail: id }));
}
