/**
 * Sunnah-fasting reminders — web wiring (#139). The on/off preference goes
 * through the {@link webReminderStore} (`ReminderStore` port); the scheduling
 * decision is the shared `syncSunnahFastReminder` in `@ummahlibrary/core`.
 * Delivery is the {@link Notifier} port (fires while a tab is open). Unlike the
 * adhkar/prayer reminders this needs no location — the fast days are pure
 * Hijri/weekday arithmetic.
 */
import type { Notifier } from "@ummahlibrary/core";
import { syncSunnahFastReminder as coreSyncSunnahFastReminder } from "@ummahlibrary/core";
import { webReminderStore } from "./reminder-store";

/** Event dispatched on a preference change so listeners can re-sync. */
export const SUNNAH_FAST_REMINDERS_KEY = "ul.sunnahFastReminders";

export async function remindersEnabled(): Promise<boolean> {
  return (await webReminderStore.read()).sunnahFastOn;
}

export async function setRemindersEnabled(on: boolean): Promise<void> {
  await webReminderStore.writeSunnahFastOn(on);
  window.dispatchEvent(new CustomEvent(SUNNAH_FAST_REMINDERS_KEY, { detail: on }));
}

/** (Re)schedule the next sunnah-fast notification through the shared orchestration. */
export function syncSunnahFastReminder(notifier: Notifier): Promise<void> {
  return coreSyncSunnahFastReminder({
    notifier,
    reminders: webReminderStore,
    now: () => new Date(),
  });
}
