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
  ink: "var(--noor-ink)",
  ui: "var(--noor-ui)",
  ar: "var(--noor-ar)",
} as const;
