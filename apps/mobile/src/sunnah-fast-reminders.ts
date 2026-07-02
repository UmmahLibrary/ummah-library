/**
 * Sunnah-fasting reminders — mobile wiring (#139). The on/off pref goes through
 * the {@link mobileReminderStore}; the scheduling decision is the shared
 * `syncSunnahFastReminder` in `@ummahlibrary/core`; delivery is the
 * {@link expoNotifier} (OS-scheduled). Reuses the same orchestration as the web.
 */
import { syncSunnahFastReminder as coreSyncSunnahFastReminder } from "@ummahlibrary/core";
import { expoNotifier } from "./notifier";
import { mobileReminderStore } from "./reminder-store";

export async function readSunnahFastReminderOn(): Promise<boolean> {
  return (await mobileReminderStore.read()).sunnahFastOn;
}

export async function setSunnahFastReminderOn(on: boolean): Promise<void> {
  await mobileReminderStore.writeSunnahFastOn(on);
  await syncSunnahFastReminder();
}

export function syncSunnahFastReminder(): Promise<void> {
  return coreSyncSunnahFastReminder({
    notifier: expoNotifier,
    reminders: mobileReminderStore,
    now: () => new Date(),
  });
}
