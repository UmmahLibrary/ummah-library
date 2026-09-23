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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { onSyncApplied } from "./lib/sync/sync-events";
import { ignoreStale } from "./utils";

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
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(
    Appearance.getColorScheme() === "light" ? "ivory" : "obsidian",
  );

  // Guards the same sync-reload-vs-local-write race this loop already found
  // and fixed in PrayerTrackerScreen/LibraryContext/SettingsContext: a sync
  // round (or app-foreground, which funnels through the same
  // `onSyncApplied` signal) can start `loadTheme()`'s read *before* a tap on
  // a theme swatch lands, then resolve *after* — silently reverting the
  // user's just-picked theme back to whatever was in storage when the
  // reload started. `setTheme` bumps this on every explicit choice; a
  // `loadTheme()` in flight when that happens discards its own result
  // instead of overwriting the newer local pick.
  const writeGen = useRef(0);

  const loadTheme = useCallback(async () => {
    const gen = writeGen.current;
    const currentGen = () => writeGen.current;
    const saved = await getString(KEYS.theme);
    if (!saved) return;
    const key = VALID.has(saved) ? (saved as ThemeKey) : LEGACY[saved];
    if (key) {
      ignoreStale(currentGen, gen, setThemeKey)(key);
      // Unlike the other legacy migrations in this codebase (tasbih-store,
      // sync-settings), a mapped legacy value was never written back — every
      // launch re-read "dark"/"light" and re-mapped it in memory, correct but
      // silently perpetuating the legacy value in storage (and in whatever a
      // sync round pushes) forever. Persist the migrated key once, same as
      // the others — gen-guarded too, so a stale migration write can't land
      // in storage *after* a newer `setTheme()` pick already wrote its own
      // (different, non-legacy) value there.
      if (!VALID.has(saved) && currentGen() === gen) void setString(KEYS.theme, key);
    }
  }, []);

  // Load on mount, and re-apply when a sync round pulls a theme from another device.
  useEffect(() => {
    void loadTheme();
    return onSyncApplied(() => void loadTheme());
  }, [loadTheme]);

  const setTheme = (key: ThemeKey) => {
    writeGen.current++;
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
