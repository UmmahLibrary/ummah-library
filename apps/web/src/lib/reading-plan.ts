/**
 * Local-first reading-plan progress (ADR 0006). The plan definitions and pure
 * progress helpers live in `@ummahlibrary/core`; this layer persists the active
 * plan + completed days in `localStorage` (`ul.readingPlan`) and broadcasts a
 * window event so the plans page re-renders. Mirrors the mobile persistence.
 */
import { type PlanProgress, togglePlanDay } from "@ummahlibrary/core";

export const READING_PLAN_EVENT = "ul.readingPlan";
const KEY = "ul.readingPlan";

function todayStr(d = new Date()): string {
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

export function readPlanProgress(): PlanProgress | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlanProgress) : null;
  } catch {
    return null;
  }
}

function write(progress: PlanProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function startPlan(planId: string): void {
  write({ planId, startDate: todayStr(), completed: [] });
}

export function clearPlan(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function toggleDay(dayIndex: number): void {
  const p = readPlanProgress();
  if (p) write(togglePlanDay(p, dayIndex));
}
