"use client";

/**
 * UI localization runtime (#208, ADR 0040). Holds the active locale (persisted in
 * `localStorage` under `ul.locale`), exposes a `t()` lookup with an English
 * fallback, and drives `<html lang>` + `<html dir>` so an RTL locale flips the
 * whole layout. Local-first: the choice lives on the device, no network.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale, localeDir } from "./config";
import { type FmtVars, fmt, formatNumber } from "./format";
import { readLocale, writeLocale } from "./locale-store";
import { MESSAGES, type MessageKey } from "./messages";

interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function lookup(locale: Locale, key: MessageKey): string {
  return MESSAGES[locale]?.[key] || MESSAGES.en[key] || key;
}

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

  const t = (key: MessageKey): string => lookup(locale, key);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** The active locale, or English outside the provider (never throws). */
export function useLocale(): { locale: Locale } {
  const ctx = useContext(I18nContext);
  return { locale: ctx?.locale ?? DEFAULT_LOCALE };
}

/** Convenience hook for components that only need the lookup. English outside
 *  the provider (never throws), so isolated component tests keep working. */
export function useT(): (key: MessageKey) => string {
  const ctx = useContext(I18nContext);
  return ctx?.t ?? ((key: MessageKey) => lookup(DEFAULT_LOCALE, key));
}

export interface Intl18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: MessageKey) => string;
  /** `t()` + `{placeholder}` interpolation; numeric values use the locale's digits. */
  tf: (key: MessageKey, vars: FmtVars) => string;
  /** A count in the locale's digits. */
  num: (n: number) => string;
}

/** Lookup + interpolation + localized numerals. English outside the provider. */
export function useIntl(): Intl18n {
  const ctx = useContext(I18nContext);
  const locale = ctx?.locale ?? DEFAULT_LOCALE;
  const t = ctx?.t ?? ((key: MessageKey) => lookup(DEFAULT_LOCALE, key));
  return {
    locale,
    dir: localeDir(locale),
    t,
    tf: (key, vars) => fmt(t(key), vars, locale),
    num: (n) => formatNumber(n, locale),
  };
}

/**
 * Set the browser tab title in the interface language. Page metadata is built
 * in English at build time; this replaces it once the reader's locale is known
 * and again whenever it changes. The brand name stays as it is.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const want = `${title} · Ummah Library`;
    const apply = () => {
      if (document.title !== want) document.title = want;
    };
    // Next.js re-asserts its build-time <title> after hydration and on
    // navigation (and React may render that element in <body>, not <head>), so
    // watch the title element itself and put the translated text back.
    const observer = new MutationObserver(apply);
    const watch = () => {
      observer.disconnect();
      document
        .querySelectorAll("title")
        .forEach((el) =>
          observer.observe(el, { childList: true, subtree: true, characterData: true }),
        );
    };
    apply();
    watch();
    // A new <title> element can appear on client navigation; re-attach then.
    const t = window.setInterval(() => {
      watch();
      apply();
    }, 1000);
    return () => {
      observer.disconnect();
      window.clearInterval(t);
    };
  }, [title]);
}
