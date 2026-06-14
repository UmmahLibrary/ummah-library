/**
 * Mobile theme provider.  Palette values and the Palette type come from
 * @ummahlibrary/ui (packages/ui) — the single source of truth for design
 * tokens across web and mobile.  This module owns only the platform-specific
 * concern: watching the OS colour scheme with react-native's Appearance API
 * and persisting the user's override to AsyncStorage.
 *
 * See ADR 0023 for the full cross-platform design-system architecture.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import {
  NoorThemeProvider,
  noorThemes,
  type Palette,
  type ThemeKey,
} from "@ummahlibrary/ui";
import { KEYS, getString, setString } from "./storage";

export type { Palette };

export type ThemeMode = "light" | "dark";

/** Map the binary light/dark OS preference to the two canonical Noor themes. */
const THEME_MAP: Record<ThemeMode, ThemeKey> = {
  dark: "obsidian",
  light: "ivory",
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Palette;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    Appearance.getColorScheme() === "light" ? "light" : "dark",
  );

  useEffect(() => {
    void getString(KEYS.theme).then((saved) => {
      if (saved === "light" || saved === "dark") setMode(saved);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: noorThemes[THEME_MAP[mode]],
      toggle: () =>
        setMode((m) => {
          const next = m === "dark" ? "light" : "dark";
          void setString(KEYS.theme, next);
          return next;
        }),
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NoorThemeProvider theme={value.colors}>{children}</NoorThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
