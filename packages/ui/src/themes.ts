/**
 * Noor design system — platform-agnostic colour tokens.
 *
 * These are the authoritative JS values behind the CSS custom properties in
 * apps/web/src/app/globals.css. Both the web (via CSS vars) and mobile (via
 * NoorThemeProvider) consume the same named themes from this single source.
 *
 * Extending a theme: add a row to `noorThemes` and a matching `[data-theme]`
 * block in globals.css. Never define palette colours in apps/* — point here.
 */

/** Semantic colour contract used by every component on every platform. */
export interface Palette {
  // Backgrounds
  bg: string;
  bgElev: string; // card / sheet / elevated surface
  // Borders
  border: string;
  borderSoft: string;
  // Text
  fg: string;
  muted: string;
  faint: string;
  // Accent (gold / primary)
  accent: string;
  accentHi: string; // lighter accent for hover / focus
  accentSoft: string; // translucent accent (badge backgrounds, etc.)
  accentGrad: string; // gradient string — use accent as solid fallback on RN
  ink: string; // text colour on top of the accent/gold surface
  // Semantic
  error: string;
}

export type ThemeKey =
  | "obsidian"
  | "midnight"
  | "emerald"
  | "ocean"
  | "ivory"
  | "sepia"
  | "mint"
  | "rose";

/** All Noor themes as resolved colour values (not CSS variables). */
export const noorThemes: Record<ThemeKey, Palette> = {
  obsidian: {
    bg: "#0a0b0f",
    bgElev: "#14171f",
    border: "#242a38",
    borderSoft: "#1b2029",
    fg: "#f4f1ea",
    muted: "#9aa0b2",
    faint: "#5c6273",
    accent: "#e6b855",
    accentHi: "#f4d58a",
    accentSoft: "rgba(230,184,85,0.12)",
    accentGrad: "linear-gradient(180deg,#f4d58a,#e6b855)",
    ink: "#1a1404",
    error: "#ff8a7e",
  },
  midnight: {
    bg: "#000000",
    bgElev: "#0c0d11",
    border: "#262830",
    borderSoft: "#16171d",
    fg: "#ffffff",
    muted: "#b7bbc7",
    faint: "#6b707d",
    accent: "#f0c868",
    accentHi: "#ffe39a",
    accentSoft: "rgba(240,200,104,0.15)",
    accentGrad: "linear-gradient(180deg,#ffe39a,#f0c868)",
    ink: "#15100a",
    error: "#ff8a7e",
  },
  emerald: {
    bg: "#07140e",
    bgElev: "#0e2118",
    border: "#1f3a2c",
    borderSoft: "#16281e",
    fg: "#eff4ee",
    muted: "#94ac9f",
    faint: "#557064",
    accent: "#e3b756",
    accentHi: "#f2d184",
    accentSoft: "rgba(227,183,86,0.13)",
    accentGrad: "linear-gradient(180deg,#f2d184,#e3b756)",
    ink: "#11200a",
    error: "#ff8a7e",
  },
  ocean: {
    bg: "#08121a",
    bgElev: "#102230",
    border: "#21384b",
    borderSoft: "#182838",
    fg: "#ecf2f6",
    muted: "#93a6b5",
    faint: "#556979",
    accent: "#45c7bd",
    accentHi: "#74e2d9",
    accentSoft: "rgba(69,199,189,0.14)",
    accentGrad: "linear-gradient(180deg,#74e2d9,#45c7bd)",
    ink: "#04201d",
    error: "#ff8a7e",
  },
  ivory: {
    bg: "#faf6ee",
    bgElev: "#ffffff",
    border: "#e7decb",
    borderSoft: "#f0e9da",
    fg: "#1f1b12",
    muted: "#6e6757",
    faint: "#a99e86",
    accent: "#b0842a",
    accentHi: "#c99a3a",
    accentSoft: "rgba(176,132,40,0.14)",
    accentGrad: "linear-gradient(180deg,#f4d58a,#e6b855)",
    ink: "#2a1f08",
    error: "#c0392b",
  },
  sepia: {
    bg: "#f3ead8",
    bgElev: "#fbf4e3",
    border: "#decda8",
    borderSoft: "#eaddc0",
    fg: "#3a2e1b",
    muted: "#6e5c3f",
    faint: "#a0895f",
    accent: "#a6781e",
    accentHi: "#c2933a",
    accentSoft: "rgba(166,120,30,0.16)",
    accentGrad: "linear-gradient(180deg,#e7c572,#c99a3a)",
    ink: "#2a1e08",
    error: "#c0392b",
  },
  mint: {
    bg: "#f0f6f3",
    bgElev: "#ffffff",
    border: "#d5e5dd",
    borderSoft: "#e6f0eb",
    fg: "#16241d",
    muted: "#5a6e64",
    faint: "#93a89c",
    accent: "#13857a",
    accentHi: "#1ba192",
    accentSoft: "rgba(19,133,122,0.13)",
    accentGrad: "linear-gradient(180deg,#2fb3a4,#13857a)",
    ink: "#eafbf6",
    error: "#c0392b",
  },
  rose: {
    bg: "#faf3f1",
    bgElev: "#ffffff",
    border: "#ecd9d3",
    borderSoft: "#f4e6e2",
    fg: "#271a18",
    muted: "#6e5a56",
    faint: "#ae968f",
    accent: "#b14a6b",
    accentHi: "#c76283",
    accentSoft: "rgba(177,74,107,0.12)",
    accentGrad: "linear-gradient(180deg,#ce6e8c,#b14a6b)",
    ink: "#fff0f4",
    error: "#c0392b",
  },
};
