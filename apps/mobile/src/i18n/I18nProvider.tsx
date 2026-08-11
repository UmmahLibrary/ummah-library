/**
 * UI localization runtime (#208, ADR 0040) — mobile mirror of
 * `apps/web/src/i18n/I18nProvider.tsx`. Holds the active locale (persisted via
 * AsyncStorage under `ul.locale`), and exposes a `t()` lookup with an English
 * fallback. Local-first: the choice lives on the device, no network.
 *
 * Unlike the web provider, this does **not** flip the OS-level layout direction
 * (`I18nManager.forceRTL`) — that requires a full app restart on native and a
 * reload mechanism (`expo-updates`) this app doesn't yet depend on, so it's left
 * as a deliberate follow-up rather than shipped half-verified. `localeDir()` is
 * still exposed so a screen can apply `writingDirection: "rtl"` to the specific
 * text it renders in an RTL locale (the same per-element pattern already used
 * for Arabic, e.g. `SurahReaderScreen`'s `mushaf` style).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { readLocale, writeLocale } from "./locale-store";
import { MESSAGES, type MessageKey } from "./messages";

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    void readLocale().then(setLocaleState);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    void writeLocale(next);
  };

  const t = (key: MessageKey): string => MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** Convenience hook for components that only need the lookup. */
export function useT(): (key: MessageKey) => string {
  return useI18n().t;
}
