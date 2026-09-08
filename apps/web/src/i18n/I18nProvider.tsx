"use client";

/**
 * UI localization runtime (#208, ADR 0040). Holds the active locale (persisted in
 * `localStorage` under `ul.locale`), exposes a `t()` lookup with an English
 * fallback, and drives `<html lang>` + `<html dir>` so an RTL locale flips the
 * whole layout. Local-first: the choice lives on the device, no network.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale, localeDir } from "./config";
import { readLocale, writeLocale } from "./locale-store";
import { MESSAGES, type MessageKey } from "./messages";

/** Values substituted into a message's `{placeholder}` slots. */
export type MessageParams = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
}

/**
 * Fill `{name}` slots from `params`. Interpolation rather than concatenation is
 * what lets a translator move the pieces: "in 5 min" is `in {time}` in English
 * but puts the time first in Urdu, and no amount of joining strings in JSX can
 * express that. An unmatched slot is left verbatim so a missing param is visible
 * in the UI rather than silently blank.
 */
function interpolate(message: string, params?: MessageParams): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Restore the saved locale after mount (SSR renders the default).
  useEffect(() => {
    setLocaleState(readLocale());
  }, []);

  // Reflect the locale on the document so CSS + RTL mirroring apply app-wide.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    writeLocale(next);
  };

  const t = (key: MessageKey, params?: MessageParams): string =>
    interpolate(MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key, params);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** Convenience hook for components that only need the lookup. */
export function useT(): (key: MessageKey, params?: MessageParams) => string {
  return useI18n().t;
}
