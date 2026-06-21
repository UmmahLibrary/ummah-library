/**
 * Reminder orchestration (#71, ADR 0017/0019). The *decision* of what to remind
 * and when is the pure core helpers (`nextDailyReminder`, `nextAdhkarReminder`,
 * `prayerReminders`); this module is the platform-neutral glue that reads the
 * stored preferences, asks the timings provider, and drives the {@link Notifier}
 * port. Every external concern is injected as a port and the clock is a
 * parameter, so web and mobile share one implementation behind their own
 * adapters — no reminder logic lives in an app.
 *
 * Cancellation is always by explicit id (never `cancelAll()`), so a single
 * shared notifier can serve the plan, adhkar, and prayer reminder families
 * without one family clearing another's pending notifications.
 */
import type { AdhkarOccasion } from "./entities";
import type { Notifier, PlanStore, PrayerTimingsProvider, ReminderStore } from "./ports";
import { nextAdhkarReminder } from "./adhkar";
import { OBLIGATORY_PRAYERS, PRAYER_LABELS, type PrayerName, prayerReminders } from "./prayer";
import { nextDailyReminder, planReminderContent } from "./reading-plans";

export const DEFAULT_PLAN_REMINDER_TIME = "20:00";
export const PLAN_REMINDER_ID = "plan:daily";

const ADHKAR_OCCASION_LIST: readonly AdhkarOccasion[] = ["morning", "evening"];
const ADHKAR_LABEL: Record<AdhkarOccasion, string> = { morning: "morning", evening: "evening" };
const ADHKAR_EMOJI: Record<AdhkarOccasion, string> = { morning: "🌅", evening: "🌆" };

/** Stable notification id for an adhkar occasion (rescheduling replaces it). */
export const adhkarReminderId = (occasion: AdhkarOccasion): string => `adhkar:${occasion}`;
/** Stable notification id for a prayer reminder (rescheduling replaces it). */
export const prayerReminderId = (prayer: PrayerName): string => `prayer:${prayer}`;

/** `YYYY-MM-DD` for the given instant in local time (deterministic given `now`). */
function localDateStr(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Shared dependencies — every external concern is a port; the clock is injected. */
export interface ReminderSyncDeps {
  notifier: Notifier;
  reminders: ReminderStore;
  /** The clock — injected so orchestration stays deterministic and testable. */
  now: () => Date;
}

/**
 * (Re)schedule the reading-plan daily reminder (#71). Idempotent: cancels the
 * plan reminder, then schedules the next occurrence of the chosen time with copy
 * reflecting today's progress. A no-op when the reminder is off, permission
 * isn't granted, there's no active plan (or it's paused, #68), or the time is
 * malformed.
 */
export async function syncPlanReminder(deps: ReminderSyncDeps & { plans: PlanStore }): Promise<void> {
  const { notifier, reminders, plans, now } = deps;
  await notifier.cancel(PLAN_REMINDER_ID);

  const { plan: pref } = await reminders.read();
  if (!pref.on || notifier.permission() !== "granted") return;

  const plan = await plans.read();
  if (!plan || plan.pausedOn) return;

  const at = nextDailyReminder(pref.time, now());
  if (!at) return;

  const { title, body } = planReminderContent(plan, localDateStr(now()));
  await notifier.schedule({
    id: PLAN_REMINDER_ID,
    title,
    body,
    at: at.toISOString(),
    tag: PLAN_REMINDER_ID,
  });
}

/**
 * (Re)schedule the next morning/evening adhkar reminder (ADR 0017/0019).
 * Idempotent: clears both occasion ids, then schedules the next window's
 * opening. A no-op when off, without permission, or with no stored location.
 */
export async function syncAdhkarReminder(
  deps: ReminderSyncDeps & { timings: PrayerTimingsProvider },
): Promise<void> {
  const { notifier, reminders, timings, now } = deps;
  for (const occasion of ADHKAR_OCCASION_LIST) await notifier.cancel(adhkarReminderId(occasion));

  const { adhkarOn } = await reminders.read();
  if (!adhkarOn || notifier.permission() !== "granted") return;

  const today = await timings.getTodaysTimings();
  if (!today) return;

  const next = nextAdhkarReminder(today, now());
  if (!next) return;

  await notifier.schedule({
    id: adhkarReminderId(next.occasion),
    title: `Time for ${ADHKAR_LABEL[next.occasion]} adhkar ${ADHKAR_EMOJI[next.occasion]}`,
    body: "Tap to open your remembrances on Ummah Library.",
    at: next.at.toISOString(),
    tag: adhkarReminderId(next.occasion),
  });
}

/**
 * (Re)schedule today's enabled prayer reminders (ADR 0019). Idempotent: clears
 * every obligatory-prayer id, then schedules each enabled prayer still ahead of
 * `now`. A no-op without permission, a location, or any reminder enabled.
 */
export async function syncPrayerReminders(
  deps: ReminderSyncDeps & { timings: PrayerTimingsProvider },
): Promise<void> {
  const { notifier, reminders, timings, now } = deps;
  for (const prayer of OBLIGATORY_PRAYERS) await notifier.cancel(prayerReminderId(prayer));

  const { prayers } = await reminders.read();
  if (!OBLIGATORY_PRAYERS.some((p) => prayers[p]) || notifier.permission() !== "granted") return;

  const today = await timings.getTodaysTimings();
  if (!today) return;

  for (const reminder of prayerReminders(today, prayers, now())) {
    await notifier.schedule({
      id: prayerReminderId(reminder.prayer),
      title: `${PRAYER_LABELS[reminder.prayer]} — time to pray`,
      body: "It’s time for prayer. Tap to open Ummah Library.",
      at: reminder.at,
      tag: prayerReminderId(reminder.prayer),
    });
  }
}
