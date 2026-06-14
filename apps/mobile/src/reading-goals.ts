/**
 * Local-first reading-habit state (ADR 0006): a daily page goal, an activity log
 * (drives the streak), today's distinct Mushaf pages (drives the daily goal),
 * a per-day page count, and an optional khatma plan. Mirrors the web reader's
 * `ul.reading*` / `ul.khatma` keys; the maths lives in `@ummahlibrary/core`.
 */
import type { KhatmaPlan } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";
import { localISODate } from "./utils";

export const DEFAULT_GOAL = 4;

export const todayStr = (d = new Date()): string => localISODate(d);

export interface ReadingState {
  goal: number;
  log: Record<string, number>;
  active: string[];
  khatma: KhatmaPlan | null;
  pagesToday: number;
}

export async function readReadingState(): Promise<ReadingState> {
  const [goalObj, log, active, khatma] = await Promise.all([
    getJSON<{ target: number }>(KEYS.readingGoal, { target: DEFAULT_GOAL }),
    getJSON<Record<string, number>>(KEYS.readingLog, {}),
    getJSON<string[]>(KEYS.readingActive, []),
    getJSON<KhatmaPlan | null>(KEYS.khatma, null),
  ]);
  return { goal: goalObj.target, log, active, khatma, pagesToday: log[todayStr()] ?? 0 };
}

export async function writeGoal(target: number): Promise<void> {
  await setJSON(KEYS.readingGoal, { target: Math.max(1, Math.floor(target) || DEFAULT_GOAL) });
}

export async function writeKhatma(plan: KhatmaPlan): Promise<void> {
  await setJSON(KEYS.khatma, plan);
}

export async function clearKhatma(): Promise<void> {
  await setJSON(KEYS.khatma, null);
}

/**
 * Record a Mushaf page as read today (de-duplicated): bumps the daily page
 * count, keeps the streak alive, and advances the khatma cursor.
 */
export async function recordMushafPage(page: number): Promise<void> {
  const t = todayStr();

  const active = await getJSON<string[]>(KEYS.readingActive, []);
  if (!active.includes(t)) await setJSON(KEYS.readingActive, [...active, t].slice(-400));

  const seen = await getJSON<{ date: string; pages: number[] }>(KEYS.readingPages, {
    date: t,
    pages: [],
  });
  const pages = seen.date === t ? seen.pages : [];
  if (!pages.includes(page)) {
    pages.push(page);
    await setJSON(KEYS.readingPages, { date: t, pages });
    const log = await getJSON<Record<string, number>>(KEYS.readingLog, {});
    log[t] = pages.length;
    await setJSON(KEYS.readingLog, log);
  }

  const plan = await getJSON<KhatmaPlan | null>(KEYS.khatma, null);
  if (plan && page > plan.currentPage) await setJSON(KEYS.khatma, { ...plan, currentPage: page });
}
