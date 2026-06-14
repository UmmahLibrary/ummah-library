/**
 * Mobile theme provider.  Palette values and the Palette type come from
 * @ummahlibrary/ui (packages/ui) — the single source of truth for design
 * tokens across web and mobile.  This module owns the platform-specific concern:
 * watching the OS colour scheme, persisting the chosen Noor theme to AsyncStorage,
 * and exposing the eight themes for the Settings picker.
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

export type { Palette, ThemeKey };

export type ThemeMode = "light" | "dark";

/** The eight Noor themes, in picker order (matches the design + web). */
export const THEMES: { key: ThemeKey; label: string; mode: ThemeMode }[] = [
  { key: "obsidian", label: "Obsidian", mode: "dark" },
  { key: "midnight", label: "Midnight", mode: "dark" },
  { key: "emerald", label: "Emerald", mode: "dark" },
  { key: "ocean", label: "Ocean", mode: "dark" },
  { key: "ivory", label: "Ivory", mode: "light" },
  { key: "sepia", label: "Sepia", mode: "light" },
  { key: "mint", label: "Mint", mode: "light" },
  { key: "rose", label: "Rose", mode: "light" },
];

const MODE_OF = Object.fromEntries(THEMES.map((t) => [t.key, t.mode])) as Record<ThemeKey, ThemeMode>;
const VALID = new Set<string>(THEMES.map((t) => t.key));
/** Legacy stored values from before per-theme selection. */
const LEGACY: Record<string, ThemeKey> = { dark: "obsidian", light: "ivory" };

interface ThemeContextValue {
  themeKey: ThemeKey;
  mode: ThemeMode;
  colors: Palette;
  setTheme: (key: ThemeKey) => void;
  /** Flip between the default dark and light themes (top-bar style toggle). */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(
    Appearance.getColorScheme() === "light" ? "ivory" : "obsidian",
  );

  useEffect(() => {
    void getString(KEYS.theme).then((saved) => {
      if (!saved) return;
      const key = VALID.has(saved) ? (saved as ThemeKey) : LEGACY[saved];
      if (key) setThemeKey(key);
    });
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    void setString(KEYS.theme, key);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const mode = MODE_OF[themeKey];
    return {
      themeKey,
      mode,
      colors: noorThemes[themeKey],
      setTheme,
      toggle: () => setTheme(mode === "dark" ? "ivory" : "obsidian"),
    };
  }, [themeKey]);

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
