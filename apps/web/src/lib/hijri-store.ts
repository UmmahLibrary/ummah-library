/**
 * Web persistence for the Hijri-date adjustment (ADR 0024), under
 * `ul.hijriAdjust`. Sync; the `*-store` file is the sanctioned `localStorage`
 * home. Clamping and the change event live in `./hijri`.
 */
const KEY = "ul.hijriAdjust";

export function readAdjustRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeAdjustRaw(value: number): void {
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    /* storage unavailable */
  }
}
