/**
 * Light/dark theming. A palette of semantic colour tokens (mirroring the web
 * reader's CSS variables) is provided through context; screens read it with
 * `useTheme()` and build their styles from `colors`. The chosen mode persists
 * to `ul.theme`, defaulting to the OS colour scheme on first run.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance } from "react-native";
import { KEYS, getString, setString } from "./storage";

export type ThemeMode = "light" | "dark";

export interface Palette {
  bg: string;
  bgElev: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  error: string;
}

const DARK: Palette = {
  bg: "#0b0f0e",
  bgElev: "#16241d",
  border: "#1f2a27",
  fg: "#e7efe9",
  muted: "#9fb3a6",
  accent: "#3fae7d",
  accentSoft: "#13261d",
  error: "#ff8a7e",
};

const LIGHT: Palette = {
  bg: "#ffffff",
  bgElev: "#f2f6f3",
  border: "#e3e9e5",
  fg: "#14201b",
  muted: "#5c6b63",
  accent: "#2f9e6f",
  accentSoft: "#e6f4ed",
  error: "#c0392b",
};

export const PALETTES: Record<ThemeMode, Palette> = { light: LIGHT, dark: DARK };

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
      colors: PALETTES[mode],
      toggle: () =>
        setMode((m) => {
          const next = m === "dark" ? "light" : "dark";
          void setString(KEYS.theme, next);
          return next;
        }),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
