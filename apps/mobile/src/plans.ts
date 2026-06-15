/**
 * Reading-plan persistence for mobile. The plan catalogue and the pure schedule
 * maths are shared in `@ummahlibrary/core`; this layer holds the started plan
 * (an `ActivePlan` snapshot) in AsyncStorage (`ul.readingPlan`, ADR 0006). Only
 * one plan is active at a time.
 */
import { type ActivePlan, activatePlan, templateById, toggleDayComplete } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export {
  PLAN_TEMPLATES,
  computeTodayPortion,
  currentDay,
  isDayComplete,
  percentComplete,
  planDuration,
  planWeekWindow,
} from "@ummahlibrary/core";
export type { ActivePlan, DayPortion, DayTarget, PlanTemplate } from "@ummahlibrary/core";

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function readActivePlan(): Promise<ActivePlan | null> {
  return getJSON<ActivePlan | null>(KEYS.readingPlan, null);
}

export async function startPlan(templateId: string): Promise<void> {
  const template = templateById(templateId);
  if (template) await setJSON(KEYS.readingPlan, activatePlan(template, todayStr()));
}

export async function clearPlan(): Promise<void> {
  await setJSON(KEYS.readingPlan, null);
}

/** Toggle a 1-based day's completion (advances/retreats the linear cursor). */
export async function toggleDay(day: number): Promise<void> {
  const plan = await readActivePlan();
  if (plan) await setJSON(KEYS.readingPlan, toggleDayComplete(plan, day));
}
