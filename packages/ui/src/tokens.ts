/**
 * Noor design tokens for use in component inline styles. Each maps to the CSS
 * theme variable (defined per `[data-theme]` in globals.css) so components follow
 * the active theme. Because these are `var(--…)` references, apply them through
 * CSS (style/`currentColor`) — they will not resolve as raw SVG presentation
 * attributes.
 */
export const N = {
  bg: "var(--noor-bg)",
  bg2: "var(--noor-bg2)",
  card: "var(--noor-card)",
  cardHi: "var(--noor-card-hi)",
  border: "var(--noor-border)",
  borderSoft: "var(--noor-border-soft)",
  fg: "var(--noor-fg)",
  muted: "var(--noor-muted)",
  faint: "var(--noor-faint)",
  gold: "var(--noor-gold)",
  goldHi: "var(--noor-gold-hi)",
  goldDim: "var(--noor-gold-dim)",
  goldSoft: "var(--noor-gold-soft)",
  goldGrad: "var(--noor-gold-grad)",
  /** Destructive / error text, readable on every theme. */
  error: "var(--noor-error)",
  ink: "var(--noor-ink)",
  ui: "var(--noor-ui)",
  ar: "var(--noor-ar)",
} as const;

/**
 * Fixed status hues (hadith grades and the like). Raw, they wash out on the
 * light themes (ṣaḥīḥ green was 2:1 on Ivory) — render them as text through
 * {@link readableHue}.
 */
export const STATUS_HUES = {
  good: "#5BBF8A",
  fair: "#E6B855",
  weak: "#C98A57",
  neutral: "#8A93A6",
  alert: "#C56A52",
  blue: "#4F90FF",
  violet: "#B677EE",
} as const;

/** How much of the hue survives the blend toward the theme's foreground colour. */
export const READABLE_HUE_MIX = { light: 30, dark: 75 } as const;

/** `pct`% of `hex` blended into `base` (both `#rrggbb`) — the sRGB `color-mix`. */
function blendHex(hex: string, base: string, pct: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round((ch(hex, i) * pct + ch(base, i) * (100 - pct)) / 100))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * The native counterpart of {@link readableHue}: the same blend, resolved
 * against a concrete palette (React Native has no CSS variables).
 */
export function readableHueFor(
  hex: string,
  palette: { fg: string; scheme: "light" | "dark" },
): string {
  return blendHex(hex, palette.fg, READABLE_HUE_MIX[palette.scheme]);
}

/**
 * A status hue as text readable at 4.5:1 on every Noor surface: blended toward
 * the theme's foreground (`--noor-fg`), much more on light themes. Relies on the
 * `color-scheme` each theme sets (`light-dark()`).
 */
export function readableHue(hex: string): string {
  const { light, dark } = READABLE_HUE_MIX;
  return `light-dark(color-mix(in srgb, ${hex} ${light}%, var(--noor-fg)), color-mix(in srgb, ${hex} ${dark}%, var(--noor-fg)))`;
}
