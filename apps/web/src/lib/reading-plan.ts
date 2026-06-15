/**
 * Local-first reading-plan progress (ADR 0006). The plan catalogue and the pure
 * schedule maths live in `@ummahlibrary/core`; this layer persists the *started*
 * plan (an `ActivePlan` snapshot) in `localStorage` (`ul.readingPlan`) and
 * broadcasts a window event so the plans page re-renders. Mirrors the mobile
 * persistence.
 */
import { type ActivePlan, activatePlan, templateById, toggleDayComplete } from "@ummahlibrary/core";

export const READING_PLAN_EVENT = "ul.readingPlan";
const KEY = "ul.readingPlan";

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

export function readActivePlan(): ActivePlan | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivePlan) : null;
  } catch {
    return null;
  }
}

function write(plan: ActivePlan): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function startPlan(templateId: string): void {
  const template = templateById(templateId);
  if (template) write(activatePlan(template, todayStr()));
}

export function clearPlan(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

/** Toggle a 1-based day's completion (advances/retreats the linear cursor). */
export function toggleDay(day: number): void {
  const plan = readActivePlan();
  if (plan) write(toggleDayComplete(plan, day));
}
