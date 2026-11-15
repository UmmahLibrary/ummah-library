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
import { webSettingsStore as store } from "./settings-store";
import { readLocale } from "../i18n/locale-store";

/** The edition fields the reader UI needs (a view over `Translation`). */
export type EditionChoice = Pick<Translation, "id" | "name" | "author" | "language" | "direction">;

export const EDITIONS_KEY = "ul.editions";
// fawazahmed0/quran-api slugs — the catalogue's id-space (ADR 0011).
export const DEFAULT_EDITIONS = ["eng-mustafakhattaba"];

/**
 * The translation shown when the reader hasn't chosen one yet (ADR 0041),
 * by language: the interface language first, then the browser's. These are
 * widely used, established translations; the first-run setup and the notice
 * above the first verse always let the reader pick another — or none.
 * Arabic readers read the Quran directly, so Arabic has no default.
 */
export const DEFAULT_TRANSLATION_BY_LANGUAGE: Readonly<Record<string, readonly string[]>> = {
  en: ["eng-mustafakhattaba"], // The Clear Quran — Mustafa Khattab
  ur: ["urd-fatehmuhammadja"], // Fateh Muhammad Jalandhry
  bn: ["ben-muhiuddinkhan"], // Muhiuddin Khan
  hi: ["hin-maulanaazizulha"], // Maulana Azizul Haque al-Umari
  id: ["ind-indonesianislam"], // Indonesian Ministry of Religious Affairs
  tr: ["tur-diyanetisleri"], // Diyanet İşleri
  ar: [],
};

/** The catalogue's language name for an interface/browser language code. */
export const CATALOGUE_LANGUAGE: Readonly<Record<string, string>> = {
  en: "English",
  ur: "Urdu",
  bn: "Bengali",
  hi: "Hindi",
  id: "Indonesian",
  tr: "Turkish",
  ar: "Arabic",
  fa: "Persian",
  ms: "Malay",
  fr: "French",
  ha: "Hausa",
  sw: "Swahili",
};

/** A BCP-47 code for an edition's language ("Urdu" or "ur" → "ur"), for `lang=`. */
export function editionLangCode(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const l = language.trim();
  if (/^[a-z]{2,3}$/i.test(l)) return l.toLowerCase();
  const hit = Object.entries(CATALOGUE_LANGUAGE).find(
    ([, name]) => name.toLowerCase() === l.toLowerCase(),
  );
  return hit?.[0];
}

/** Default editions for a language code; English when we have none for it. */
export function defaultEditionsFor(lang: string | undefined): string[] {
  const code = (lang ?? "").toLowerCase().split(/[-_]/)[0] ?? "";
  return [...(DEFAULT_TRANSLATION_BY_LANGUAGE[code] ?? DEFAULT_EDITIONS)];
}

/**
 * The default edition set for someone who hasn't chosen: the interface
 * language if it isn't English (a deliberate choice in the app), otherwise the
 * browser language. Always user-overridable — once they pick, that wins.
 */
export function defaultEditions(uiLocale?: string): string[] {
  if (uiLocale && uiLocale !== "en") return defaultEditionsFor(uiLocale);
  try {
    if (typeof navigator !== "undefined") return defaultEditionsFor(navigator.language);
  } catch {
    /* navigator unavailable — fall through */
  }
  return [...DEFAULT_EDITIONS];
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
