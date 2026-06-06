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
// fawazahmed0/quran-api slugs — the catalogue's id-space (ADR 0011).
export const DEFAULT_EDITIONS = ["eng-mustafakhattaba"];
// Muhammad Junagarhi — shown by default to visitors with an Urdu browser locale.
const URDU_DEFAULT_EDITIONS = ["urd-muhammadjunagar"];

/** The single edition shown in the "Reading → Translations" view. */
export const READING_TR_KEY = "ul.readingTranslation";

/**
 * The default edition set for a first-time visitor, chosen by browser locale so
 * an Urdu speaker sees an Urdu translation without hunting for it. Always
 * user-overridable — once they pick, the stored set wins.
 */
export function defaultEditions(): string[] {
  try {
    if (typeof navigator !== "undefined" && /^ur\b/i.test(navigator.language ?? "")) {
      return URDU_DEFAULT_EDITIONS;
    }
  } catch {
    /* navigator unavailable — fall through */
  }
  return DEFAULT_EDITIONS;
}

export function readEditions(): string[] {
  try {
    const raw = localStorage.getItem(EDITIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : defaultEditions();
  } catch {
    return defaultEditions();
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
