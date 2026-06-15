/**
 * Web `PlanStore` adapter (ADR 0024): the reader's active plan in `localStorage`
 * under `ul.readingPlan`. Persistence is the only thing this layer does — the
 * plan logic lives in `@ummahlibrary/core` — so a synced adapter (#25) can
 * replace it without touching the feature. Mirrors the mobile adapter.
 */
import type { ActivePlan, PlanStore } from "@ummahlibrary/core";

const KEY = "ul.readingPlan";

export const webPlanStore: PlanStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ActivePlan) : null;
    } catch {
      return null;
    }
  },
  write: async (plan) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plan));
    } catch {
      /* storage unavailable */
    }
  },
  clear: async () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
