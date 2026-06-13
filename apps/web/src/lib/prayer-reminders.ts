/**
 * Per-prayer reminders, wired off the prayer-times module (ADR 0019). All local:
 * the per-prayer on/off map lives in `localStorage`; the decision of *what* and
 * *when* is the pure core helper `prayerReminders`; *delivery* goes through the
 * {@link Notifier} port (the web adapter fires while a tab is open). No server
 * push — the honest limit of a no-backend, local-first app.
 */

import {
  type Notifier,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerName,
  prayerReminders,
} from "@ummahlibrary/core";
import { ensureTodaysTimings } from "./adhkar-reminders";

export const PRAYER_REMINDERS_KEY = "ul.prayerReminders";

export type PrayerReminderPrefs = Partial<Record<PrayerName, boolean>>;

export function readPrayerReminderPrefs(): PrayerReminderPrefs {
  try {
    const raw = localStorage.getItem(PRAYER_REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as PrayerReminderPrefs) : {};
  } catch {
    return {};
  }
}

/** Flip one prayer's reminder, persist it, and notify listeners (the scheduler). */
export function setPrayerReminder(prayer: PrayerName, on: boolean): PrayerReminderPrefs {
  const prefs = { ...readPrayerReminderPrefs(), [prayer]: on };
  try {
    localStorage.setItem(PRAYER_REMINDERS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(PRAYER_REMINDERS_KEY, { detail: prefs }));
  return prefs;
}

export function anyPrayerReminderOn(prefs: PrayerReminderPrefs = readPrayerReminderPrefs()): boolean {
  return OBLIGATORY_PRAYERS.some((p) => prefs[p]);
}

/**
 * (Re)schedule today's enabled prayer notifications through the given notifier.
 * Idempotent: cancels everything first, then schedules each still-upcoming
 * enabled prayer. A no-op without permission, a location, or any reminder on.
 */
export async function syncPrayerReminders(notifier: Notifier): Promise<void> {
  await notifier.cancelAll();
  const prefs = readPrayerReminderPrefs();
  if (!anyPrayerReminderOn(prefs) || notifier.permission() !== "granted") return;

  const timings = await ensureTodaysTimings();
  if (!timings) return;

  for (const reminder of prayerReminders(timings, prefs, new Date())) {
    await notifier.schedule({
      id: `prayer:${reminder.prayer}`,
      title: `${PRAYER_LABELS[reminder.prayer]} — time to pray`,
      body: "It’s time for prayer. Tap to open Ummah Library.",
      at: reminder.at,
      tag: `prayer:${reminder.prayer}`,
    });
  }
}
