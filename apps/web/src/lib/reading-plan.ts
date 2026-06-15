/**
 * Local-first reading-plan glue. Persistence goes through the `PlanStore` port
 * (web adapter `webPlanStore`, ADR 0024); this layer adds the business helpers
 * and broadcasts a window event so the plans page re-renders. Mirrors mobile.
 */
import {
  type ActivePlan,
  type PlanTemplate,
  activatePlan,
  advanceCursorToPage,
  extendPlan,
  pausePlan as applyPause,
  rebalance,
  resumePlan as applyResume,
  templateById,
  toggleDayComplete,
} from "@ummahlibrary/core";
import { webPlanStore as store } from "./plan-store";

export const READING_PLAN_EVENT = "ul.readingPlan";

/** Today as a local `YYYY-MM-DD` string — the clock the pure core is fed. */
export function todayStr(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(READING_PLAN_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readActivePlan(): Promise<ActivePlan | null> {
  return store.read();
}

async function activate(template: PlanTemplate): Promise<void> {
  await store.write(activatePlan(template, todayStr()));
  emit();
}

export async function startPlan(templateId: string): Promise<void> {
  const template = templateById(templateId);
  if (template) await activate(template);
}

/** Start a one-off custom plan built in the UI (not from the catalogue). */
export function startCustomPlan(template: PlanTemplate): Promise<void> {
  return activate(template);
}

export async function clearPlan(): Promise<void> {
  await store.clear();
  emit();
}

/** Toggle a 1-based day's completion (advances/retreats the linear cursor). */
export async function toggleDay(day: number): Promise<void> {
  const plan = await store.read();
  if (!plan) return;
  await store.write(toggleDayComplete(plan, day));
  emit();
}

/** Re-pace the active plan to keep its end date (catch-up rebalance, #70). */
export async function rebalancePlan(): Promise<void> {
  const plan = await store.read();
  if (!plan) return;
  await store.write(rebalance(plan, todayStr()));
  emit();
}

/** Push the active plan's end date `days` later and re-pace (#70). */
export async function extendPlanBy(days: number): Promise<void> {
  const plan = await store.read();
  if (!plan) return;
  await store.write(extendPlan(plan, todayStr(), days));
  emit();
}

/** Pause the active plan, freezing its clock (#68). */
export async function pausePlan(): Promise<void> {
  const plan = await store.read();
  if (!plan || plan.pausedOn) return;
  await store.write(applyPause(plan, todayStr()));
  emit();
}

/** Resume a paused plan, shifting its timeline past the break (#68). */
export async function resumePlan(): Promise<void> {
  const plan = await store.read();
  if (!plan?.pausedOn) return;
  await store.write(applyResume(plan, todayStr()));
  emit();
}

/** Advance the active plan to a Madani page the reader has reached (#69). */
export async function advancePlanToPage(page: number): Promise<void> {
  const plan = await store.read();
  if (!plan) return;
  const next = advanceCursorToPage(plan, page);
  if (next.unitsRead !== plan.unitsRead) {
    await store.write(next);
    emit();
  }
}
