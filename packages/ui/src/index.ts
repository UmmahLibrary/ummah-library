/** Join truthy class name fragments into a single string. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Design tokens — JS colour values for all Noor themes.
// Use these on mobile; the web consumes equivalent CSS custom properties.
export { noorThemes, type Palette, type ThemeKey } from "./themes";

// Theme context — lets Noor components read the active palette on native.
export { NoorThemeProvider, useNoorTheme } from "./NoorThemeContext";

// Noor primitives — platform files (.native.tsx) are resolved automatically
// by Metro for React Native; Next.js/webpack uses the .tsx (web) versions.
export { N } from "./tokens";
export { Icon } from "./Icon";
export type { IconName } from "./Icon";
export { Khatam } from "./Khatam";
export { Logo } from "./Logo";
export { Btn } from "./Btn";
export { Seg } from "./Seg";
