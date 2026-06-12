/**
 * The eight Noor theme palettes and the small amount of logic for selecting,
 * resolving and persisting them. The palettes themselves live in globals.css as
 * `[data-theme="…"]` blocks; here we only track which one is active.
 */

export type ThemeMode = "dark" | "light";

export type ThemeKey =
  | "obsidian"
  | "midnight"
  | "emerald"
  | "ocean"
  | "ivory"
  | "sepia"
  | "mint"
  | "rose";

export interface ThemeMeta {
  key: ThemeKey;
  label: string;
  mode: ThemeMode;
  desc: string;
  /** [background, accent] preview colours for the picker swatch. */
  swatch: [string, string];
}

/** Display order: dark palettes first, then light. */
export const THEMES: ThemeMeta[] = [
  {
    key: "obsidian",
    label: "Obsidian",
    mode: "dark",
    desc: "Charcoal & gold",
    swatch: ["#0a0b0f", "#e6b855"],
  },
  {
    key: "midnight",
    label: "Midnight",
    mode: "dark",
    desc: "True-black, high contrast",
    swatch: ["#000000", "#f0c868"],
  },
  {
    key: "emerald",
    label: "Emerald",
    mode: "dark",
    desc: "Deep green & gold",
    swatch: ["#07140e", "#e3b756"],
  },
  {
    key: "ocean",
    label: "Ocean",
    mode: "dark",
    desc: "Slate & teal",
    swatch: ["#08121a", "#45c7bd"],
  },
  {
    key: "ivory",
    label: "Ivory",
    mode: "light",
    desc: "Warm paper & gold",
    swatch: ["#faf6ee", "#b0842a"],
  },
  {
    key: "sepia",
    label: "Sepia",
    mode: "light",
    desc: "Parchment & amber",
    swatch: ["#f3ead8", "#a6781e"],
  },
  {
    key: "mint",
    label: "Mint",
    mode: "light",
    desc: "Cool light & teal",
    swatch: ["#f0f6f3", "#13857a"],
  },
  {
    key: "rose",
    label: "Rose",
    mode: "light",
    desc: "Soft light & rose",
    swatch: ["#faf3f1", "#b14a6b"],
  },
];

export const DEFAULT_DARK: ThemeKey = "obsidian";
export const DEFAULT_LIGHT: ThemeKey = "ivory";

/** localStorage key holding the active theme. */
export const THEME_STORAGE_KEY = "ul.theme";

const BY_KEY = new Map<string, ThemeMeta>(THEMES.map((t) => [t.key, t]));
const LEGACY: Record<string, ThemeKey> = { dark: DEFAULT_DARK, light: DEFAULT_LIGHT };

/** Resolve any stored/attribute value (incl. the legacy "dark"/"light") to a real key. */
export function normalizeTheme(value: string | null | undefined): ThemeKey {
  if (!value) return DEFAULT_DARK;
  if (BY_KEY.has(value)) return value as ThemeKey;
  return LEGACY[value] ?? DEFAULT_DARK;
}

export function themeMode(key: ThemeKey): ThemeMode {
  return BY_KEY.get(key)?.mode ?? "dark";
}

/** The theme last used in a given mode, or that mode's default. */
export function lastThemeForMode(mode: ThemeMode): ThemeKey {
  const fallback = mode === "dark" ? DEFAULT_DARK : DEFAULT_LIGHT;
  if (typeof localStorage === "undefined") return fallback;
  const stored = localStorage.getItem(mode === "dark" ? "ul.lastDark" : "ul.lastLight");
  const key = stored ? normalizeTheme(stored) : null;
  return key && themeMode(key) === mode ? key : fallback;
}

/** Apply a theme to <html> and persist it (client only). */
export function applyTheme(key: ThemeKey): void {
  const mode = themeMode(key);
  const root = document.documentElement;
  root.dataset.theme = key;
  root.dataset.mode = mode;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, key);
    localStorage.setItem(mode === "dark" ? "ul.lastDark" : "ul.lastLight", key);
  } catch {
    /* ignore */
  }
}
