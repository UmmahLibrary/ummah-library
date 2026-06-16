/**
 * Mobile `ReadingGoalsStore` adapter (ADR 0024): the reader's habit state in
 * AsyncStorage under the existing `ul.reading*` / `ul.khatma` keys. Persistence
 * only — the habit maths live in `@ummahlibrary/core` and the glue — so a synced
 * adapter (#25) can replace it without touching the feature. Mirrors web.
 */
import type { KhatmaPlan, ReadingGoalsState, ReadingGoalsStore } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export const mobileReadingGoalsStore: ReadingGoalsStore = {
  read: async (): Promise<ReadingGoalsState> => {
    const [goalObj, active, log, pages, khatma] = await Promise.all([
      getJSON<{ target: number } | null>(KEYS.readingGoal, null),
      getJSON<string[]>(KEYS.readingActive, []),
      getJSON<Record<string, number>>(KEYS.readingLog, {}),
      getJSON<{ date: string; pages: number[] }>(KEYS.readingPages, { date: "", pages: [] }),
      getJSON<KhatmaPlan | null>(KEYS.khatma, null),
    ]);
    return { goal: goalObj?.target ?? null, activeDates: active, log, pages, khatma };
  },
  writeGoal: (target) => setJSON(KEYS.readingGoal, { target }),
  writeActiveDates: (dates) => setJSON(KEYS.readingActive, dates),
  writeLog: (log) => setJSON(KEYS.readingLog, log),
  writePages: (pages) => setJSON(KEYS.readingPages, pages),
  writeKhatma: (khatma) => setJSON(KEYS.khatma, khatma),
};
