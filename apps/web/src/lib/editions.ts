/**
 * Shared translation-edition selection: the localStorage-backed set of editions
 * the reader shows, plus the single "Reading → Translations" choice.
 *
 * Translations are fetched from the runtime catalogue (ADR 0011) and rendered by
 * client components, so selection changes are broadcast as window events
 * (`ul.editions` / `ul.readingTranslation`) that those components listen for —
 * there is no longer a server-rendered set to toggle with CSS.
 */
import { type Translation, defaultTranslations } from "@ummahlibrary/core";
import { webSettingsStore as store } from "./settings-store";
import { readLocale } from "../i18n/locale-store";

/** The edition fields the reader UI needs (a view over `Translation`). */
export type EditionChoice = Pick<Translation, "id" | "name" | "author" | "language" | "direction">;

export const EDITIONS_KEY = "ul.editions";
// fawazahmed0/quran-api slugs — the catalogue's id-space (ADR 0011).
export const DEFAULT_EDITIONS = ["eng-mustafakhattaba"];

// The language → default-translation rule is shared with mobile (core, ADR 0041).
export {
  CATALOGUE_LANGUAGE,
  DEFAULT_TRANSLATION_BY_LANGUAGE,
  defaultTranslationsFor as defaultEditionsFor,
  editionLangCode,
} from "@ummahlibrary/core";

/**
 * The default edition set for someone who hasn't chosen: the interface
 * language if it isn't English (a deliberate choice in the app), otherwise the
 * browser language. Always user-overridable — once they pick, that wins.
 */
export function defaultEditions(uiLocale?: string): string[] {
  let device: string | undefined;
  try {
    device = typeof navigator !== "undefined" ? navigator.language : undefined;
  } catch {
    /* navigator unavailable */
  }
  return defaultTranslations(uiLocale, device);
}

/** True once the reader has picked translations (including "none"). */
export async function editionsChosen(): Promise<boolean> {
  const ed = (await store.read()).editions;
  return Array.isArray(ed) && ed.every((x) => typeof x === "string");
}

/** The single edition shown in the "Reading → Translations" view. */
export const READING_TR_KEY = "ul.readingTranslation";

export async function readEditions(): Promise<string[]> {
  const ed = (await store.read()).editions;
  // The contract is string[]; a corrupt or peer-synced ul.editions of any other
  // shape would make consumers crash on .map / new Set(), so fall back to defaults.
  return Array.isArray(ed) && ed.every((x) => typeof x === "string")
    ? ed
    : defaultEditions(readLocale());
}

export async function writeEditions(ids: string[]): Promise<void> {
  await store.writeEditions(ids);
  window.dispatchEvent(new CustomEvent(EDITIONS_KEY, { detail: ids }));
}

export async function readReadingTranslation(): Promise<string | null> {
  return (await store.read()).readingTranslation;
}

export async function writeReadingTranslation(id: string): Promise<void> {
  await store.writeReadingTranslation(id);
  window.dispatchEvent(new CustomEvent(READING_TR_KEY, { detail: id }));
}
