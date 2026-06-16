/**
 * Local-first reading habit state (ADR 0006): a daily goal, an activity log
 * (which days you read — drives the streak), per-day Mushaf pages read (drives
 * the daily goal), and an optional khatma plan. Persistence goes through the
 * `ReadingGoalsStore` port (web adapter `webReadingGoalsStore`, ADR 0024); this
 * layer adds the habit logic and a window event so the home badge and the goals
 * page re-render together.
 */

import type { KhatmaPlan } from "@ummahlibrary/core";
import { advancePlanToPage } from "./reading-plan";
import { webReadingGoalsStore as store } from "./reading-goals-store";

export const READING_EVENT = "ul.reading";

export const DEFAULT_GOAL = 4;

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(READING_EVENT));
  } catch {
    /* non-browser */
  }
}

/** The reader's resolved habit state for the badge, goals page and profile. */
export interface ReadingState {
  goal: number;
  activeDates: string[];
  log: Record<string, number>;
  pagesToday: number;
  khatma: KhatmaPlan | null;
}

export async function readReadingState(): Promise<ReadingState> {
  const s = await store.read();
  return {
    goal: s.goal ?? DEFAULT_GOAL,
    activeDates: s.activeDates,
    log: s.log,
    pagesToday: s.log[today()] ?? 0,
    khatma: s.khatma,
  };
}

export async function writeGoal(target: number): Promise<void> {
  await store.writeGoal(Math.max(1, Math.floor(target) || DEFAULT_GOAL));
  emit();
}

/** Record that the reader was opened today (keeps the streak alive). */
export async function markActivity(): Promise<void> {
  const t = today();
  const s = await store.read();
  if (!s.activeDates.includes(t)) {
    await store.writeActiveDates([...s.activeDates, t].slice(-400));
    emit();
  }
}

/**
 * Record a Mushaf page as read today (de-duplicated), updating the daily page
 * count and advancing the khatma cursor. Also marks activity and advances the
 * active reading plan (#69).
 */
export async function recordMushafPage(page: number): Promise<void> {
  const t = today();
  const s = await store.read();
  if (!s.activeDates.includes(t)) await store.writeActiveDates([...s.activeDates, t].slice(-400));

  const pages = s.pages.date === t ? s.pages.pages : [];
  if (!pages.includes(page)) {
    pages.push(page);
    await store.writePages({ date: t, pages });
    await store.writeLog({ ...s.log, [t]: pages.length });
  }
  if (s.khatma && page > s.khatma.currentPage) await store.writeKhatma({ ...s.khatma, currentPage: page });
  void advancePlanToPage(page);
  emit();
}

export async function writeKhatma(plan: KhatmaPlan): Promise<void> {
  await store.writeKhatma(plan);
  emit();
}
export async function clearKhatma(): Promise<void> {
  await store.writeKhatma(null);
  emit();
}
