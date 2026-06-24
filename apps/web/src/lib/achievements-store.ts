/**
 * Web `AchievementsStore` adapter (ADR 0024, 0032): the ids of badges the user
 * has already been shown, in `localStorage` under `ul.badges`. Persistence only
 * — the badges themselves are derived from existing local data in
 * `@ummahlibrary/core`. Mirrors mobile.
 */
import type { AchievementsStore } from "@ummahlibrary/core";

const KEY = "ul.badges";

export const webAchievementsStore: AchievementsStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      // A corrupt/peer-synced non-array would crash the shown-badge `.includes` checks.
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? (v as string[]) : [];
    } catch {
      return [];
    }
  },
  write: async (ids) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  },
};
