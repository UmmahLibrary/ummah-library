/**
 * Local-first Hijri-date adjustment (ADR 0006 + 0014). The tabular calendar in
 * `core` can sit ±1 day from a local moon sighting / Umm al-Qura, so the user
 * can nudge it; the choice is stored on the device and broadcast so every
 * on-page Hijri date re-renders together.
 */

export const HIJRI_ADJUST_KEY = "ul.hijriAdjust";

/** Clamp to a sane range — a sighting is never more than a couple of days out. */
function clamp(n: number): number {
  return Math.max(-2, Math.min(2, n));
}

export function readHijriAdjust(): number {
  try {
    const raw = localStorage.getItem(HIJRI_ADJUST_KEY);
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(n) ? clamp(n) : 0;
  } catch {
    return 0;
  }
}

export function writeHijriAdjust(days: number): void {
  const value = clamp(days);
  try {
    localStorage.setItem(HIJRI_ADJUST_KEY, String(value));
  } catch {
    /* storage unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(HIJRI_ADJUST_KEY, { detail: value }));
}
