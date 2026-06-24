/**
 * Web persistence for Ramaḍān tracking (ADR 0024): kept fasts (`ul.ramadanFasts`)
 * and the per-date worship checklist (`ul.ramadanWorship`). Sync; the `*-store`
 * file is the sanctioned `localStorage` home. The toggle logic and the change
 * event live in `./ramadan`.
 */
const FASTS_KEY = "ul.ramadanFasts";
const WORSHIP_KEY = "ul.ramadanWorship";

const isRecord = (v: unknown): boolean => v !== null && typeof v === "object" && !Array.isArray(v);

function get<T>(key: string, fallback: T, isValid?: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as unknown;
    return isValid && !isValid(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function readFastsRaw(): Record<number, true> {
  return get<Record<number, true>>(FASTS_KEY, {}, isRecord);
}

export function writeFastsRaw(value: Record<number, true>): void {
  set(FASTS_KEY, value);
}

export function readWorshipRaw(): Record<string, Record<string, true>> {
  return get<Record<string, Record<string, true>>>(WORSHIP_KEY, {}, isRecord);
}

export function writeWorshipRaw(value: Record<string, Record<string, true>>): void {
  set(WORSHIP_KEY, value);
}
