/**
 * Reading-plan glue for mobile. The plan catalogue and pure schedule maths are
 * shared in `@ummahlibrary/core`; persistence goes through the `PlanStore` port
 * (mobile adapter `mobilePlanStore`, ADR 0024). Only one plan is active.
 */
import { type ActivePlan, activatePlan, templateById, toggleDayComplete } from "@ummahlibrary/core";
import { mobilePlanStore as store } from "./plan-store";

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
  return store.read();
}

export async function startPlan(templateId: string): Promise<void> {
  const template = templateById(templateId);
  if (template) await store.write(activatePlan(template, todayStr()));
}

export async function clearPlan(): Promise<void> {
  await store.clear();
}

/** Toggle a 1-based day's completion (advances/retreats the linear cursor). */
export async function toggleDay(day: number): Promise<void> {
  const plan = await store.read();
  if (plan) await store.write(toggleDayComplete(plan, day));
}
