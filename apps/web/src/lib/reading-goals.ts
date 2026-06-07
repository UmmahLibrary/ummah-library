/**
 * Local-first reading habit state (ADR 0006): a daily goal, an activity log
 * (which days you read — drives the streak), per-day Mushaf pages read (drives
 * the daily goal), and an optional khatma plan. All in `localStorage`; the
 * computation lives in `@ummahlibrary/core`. A window event lets the home badge
 * and the goals page re-render together.
 */

import type { KhatmaPlan } from "@ummahlibrary/core";

export const READING_EVENT = "ul.reading";
const GOAL_KEY = "ul.readingGoal"; // { target: number } pages/day
const ACTIVE_KEY = "ul.readingActive"; // string[] of YYYY-MM-DD with any reading
const PAGES_KEY = "ul.readingPages"; // { date: "YYYY-MM-DD", pages: number[] } today's distinct mushaf pages
const LOG_KEY = "ul.readingLog"; // { "YYYY-MM-DD": number } pages read that day
const KHATMA_KEY = "ul.khatma"; // KhatmaPlan | (absent)

export const DEFAULT_GOAL = 4;

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

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
}
function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(READING_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readGoal(): number {
  return get<{ target: number }>(GOAL_KEY, { target: DEFAULT_GOAL }).target;
}
export function writeGoal(target: number): void {
  set(GOAL_KEY, { target: Math.max(1, Math.floor(target) || DEFAULT_GOAL) });
  emit();
}

/** Dates (YYYY-MM-DD) with any reading activity — pruned to the last ~400. */
export function activeDates(): string[] {
  return get<string[]>(ACTIVE_KEY, []);
}
export function readingLog(): Record<string, number> {
  return get<Record<string, number>>(LOG_KEY, {});
}
export function pagesToday(): number {
  return readingLog()[today()] ?? 0;
}

/** Record that the reader was opened today (keeps the streak alive). */
export function markActivity(): void {
  const t = today();
  const dates = activeDates();
  if (!dates.includes(t)) {
    dates.push(t);
    set(ACTIVE_KEY, dates.slice(-400));
    emit();
  }
}

/**
 * Record a Mushaf page as read today (de-duplicated), updating the daily page
 * count and advancing the khatma cursor. Also marks activity.
 */
export function recordMushafPage(page: number): void {
  markActivity();
  const t = today();
  const seen = get<{ date: string; pages: number[] }>(PAGES_KEY, { date: t, pages: [] });
  const pages = seen.date === t ? seen.pages : [];
  if (!pages.includes(page)) {
    pages.push(page);
    set(PAGES_KEY, { date: t, pages });
    const log = readingLog();
    log[t] = pages.length;
    set(LOG_KEY, log);
  }
  const plan = readKhatma();
  if (plan && page > plan.currentPage) writeKhatma({ ...plan, currentPage: page });
  emit();
}

export function readKhatma(): KhatmaPlan | null {
  return get<KhatmaPlan | null>(KHATMA_KEY, null);
}
export function writeKhatma(plan: KhatmaPlan): void {
  set(KHATMA_KEY, plan);
  emit();
}
export function clearKhatma(): void {
  try {
    localStorage.removeItem(KHATMA_KEY);
  } catch {
    /* ignore */
  }
  emit();
}
