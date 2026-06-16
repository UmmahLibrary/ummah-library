/**
 * Local-first reading-habit state (ADR 0006): a daily page goal, an activity log
 * (drives the streak), today's distinct Mushaf pages (drives the daily goal),
 * a per-day page count, and an optional khatma plan. Persistence goes through the
 * `ReadingGoalsStore` port (mobile adapter `mobileReadingGoalsStore`, ADR 0024);
 * the maths lives in `@ummahlibrary/core`.
 */
import type { KhatmaPlan } from "@ummahlibrary/core";
import { advancePlanToPage } from "./plans";
import { mobileReadingGoalsStore as store } from "./reading-goals-store";
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
  const s = await store.read();
  return {
    goal: s.goal ?? DEFAULT_GOAL,
    log: s.log,
    active: s.activeDates,
    khatma: s.khatma,
    pagesToday: s.log[todayStr()] ?? 0,
  };
}

export async function writeGoal(target: number): Promise<void> {
  await store.writeGoal(Math.max(1, Math.floor(target) || DEFAULT_GOAL));
}

export async function writeKhatma(plan: KhatmaPlan): Promise<void> {
  await store.writeKhatma(plan);
}

export async function clearKhatma(): Promise<void> {
  await store.writeKhatma(null);
}

/**
 * Record a Mushaf page as read today (de-duplicated): bumps the daily page
 * count, keeps the streak alive, advances the khatma cursor, and advances any
 * active reading plan (#69).
 */
export async function recordMushafPage(page: number): Promise<void> {
  const t = todayStr();
  const s = await store.read();

  if (!s.activeDates.includes(t)) await store.writeActiveDates([...s.activeDates, t].slice(-400));

  const pages = s.pages.date === t ? s.pages.pages : [];
  if (!pages.includes(page)) {
    pages.push(page);
    await store.writePages({ date: t, pages });
    await store.writeLog({ ...s.log, [t]: pages.length });
  }

  if (s.khatma && page > s.khatma.currentPage) await store.writeKhatma({ ...s.khatma, currentPage: page });

  await advancePlanToPage(page);
}
