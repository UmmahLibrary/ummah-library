/**
 * Per-prayer reminders — web wiring (ADR 0019). The per-prayer on/off map goes
 * through the {@link webReminderStore} (`ReminderStore` port, ADR 0024); the
 * decision of *what* and *when* is the shared `syncPrayerReminders` in
 * `@ummahlibrary/core`; *delivery* is the {@link Notifier} port (the web adapter
 * fires while a tab is open). No server push — the honest limit of a no-backend,
 * local-first app.
 */
import type { Notifier, PrayerName } from "@ummahlibrary/core";
import { OBLIGATORY_PRAYERS, syncPrayerReminders as coreSyncPrayerReminders } from "@ummahlibrary/core";
import { webPrayerTimingsProvider } from "./prayer-timings-provider";
import { webReminderStore } from "./reminder-store";

/** Event dispatched on a preference change so the scheduler re-syncs. */
export const PRAYER_REMINDERS_KEY = "ul.prayerReminders";

export type PrayerReminderPrefs = Partial<Record<PrayerName, boolean>>;

export async function readPrayerReminderPrefs(): Promise<PrayerReminderPrefs> {
  return (await webReminderStore.read()).prayers;
}

/** Flip one prayer's reminder, persist it, and notify listeners (the scheduler). */
export async function setPrayerReminder(prayer: PrayerName, on: boolean): Promise<PrayerReminderPrefs> {
  const prefs = { ...(await readPrayerReminderPrefs()), [prayer]: on };
  await webReminderStore.writePrayers(prefs);
  window.dispatchEvent(new CustomEvent(PRAYER_REMINDERS_KEY, { detail: prefs }));
  return prefs;
}

export function anyPrayerReminderOn(prefs: PrayerReminderPrefs): boolean {
  return OBLIGATORY_PRAYERS.some((p) => prefs[p]);
}

/** (Re)schedule today's enabled prayer notifications through the shared orchestration. */
export function syncPrayerReminders(notifier: Notifier): Promise<void> {
  return coreSyncPrayerReminders({
    notifier,
    reminders: webReminderStore,
    timings: webPrayerTimingsProvider,
    now: () => new Date(),
  });
}
