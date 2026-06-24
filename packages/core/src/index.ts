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
export * from "./hifz-analytics";
export * from "./plugins";
export * from "./languages";
export * from "./translations";
export * from "./search";
export * from "./hadith";
export * from "./prayer";
export * from "./prayer-tracker";
export * from "./qada";
export * from "./haid";
export * from "./fasting-qada";
export * from "./achievements";
export * from "./qibla";
export * from "./geo";
export * from "./hijri";
export * from "./islamic-events";
export * from "./sunnah-fasting";
export * from "./zakat";
export * from "./adhkar";
export * from "./privacy";
export * from "./duas";
export * from "./reading-goals";
export * from "./reading-plans";
export * from "./reminders";
export * from "./backup";
export * from "./sync";
export * from "./sync-engine";
export * from "./sync-keys";
export * from "./sync-shapes";
export * from "./collections";
export * from "./tasbih";
export * from "./audio";
export * from "./peek";
export type * from "./entities";
export type * from "./ports";
