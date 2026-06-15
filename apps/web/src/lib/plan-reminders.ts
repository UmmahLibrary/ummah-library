/**
 * Reading-plan daily reminder (#71). Opt-in, a single daily nudge at a chosen
 * time. All local: the on/off + time preference lives in `localStorage`, the
 * message copy is the pure core helper (`planReminderContent`), and delivery
 * goes through the {@link Notifier} port — the web adapter fires while a tab is
 * open (ADR 0019). No server push; the honest limit of a no-backend app. The
 * same core helpers will back a future Expo notifier behind the same port.
 */
import { type Notifier, nextDailyReminder, planReminderContent } from "@ummahlibrary/core";
import { readActivePlan, todayStr } from "./reading-plan";

export const PLAN_REMINDER_KEY = "ul.planReminder";
export const PLAN_REMINDER_ID = "plan:daily";
export const DEFAULT_PLAN_REMINDER_TIME = "20:00";

export interface PlanReminderPref {
  on: boolean;
  /** Local wall-clock time, `HH:MM`. */
  time: string;
}

const FALLBACK: PlanReminderPref = { on: false, time: DEFAULT_PLAN_REMINDER_TIME };

export function readPlanReminderPref(): PlanReminderPref {
  try {
    const raw = localStorage.getItem(PLAN_REMINDER_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PlanReminderPref>;
      return {
        on: p.on === true,
        time: typeof p.time === "string" ? p.time : DEFAULT_PLAN_REMINDER_TIME,
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { ...FALLBACK };
}

/** Persist the preference and notify the scheduler (and any open toggles). */
export function setPlanReminderPref(pref: PlanReminderPref): void {
  try {
    localStorage.setItem(PLAN_REMINDER_KEY, JSON.stringify(pref));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(PLAN_REMINDER_KEY, { detail: pref }));
}

/**
 * (Re)schedule the active plan's daily reminder through the notifier. Idempotent:
 * cancels the pending one first, then schedules the next occurrence of the chosen
 * time with copy reflecting today's progress. A no-op when the reminder is off,
 * permission isn't granted, there's no active plan, or the time is malformed.
 */
export async function syncPlanReminder(notifier: Notifier): Promise<void> {
  await notifier.cancel(PLAN_REMINDER_ID);
  const pref = readPlanReminderPref();
  if (!pref.on || notifier.permission() !== "granted") return;

  const plan = await readActivePlan();
  if (!plan) return;

  const at = nextDailyReminder(pref.time, new Date());
  if (!at) return;

  const { title, body } = planReminderContent(plan, todayStr());
  await notifier.schedule({
    id: PLAN_REMINDER_ID,
    title,
    body,
    at: at.toISOString(),
    tag: PLAN_REMINDER_ID,
  });
}
