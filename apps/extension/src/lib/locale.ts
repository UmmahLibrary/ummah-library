/**
 * UI localization (#208, ADR 0040) — extension mirror of the web/mobile i18n
 * config + runtime, collapsed into `lib/locale.ts` + `lib/locale-store.ts` to
 * match this app's flat `lib/` layout (compare `theme.ts`/`theme-store.ts`).
 * The interface language is separate from Quran/translation content.
 */
import { getPref, setPref } from "./storage";
import { readLocaleMirror, writeLocaleMirror } from "./locale-store";

export type Locale = "en" | "ur";

export interface LocaleMeta {
  code: Locale;
  /** Endonym — the language's own name, shown in the picker. */
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: readonly LocaleMeta[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
];

const DEFAULT_LOCALE: Locale = "en";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

export function localeDir(code: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}

/** Set `<html lang dir>` so the popup's own chrome mirrors for an RTL locale. */
export function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
}

/** Best-effort synchronous read for pre-paint. Falls back to the default. */
export function readLocaleSync(): Locale {
  const v = readLocaleMirror();
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Authoritative read from synced storage (follows the user across devices),
 *  falling back to the synchronous mirror, then the default. */
export async function getStoredLocale(): Promise<Locale> {
  const v = await getPref<string>("locale", readLocaleSync());
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Persist + apply: synced pref (cross-device) + the synchronous mirror. */
export async function setStoredLocale(locale: Locale): Promise<void> {
  applyLocale(locale);
  writeLocaleMirror(locale);
  await setPref("locale", locale);
}
