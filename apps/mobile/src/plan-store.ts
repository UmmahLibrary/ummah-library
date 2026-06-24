/**
 * Mobile `PlanStore` adapter (ADR 0024): the reader's active plan in
 * AsyncStorage under `ul.readingPlan`. Persistence only — the plan logic lives
 * in `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors the web adapter.
 */
import { type ActivePlan, type PlanStore, isActivePlan } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export const mobilePlanStore: PlanStore = {
  // Drop a corrupt/peer-synced plan so it can't reach planDuration and throw at render.
  read: () => getJSON<ActivePlan | null>(KEYS.readingPlan, null, (v) => v === null || isActivePlan(v)),
  write: (plan) => setJSON(KEYS.readingPlan, plan),
  clear: () => setJSON(KEYS.readingPlan, null),
};
