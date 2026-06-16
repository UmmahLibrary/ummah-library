/**
 * Web `ReadingGoalsStore` adapter (ADR 0024): the reader's habit state in
 * `localStorage` under the existing `ul.reading*` / `ul.khatma` keys. Persistence
 * only — the habit maths live in `@ummahlibrary/core` and the glue — so a synced
 * adapter (#25) can replace it without touching the feature. Mirrors mobile.
 */
import type { KhatmaPlan, ReadingGoalsState, ReadingGoalsStore } from "@ummahlibrary/core";

const GOAL_KEY = "ul.readingGoal";
const ACTIVE_KEY = "ul.readingActive";
const PAGES_KEY = "ul.readingPages";
const LOG_KEY = "ul.readingLog";
const KHATMA_KEY = "ul.khatma";

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

export const webReadingGoalsStore: ReadingGoalsStore = {
  read: async (): Promise<ReadingGoalsState> => ({
    goal: get<{ target: number } | null>(GOAL_KEY, null)?.target ?? null,
    activeDates: get<string[]>(ACTIVE_KEY, []),
    log: get<Record<string, number>>(LOG_KEY, {}),
    pages: get<{ date: string; pages: number[] }>(PAGES_KEY, { date: "", pages: [] }),
    khatma: get<KhatmaPlan | null>(KHATMA_KEY, null),
  }),
  writeGoal: async (target) => set(GOAL_KEY, { target }),
  writeActiveDates: async (dates) => set(ACTIVE_KEY, dates),
  writeLog: async (log) => set(LOG_KEY, log),
  writePages: async (pages) => set(PAGES_KEY, pages),
  writeKhatma: async (khatma) => {
    if (khatma) set(KHATMA_KEY, khatma);
    else
      try {
        localStorage.removeItem(KHATMA_KEY);
      } catch {
        /* ignore */
      }
  },
};
