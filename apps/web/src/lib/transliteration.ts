/**
 * Shared "show per-āyah transliteration" state (#150): a reader toggle that
 * renders a Latin transliteration line under each āyah's Arabic.
 *
 * The transliteration text is one of the runtime-catalogue editions (ADR 0011) —
 * Tanzil's verbatim Latin transliteration, served through the same
 * `/api/v1/translations/:edition/...` path the reader already uses, so nothing
 * new is bundled. The on/off flag persists through the `SettingsStore` port and,
 * like editions, broadcasts a window event so the per-āyah components update live.
 */
import { webSettingsStore as store } from "./settings-store";

/** The catalogue edition id for the transliteration line — Tanzil (CC-BY 3.0). */
export const TRANSLIT_EDITION = "ara-quran-la";

/** Window event broadcast when the transliteration toggle changes. */
export const TRANSLIT_KEY = "ul.transliteration";

export async function readTransliteration(): Promise<boolean> {
  return (await store.read()).transliteration ?? false;
}

export async function writeTransliteration(on: boolean): Promise<void> {
  await store.writeTransliteration(on);
  window.dispatchEvent(new CustomEvent(TRANSLIT_KEY, { detail: on }));
}
