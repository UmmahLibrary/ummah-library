/**
 * Adhkar reminders — mobile wiring (ADR 0017/0019). The on/off pref goes through
 * the {@link mobileReminderStore}; the scheduling decision is the shared
 * `syncAdhkarReminder` in `@ummahlibrary/core`; delivery is the {@link expoNotifier}
 * (OS-scheduled). Reuses the same orchestration as the web.
 */
import { syncAdhkarReminder as coreSyncAdhkarReminder } from "@ummahlibrary/core";
import { expoNotifier } from "./notifier";
import { mobilePrayerTimingsProvider } from "./prayer-timings-provider";
import { mobileReminderStore } from "./reminder-store";

export async function readAdhkarReminderOn(): Promise<boolean> {
  return (await mobileReminderStore.read()).adhkarOn;
}

export async function setAdhkarReminderOn(on: boolean): Promise<void> {
  await mobileReminderStore.writeAdhkarOn(on);
  await syncAdhkarReminder();
}

export function syncAdhkarReminder(): Promise<void> {
  return coreSyncAdhkarReminder({
    notifier: expoNotifier,
    reminders: mobileReminderStore,
    timings: mobilePrayerTimingsProvider,
    now: () => new Date(),
  });
}
