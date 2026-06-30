import { describe, expect, it } from "vitest";
import type {
  AppNotification,
  Notifier,
  NotifyPermission,
  PlanStore,
  PrayerTimingsProvider,
  ReminderPrefs,
  ReminderStore,
} from "./ports";
import type { PrayerTimings } from "./prayer";
import { type ActivePlan, activatePlan, templateById } from "./reading-plans";
import {
  DEFAULT_PLAN_REMINDER_TIME,
  PLAN_REMINDER_ID,
  adhkarReminderId,
  prayerReminderId,
  syncAdhkarReminder,
  syncPlanReminder,
  syncPrayerReminders,
} from "./reminders";

function fakeNotifier(permission: NotifyPermission = "granted") {
  const scheduled = new Map<string, AppNotification>();
  const cancelled: string[] = [];
  const notifier: Notifier = {
    isSupported: () => true,
    permission: () => permission,
    requestPermission: async () => permission,
    schedule: async (n) => void scheduled.set(n.id, n),
    cancel: async (id) => {
      cancelled.push(id);
      scheduled.delete(id);
    },
    cancelAll: async () => {
      for (const id of scheduled.keys()) cancelled.push(id);
      scheduled.clear();
    },
  };
  return { notifier, scheduled, cancelled };
}

function fakeReminders(prefs: Partial<ReminderPrefs> = {}): ReminderStore {
  const state: ReminderPrefs = { plan: { on: false, time: "20:00" }, prayers: {}, adhkarOn: false, ...prefs };
  return {
    read: async () => state,
    writePlan: async (p) => void (state.plan = p),
    writePrayers: async (p) => void (state.prayers = p),
    writeAdhkarOn: async (o) => void (state.adhkarOn = o),
  };
}

const fakePlans = (plan: ActivePlan | null): PlanStore => ({
  read: async () => plan,
  write: async () => {},
  clear: async () => {},
});

const provider = (t: PrayerTimings | null): PrayerTimingsProvider => ({ getTodaysTimings: async () => t });

const TIMINGS: PrayerTimings = {
  fajr: "2026-06-21T03:00:00.000Z",
  sunrise: "2026-06-21T04:30:00.000Z",
  dhuhr: "2026-06-21T12:00:00.000Z",
  asr: "2026-06-21T15:30:00.000Z",
  maghrib: "2026-06-21T19:00:00.000Z",
  isha: "2026-06-21T20:30:00.000Z",
};
// 10:00Z: fajr/sunrise have passed; dhuhr → isha are still ahead.
const NOW = new Date("2026-06-21T10:00:00.000Z");
const now = () => NOW;
const activePlan = (): ActivePlan => activatePlan(templateById("ramadan-khatm")!, "2026-06-21");

describe("syncPlanReminder", () => {
  it("schedules the plan reminder when enabled, granted, and a plan is active", async () => {
    const { notifier, scheduled, cancelled } = fakeNotifier();
    await syncPlanReminder({
      notifier,
      reminders: fakeReminders({ plan: { on: true, time: "20:00" } }),
      plans: fakePlans(activePlan()),
      now,
    });
    expect(cancelled).toContain(PLAN_REMINDER_ID); // cancels before scheduling (idempotent)
    expect(scheduled.has(PLAN_REMINDER_ID)).toBe(true);
  });

  it("is a no-op when off, denied, plan paused, no plan, or a bad time", async () => {
    const cases: Array<[Partial<ReminderPrefs>, NotifyPermission, ActivePlan | null]> = [
      [{ plan: { on: false, time: "20:00" } }, "granted", activePlan()],
      [{ plan: { on: true, time: "20:00" } }, "denied", activePlan()],
      [{ plan: { on: true, time: "20:00" } }, "granted", { ...activePlan(), pausedOn: "2026-06-20" }],
      [{ plan: { on: true, time: "20:00" } }, "granted", null],
      [{ plan: { on: true, time: "99:99" } }, "granted", activePlan()],
    ];
    for (const [prefs, perm, plan] of cases) {
      const { notifier, scheduled } = fakeNotifier(perm);
      await syncPlanReminder({ notifier, reminders: fakeReminders(prefs), plans: fakePlans(plan), now });
      expect(scheduled.has(PLAN_REMINDER_ID)).toBe(false);
    }
  });
});

describe("syncAdhkarReminder", () => {
  it("schedules the next occasion and clears both occasion ids", async () => {
    const { notifier, scheduled, cancelled } = fakeNotifier();
    await syncAdhkarReminder({ notifier, reminders: fakeReminders({ adhkarOn: true }), timings: provider(TIMINGS), now });
    expect(cancelled).toEqual(expect.arrayContaining([adhkarReminderId("morning"), adhkarReminderId("evening")]));
    // morning (fajr 03:00Z) has passed → next is evening (asr 15:30Z).
    expect(scheduled.has(adhkarReminderId("evening"))).toBe(true);
    expect(scheduled.has(adhkarReminderId("morning"))).toBe(false);
  });

  it("is a no-op when off or without a location", async () => {
    const off = fakeNotifier();
    await syncAdhkarReminder({ notifier: off.notifier, reminders: fakeReminders({ adhkarOn: false }), timings: provider(TIMINGS), now });
    expect(off.scheduled.size).toBe(0);

    const noLoc = fakeNotifier();
    await syncAdhkarReminder({ notifier: noLoc.notifier, reminders: fakeReminders({ adhkarOn: true }), timings: provider(null), now });
    expect(noLoc.scheduled.size).toBe(0);
  });

  it("does not schedule when enabled but permission is not granted", async () => {
    // Pins the `... || permission !== "granted"` guard: enabled alone must not schedule.
    const { notifier, scheduled } = fakeNotifier("denied");
    await syncAdhkarReminder({ notifier, reminders: fakeReminders({ adhkarOn: true }), timings: provider(TIMINGS), now });
    expect(scheduled.size).toBe(0);
  });

  it("schedules the evening occasion with the exact label, emoji and copy", async () => {
    const { notifier, scheduled } = fakeNotifier();
    await syncAdhkarReminder({ notifier, reminders: fakeReminders({ adhkarOn: true }), timings: provider(TIMINGS), now });
    const n = scheduled.get(adhkarReminderId("evening"))!;
    expect(n.title).toBe("Time for evening adhkar 🌆");
    expect(n.body).toBe("Tap to open your remembrances on Ummah Library.");
    expect(n.tag).toBe(adhkarReminderId("evening"));
  });

  it("schedules the morning occasion with its own label and emoji", async () => {
    // Before fajr, the next occasion is morning — pins the morning ADHKAR_LABEL/EMOJI
    // entries (the evening test alone leaves the morning row unexercised).
    const { notifier, scheduled } = fakeNotifier();
    const earlyNow = () => new Date("2026-06-21T01:00:00.000Z"); // before fajr 03:00Z
    await syncAdhkarReminder({ notifier, reminders: fakeReminders({ adhkarOn: true }), timings: provider(TIMINGS), now: earlyNow });
    const n = scheduled.get(adhkarReminderId("morning"))!;
    expect(n.title).toBe("Time for morning adhkar 🌅");
    expect(n.tag).toBe(adhkarReminderId("morning"));
  });
});

describe("syncPrayerReminders", () => {
  it("schedules only enabled prayers still ahead of now", async () => {
    const { notifier, scheduled, cancelled } = fakeNotifier();
    await syncPrayerReminders({
      notifier,
      reminders: fakeReminders({ prayers: { fajr: true, dhuhr: true } }),
      timings: provider(TIMINGS),
      now,
    });
    // every obligatory id is cleared first
    expect(cancelled).toContain(prayerReminderId("fajr"));
    expect(cancelled).toContain(prayerReminderId("isha"));
    // fajr already passed; dhuhr is upcoming
    expect(scheduled.has(prayerReminderId("fajr"))).toBe(false);
    expect(scheduled.has(prayerReminderId("dhuhr"))).toBe(true);
  });

  it("is a no-op when no prayer is enabled", async () => {
    const { notifier, scheduled } = fakeNotifier();
    await syncPrayerReminders({ notifier, reminders: fakeReminders({ prayers: {} }), timings: provider(TIMINGS), now });
    expect(scheduled.size).toBe(0);
  });

  it("does not schedule when enabled but permission is denied, or without a location", async () => {
    // Pins the `!some(enabled) || permission !== "granted"` guard and the `!today` guard.
    const denied = fakeNotifier("denied");
    await syncPrayerReminders({ notifier: denied.notifier, reminders: fakeReminders({ prayers: { dhuhr: true } }), timings: provider(TIMINGS), now });
    expect(denied.scheduled.size).toBe(0);

    const noLoc = fakeNotifier();
    await syncPrayerReminders({ notifier: noLoc.notifier, reminders: fakeReminders({ prayers: { dhuhr: true } }), timings: provider(null), now });
    expect(noLoc.scheduled.size).toBe(0);
  });

  it("schedules a prayer with the exact label, copy and time", async () => {
    const { notifier, scheduled } = fakeNotifier();
    await syncPrayerReminders({ notifier, reminders: fakeReminders({ prayers: { dhuhr: true } }), timings: provider(TIMINGS), now });
    const n = scheduled.get(prayerReminderId("dhuhr"))!;
    expect(n.title).toBe("Dhuhr — time to pray");
    expect(n.body).toBe("It’s time for prayer. Tap to open Ummah Library.");
    expect(n.at).toBe(TIMINGS.dhuhr); // the timing instant is echoed straight through
    expect(n.tag).toBe(prayerReminderId("dhuhr"));
  });
});

describe("reminder ids and constants", () => {
  it("pins the stable ids and the default plan time", () => {
    expect(DEFAULT_PLAN_REMINDER_TIME).toBe("20:00");
    expect(PLAN_REMINDER_ID).toBe("plan:daily");
    expect(adhkarReminderId("morning")).toBe("adhkar:morning");
    expect(adhkarReminderId("evening")).toBe("adhkar:evening");
    expect(prayerReminderId("fajr")).toBe("prayer:fajr");
  });
});

describe("reminder families are independent (cancel-by-id, not cancelAll)", () => {
  it("syncing adhkar leaves a scheduled prayer reminder intact", async () => {
    const { notifier, scheduled } = fakeNotifier();
    const reminders = fakeReminders({ prayers: { dhuhr: true }, adhkarOn: true });
    await syncPrayerReminders({ notifier, reminders, timings: provider(TIMINGS), now });
    expect(scheduled.has(prayerReminderId("dhuhr"))).toBe(true);

    await syncAdhkarReminder({ notifier, reminders, timings: provider(TIMINGS), now });
    expect(scheduled.has(prayerReminderId("dhuhr"))).toBe(true); // not wiped by adhkar's cancels
    expect(scheduled.has(adhkarReminderId("evening"))).toBe(true);
  });
});
