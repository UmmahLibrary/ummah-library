/**
 * Reading-plan daily reminder — mobile wiring (#71). The on/off + time preference
 * goes through the {@link mobileReminderStore} (`ReminderStore` port) and the
 * scheduling decision is the shared `syncPlanReminder` in `@ummahlibrary/core`;
 * this module injects the mobile adapters. Delivery is the {@link expoNotifier}
 * (OS-scheduled — fires even when the app is closed), unlike the web's tab-bound
 * notifier.
 */
import { type PlanReminderPref, syncPlanReminder as coreSyncPlanReminder } from "@ummahlibrary/core";
import { expoNotifier } from "./notifier";
import { mobilePlanStore } from "./plan-store";
import { mobileReminderStore } from "./reminder-store";

export async function readPlanReminderPref(): Promise<PlanReminderPref> {
  return (await mobileReminderStore.read()).plan;
}

export async function setPlanReminderPref(pref: PlanReminderPref): Promise<void> {
  await mobileReminderStore.writePlan(pref);
  await syncPlanReminder();
}

/** (Re)schedule the active plan's daily reminder through the shared orchestration. */
export function syncPlanReminder(): Promise<void> {
  return coreSyncPlanReminder({
    notifier: expoNotifier,
    reminders: mobileReminderStore,
    plans: mobilePlanStore,
    now: () => new Date(),
  });
}
