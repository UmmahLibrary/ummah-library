/** Join truthy class name fragments into a single string. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Design tokens — JS colour values for all Noor themes.
// Use these on mobile; the web consumes equivalent CSS custom properties.
export { noorThemes, type Palette, type ThemeKey } from "./themes";

// Scale tokens (ADR 0042) — type, spacing, radius, elevation, motion, icon and
// touch-target sizes. Numbers for native; `sp`/`rad`/`text`/`shadow` give web
// inline styles the matching CSS custom properties.
export {
  space,
  radius,
  type,
  quranType,
  scriptLeading,
  scriptLineHeight,
  iconSize,
  target,
  motion,
  elevation,
  nativeText,
  nativeShadow,
  control,
  segment,
  type SpaceStep,
  type RadiusStep,
  type TypeRole,
  type TypeStyle,
  type QuranRole,
  type Script,
  type ElevationLevel,
} from "./scale";
export { sp, rad, text, shadow } from "./scale-css";

// Theme context — lets Noor components read the active palette on native.
export { NoorThemeProvider, useNoorTheme } from "./NoorThemeContext";

// Noor primitives — platform files (.native.tsx) are resolved automatically
// by Metro for React Native; Next.js/webpack uses the .tsx (web) versions.
export { N, READABLE_HUE_MIX, STATUS_HUES, readableHue, readableHueFor } from "./tokens";
export { Icon } from "./Icon";
export type { IconName } from "./Icon";
export { Khatam } from "./Khatam";
export { Logo } from "./Logo";
export { Btn } from "./Btn";
export { Seg } from "./Seg";

// Shared parts (ADR 0042): same anatomy, sizes and names on web and mobile.
export { Text, type TextProps, type TextTone } from "./Text";
export { Card, type CardProps, type CardTone } from "./Card";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader";
export { ListRow, type ListRowProps, type ListRowSurface } from "./ListRow";
export { NumberBadge, type NumberBadgeProps } from "./NumberBadge";
export { Chip, type ChipProps } from "./Chip";
export { Stepper, type StepperProps } from "./Stepper";
export { AyahBlock, type AyahBlockProps, type AyahTranslation } from "./AyahBlock";
export { NATIVE_FONT, nativeFamily } from "./native-fonts";
