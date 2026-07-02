/**
 * Islamic-event reminders — web wiring (#143). Per-event on/off toggles go
 * through the {@link webReminderStore} (`ReminderStore` port); the scheduling
 * decision is the shared `syncIslamicEventReminders` in `@ummahlibrary/core`.
 * Delivery is the {@link Notifier} port (fires while a tab is open). No location
 * needed — the dates are pure tabular-Hijri arithmetic.
 */
import type { Notifier } from "@ummahlibrary/core";
import { syncIslamicEventReminders as coreSyncIslamicEventReminders } from "@ummahlibrary/core";
import { webReminderStore } from "./reminder-store";

/** Event dispatched on a preference change so listeners can re-sync. */
export const EVENT_REMINDERS_KEY = "ul.islamicEventReminders";

export async function readEventReminders(): Promise<Record<string, boolean>> {
  return (await webReminderStore.read()).islamicEvents;
}

/** Toggle one event's reminder, persisting the updated map (off = removed). */
export async function setEventReminder(eventId: string, on: boolean): Promise<Record<string, boolean>> {
  const prefs = { ...(await readEventReminders()) };
  if (on) prefs[eventId] = true;
  else delete prefs[eventId];
  await webReminderStore.writeIslamicEvents(prefs);
  window.dispatchEvent(new CustomEvent(EVENT_REMINDERS_KEY, { detail: prefs }));
  return prefs;
}

/** (Re)schedule the enabled event reminders through the shared orchestration. */
export function syncIslamicEventReminders(notifier: Notifier): Promise<void> {
  return coreSyncIslamicEventReminders({
    notifier,
    reminders: webReminderStore,
    now: () => new Date(),
  });
}
