/**
 * @ummahlibrary/core
 *
 * The framework-agnostic domain core. This package must NEVER import a UI
 * framework (Next.js, Expo/React Native) or a database driver. It defines the
 * pure Quran domain model, structural utilities, and the ports (interfaces)
 * that adapters implement.
 *
 * See docs/adr/0001-modular-monolith.md for the boundary rules.
 */

export * from "./quran-structure";
export * from "./hifz";
export * from "./plugins";
export * from "./languages";
export * from "./translations";
export * from "./search";
export * from "./prayer";
export * from "./qibla";
export * from "./hijri";
export * from "./zakat";
export * from "./adhkar";
export * from "./reading-goals";
export type * from "./entities";
export type * from "./ports";
