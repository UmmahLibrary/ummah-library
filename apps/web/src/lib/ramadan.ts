/**
 * Local-first Ramaḍān tracking (ADR 0006): which of the 30 fasts you've kept and
 * the per-date worship checklist. Persistence goes through the `./ramadan-store`
 * adapter (ADR 0024); a window event lets the page re-render. Mirrors the mobile
 * Ramadan screen's storage.
 */
import { migrateRamadanFasts, toggleRamadanFast } from "@ummahlibrary/core";
import { readFastsRaw, readWorshipRaw, writeFastsRaw, writeWorshipRaw } from "./ramadan-store";

export const RAMADAN_EVENT = "ul.ramadan";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(RAMADAN_EVENT));
  } catch {
    /* non-browser */
  }
}

/**
 * Kept fasts keyed `"<hijriYear>:<day>"`; year-less legacy entries are read as
 * `legacyYear`'s (see `migrateRamadanFasts`).
 */
export function readFasts(legacyYear: number): Record<string, true> {
  return migrateRamadanFasts(readFastsRaw(), legacyYear);
}

export function toggleFast(year: number, day: number, legacyYear = year): Record<string, true> {
  const next = toggleRamadanFast(readFasts(legacyYear), year, day);
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
