/**
 * Reading-plan persistence for mobile. The plan *definitions* and pure progress
 * helpers are shared in `@ummahlibrary/core`; this layer holds the local-first
 * progress in AsyncStorage (`ul.readingPlan`, ADR 0006). Only one plan is active.
 */
import { type PlanProgress, togglePlanDay } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export {
  PLANS,
  planById,
  planPercent,
  planWeekWindow,
  type DayTarget,
  type PlanDay,
  type PlanProgress,
  type ReadingPlan,
} from "@ummahlibrary/core";
export { currentPlanDay as currentDay } from "@ummahlibrary/core";

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function readPlanProgress(): Promise<PlanProgress | null> {
  return getJSON<PlanProgress | null>(KEYS.readingPlan, null);
}

export async function startPlan(planId: string): Promise<void> {
  const next: PlanProgress = { planId, startDate: todayStr(), completed: [] };
  await setJSON(KEYS.readingPlan, next);
}

export async function clearPlan(): Promise<void> {
  await setJSON(KEYS.readingPlan, null);
}

export async function toggleDay(dayIndex: number): Promise<void> {
  const p = await readPlanProgress();
  if (!p) return;
  await setJSON(KEYS.readingPlan, togglePlanDay(p, dayIndex));
}
