/**
 * Noor design system — platform-agnostic colour tokens. **The single source of
 * truth for every theme on every platform.**
 *
 * - **Web + extension** consume these as CSS custom properties via the generated
 *   `noor-themes.css` / `noor-tokens.css` (see `theme-css.ts`). Those files are
 *   **generated from this module — never hand-edit them**; run
 *   `pnpm --filter @ummahlibrary/ui build:themes` after changing a value, and a
 *   drift test (`theme-css.test.ts`) fails CI if the committed CSS is stale.
 * - **Mobile** consumes the JS objects directly via `NoorThemeProvider` /
 *   `useNoorTheme()`.
 *
 * Adding/changing a theme: edit `noorThemes` here and re-run the generator. Never
 * define palette colours in `apps/*` (ADR 0023, ADR 0027).
 */

/** Semantic colour contract used by every component on every platform. */
export interface Palette {
  // Backgrounds
  bg: string;
  bg2: string; // secondary background (subtle alt surface)
  bgElev: string; // card / sheet / elevated surface
  cardHi: string; // raised/hover card surface
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
  accentDim: string; // muted accent (dimmed/disabled)
  accentSoft: string; // translucent accent (badge backgrounds, etc.)
  accentGrad: string; // gradient string — use accent as solid fallback on RN
  ink: string; // text colour on top of the accent/gold surface
  // Mode
  scheme: "light" | "dark"; // CSS `color-scheme` for the theme
  // Semantic (no CSS var today — consumed on native)
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
    bg2: "#0e1017",
    bgElev: "#14171f",
    cardHi: "#191d27",
    border: "#242a38",
    borderSoft: "#1b2029",
    fg: "#f4f1ea",
    muted: "#9aa0b2",
    // Lightened from #5c6273 to clear WCAG-AA 4.5:1 for small faint labels on the
    // obsidian backgrounds (was ~2.94:1); nudged to #7f8593 so it also clears the
    // raised card surface. Every theme's faint/muted/accent/error is held to 4.5:1
    // on every surface by themes.test.ts (ADR 0041).
    faint: "#7f8593",
    accent: "#e6b855",
    accentHi: "#f4d58a",
    accentDim: "#a98432",
    accentSoft: "rgba(230,184,85,0.12)",
    accentGrad: "linear-gradient(180deg,#f4d58a,#e6b855)",
    ink: "#1a1404",
    scheme: "dark",
    error: "#ff8a7e",
  },
  midnight: {
    bg: "#000000",
    bg2: "#060608",
    bgElev: "#0c0d11",
    cardHi: "#14151b",
    border: "#262830",
    borderSoft: "#16171d",
    fg: "#ffffff",
    muted: "#b7bbc7",
    faint: "#7a7f8d",
    accent: "#f0c868",
    accentHi: "#ffe39a",
    accentDim: "#b9933f",
    accentSoft: "rgba(240,200,104,0.15)",
    accentGrad: "linear-gradient(180deg,#ffe39a,#f0c868)",
    ink: "#15100a",
    scheme: "dark",
    error: "#ff8a7e",
  },
  emerald: {
    bg: "#07140e",
    bg2: "#0a1a12",
    bgElev: "#0e2118",
    cardHi: "#13291e",
    border: "#1f3a2c",
    borderSoft: "#16281e",
    fg: "#eff4ee",
    muted: "#94ac9f",
    faint: "#719384",
    accent: "#e3b756",
    accentHi: "#f2d184",
    accentDim: "#a07e32",
    accentSoft: "rgba(227,183,86,0.13)",
    accentGrad: "linear-gradient(180deg,#f2d184,#e3b756)",
    ink: "#11200a",
    scheme: "dark",
    error: "#ff8a7e",
  },
  ocean: {
    bg: "#08121a",
    bg2: "#0c1822",
    bgElev: "#102230",
    cardHi: "#15293a",
    border: "#21384b",
    borderSoft: "#182838",
    fg: "#ecf2f6",
    muted: "#93a6b5",
    faint: "#7c91a3",
    accent: "#45c7bd",
    accentHi: "#74e2d9",
    accentDim: "#2c8a83",
    accentSoft: "rgba(69,199,189,0.14)",
    accentGrad: "linear-gradient(180deg,#74e2d9,#45c7bd)",
    ink: "#04201d",
    scheme: "dark",
    error: "#ff8a7e",
  },
  ivory: {
    bg: "#faf6ee",
    bg2: "#f3ecdd",
    bgElev: "#ffffff",
    cardHi: "#fbf6ec",
    border: "#e7decb",
    borderSoft: "#f0e9da",
    fg: "#1f1b12",
    muted: "#6e6757",
    faint: "#746952",
    accent: "#7b5c1d",
    accentHi: "#795d23",
    accentDim: "#cbb488",
    accentSoft: "rgba(123,92,29,0.1)",
    accentGrad: "linear-gradient(180deg,#8f6c24,#7a5b1c)",
    ink: "#fffaf0",
    scheme: "light",
    error: "#c0392b",
  },
  sepia: {
    bg: "#f3ead8",
    bg2: "#ece0c8",
    bgElev: "#fbf4e3",
    cardHi: "#f4ead3",
    border: "#decda8",
    borderSoft: "#eaddc0",
    fg: "#3a2e1b",
    muted: "#6e5c3f",
    faint: "#716143",
    accent: "#745415",
    accentHi: "#715622",
    accentDim: "#c8b07a",
    accentSoft: "rgba(116,84,21,0.1)",
    accentGrad: "linear-gradient(180deg,#8a6420,#745316)",
    ink: "#fff8ec",
    scheme: "light",
    error: "#b53629",
  },
  mint: {
    bg: "#f0f6f3",
    bg2: "#e4efea",
    bgElev: "#ffffff",
    cardHi: "#f2f8f5",
    border: "#d5e5dd",
    borderSoft: "#e6f0eb",
    fg: "#16241d",
    muted: "#5a6e64",
    faint: "#5a6f63",
    accent: "#0f6c63",
    accentHi: "#126c62",
    accentDim: "#7fb3a9",
    accentSoft: "rgba(15,108,99,0.1)",
    accentGrad: "linear-gradient(180deg,#167f74,#11776d)",
    ink: "#eafbf6",
    scheme: "light",
    error: "#c0392b",
  },
  rose: {
    bg: "#faf3f1",
    bg2: "#f1e5e2",
    bgElev: "#ffffff",
    cardHi: "#fbf1ee",
    border: "#ecd9d3",
    borderSoft: "#f4e6e2",
    fg: "#271a18",
    muted: "#6e5a56",
    faint: "#7c6159",
    accent: "#973f5c",
    accentHi: "#8f465e",
    accentDim: "#c99aa6",
    accentSoft: "rgba(151,63,92,0.1)",
    accentGrad: "linear-gradient(180deg,#ac4d6c,#9d4361)",
    ink: "#fff0f4",
    scheme: "light",
    error: "#bc382a",
  },
};
