/**
 * Reading-plan daily reminder — web wiring (#71). The on/off + time preference
 * goes through the {@link webReminderStore} (`ReminderStore` port, ADR 0024) and
 * the scheduling decision is the shared `syncPlanReminder` in
 * `@ummahlibrary/core`; this module only injects the web adapters and re-emits a
 * `CustomEvent` so the scheduler/toggle re-sync. Delivery is the {@link Notifier}
 * port (the web adapter fires while a tab is open, ADR 0019) — no server push.
 */
import type { Notifier, PlanReminderPref } from "@ummahlibrary/core";
import {
  DEFAULT_PLAN_REMINDER_TIME,
  PLAN_REMINDER_ID,
  syncPlanReminder as coreSyncPlanReminder,
} from "@ummahlibrary/core";
import { webPlanStore } from "./plan-store";
import { webReminderStore } from "./reminder-store";

export { DEFAULT_PLAN_REMINDER_TIME, PLAN_REMINDER_ID };
export type { PlanReminderPref };

/** Event dispatched on a preference change so the scheduler re-syncs. */
export const PLAN_REMINDER_KEY = "ul.planReminder";

export async function readPlanReminderPref(): Promise<PlanReminderPref> {
  return (await webReminderStore.read()).plan;
}

/** Persist the preference and notify the scheduler (and any open toggles). */
export async function setPlanReminderPref(pref: PlanReminderPref): Promise<void> {
  await webReminderStore.writePlan(pref);
  window.dispatchEvent(new CustomEvent(PLAN_REMINDER_KEY, { detail: pref }));
}

/** (Re)schedule the active plan's daily reminder through the shared orchestration. */
export function syncPlanReminder(notifier: Notifier): Promise<void> {
  return coreSyncPlanReminder({
    notifier,
    reminders: webReminderStore,
    plans: webPlanStore,
    now: () => new Date(),
  });
}
