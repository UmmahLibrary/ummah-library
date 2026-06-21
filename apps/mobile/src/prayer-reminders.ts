/**
 * Per-prayer reminders — mobile wiring (ADR 0019). The per-prayer on/off map goes
 * through the {@link mobileReminderStore}; the scheduling decision is the shared
 * `syncPrayerReminders` in `@ummahlibrary/core`; delivery is the {@link expoNotifier}
 * (OS-scheduled). Reuses the same orchestration as the web.
 */
import type { PrayerName } from "@ummahlibrary/core";
import { syncPrayerReminders as coreSyncPrayerReminders } from "@ummahlibrary/core";
import { expoNotifier } from "./notifier";
import { mobilePrayerTimingsProvider } from "./prayer-timings-provider";
import { mobileReminderStore } from "./reminder-store";

export type PrayerReminderPrefs = Partial<Record<PrayerName, boolean>>;

export async function readPrayerReminderPrefs(): Promise<PrayerReminderPrefs> {
  return (await mobileReminderStore.read()).prayers;
}

export async function setPrayerReminder(prayer: PrayerName, on: boolean): Promise<PrayerReminderPrefs> {
  const prefs = { ...(await readPrayerReminderPrefs()), [prayer]: on };
  await mobileReminderStore.writePrayers(prefs);
  await syncPrayerReminders();
  return prefs;
}

export function syncPrayerReminders(): Promise<void> {
  return coreSyncPrayerReminders({
    notifier: expoNotifier,
    reminders: mobileReminderStore,
    timings: mobilePrayerTimingsProvider,
    now: () => new Date(),
  });
}
