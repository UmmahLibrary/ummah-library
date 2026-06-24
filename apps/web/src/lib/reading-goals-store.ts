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

export const webReadingGoalsStore: ReadingGoalsStore = {
  read: async (): Promise<ReadingGoalsState> => ({
    goal: get<{ target: number } | null>(GOAL_KEY, null, isRecord)?.target ?? null,
    activeDates: get<string[]>(ACTIVE_KEY, [], Array.isArray),
    log: get<Record<string, number>>(LOG_KEY, {}, isRecord),
    pages: get<{ date: string; pages: number[] }>(PAGES_KEY, { date: "", pages: [] }, (v) =>
      isRecord(v) && Array.isArray((v as { pages?: unknown }).pages),
    ),
    khatma: get<KhatmaPlan | null>(KHATMA_KEY, null, isRecord),
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
