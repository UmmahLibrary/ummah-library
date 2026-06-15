/**
 * Local-first Ramaḍān tracking (ADR 0006): which of the 30 fasts you've kept
 * (`ul.ramadanFasts`) and today's worship checklist (`ul.ramadanWorship`, keyed
 * by date). All in `localStorage`; a window event lets the page re-render.
 * Mirrors the mobile Ramadan screen's storage.
 */

export const RAMADAN_EVENT = "ul.ramadan";
const FASTS_KEY = "ul.ramadanFasts";
const WORSHIP_KEY = "ul.ramadanWorship";

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
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
  try {
    window.dispatchEvent(new CustomEvent(RAMADAN_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readFasts(): Record<number, true> {
  return get<Record<number, true>>(FASTS_KEY, {});
}

export function toggleFast(day: number): Record<number, true> {
  const next = { ...readFasts() };
  if (next[day]) delete next[day];
  else next[day] = true;
  set(FASTS_KEY, next);
  return next;
}

export function readWorship(date: string): Record<string, true> {
  return get<Record<string, Record<string, true>>>(WORSHIP_KEY, {})[date] ?? {};
}

export function toggleWorship(date: string, key: string): Record<string, true> {
  const all = get<Record<string, Record<string, true>>>(WORSHIP_KEY, {});
  const day = { ...(all[date] ?? {}) };
  if (day[key]) delete day[key];
  else day[key] = true;
  set(WORSHIP_KEY, { ...all, [date]: day });
  return day;
}
