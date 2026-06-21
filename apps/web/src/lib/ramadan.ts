/**
 * Local-first Ramaḍān tracking (ADR 0006): which of the 30 fasts you've kept and
 * the per-date worship checklist. Persistence goes through the `./ramadan-store`
 * adapter (ADR 0024); a window event lets the page re-render. Mirrors the mobile
 * Ramadan screen's storage.
 */
import {
  readFastsRaw,
  readWorshipRaw,
  writeFastsRaw,
  writeWorshipRaw,
} from "./ramadan-store";

export const RAMADAN_EVENT = "ul.ramadan";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(RAMADAN_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readFasts(): Record<number, true> {
  return readFastsRaw();
}

export function toggleFast(day: number): Record<number, true> {
  const next = { ...readFastsRaw() };
  if (next[day]) delete next[day];
  else next[day] = true;
  writeFastsRaw(next);
  emit();
  return next;
}

export function readWorship(date: string): Record<string, true> {
  return readWorshipRaw()[date] ?? {};
}

export function toggleWorship(date: string, key: string): Record<string, true> {
  const all = readWorshipRaw();
  const day = { ...(all[date] ?? {}) };
  if (day[key]) delete day[key];
  else day[key] = true;
  writeWorshipRaw({ ...all, [date]: day });
  emit();
  return day;
}
