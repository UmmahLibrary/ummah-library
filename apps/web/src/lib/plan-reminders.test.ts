import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";
import { activatePlan, templateById } from "@ummahlibrary/core";
import { webPlanStore } from "./plan-store";
import {
  DEFAULT_PLAN_REMINDER_TIME,
  PLAN_REMINDER_ID,
  PLAN_REMINDER_KEY,
  readPlanReminderPref,
  setPlanReminderPref,
  syncPlanReminder,
} from "./plan-reminders";

/** An in-memory Notifier that records what was scheduled / cancelled. */
class FakeNotifier implements Notifier {
  scheduled = new Map<string, AppNotification>();
  cancelled: string[] = [];
  constructor(private readonly perm: NotifyPermission = "granted") {}
  isSupported() {
    return true;
  }
  permission() {
    return this.perm;
  }
  async requestPermission() {
    return this.perm;
  }
  async schedule(n: AppNotification) {
    this.scheduled.set(n.id, n);
  }
  async cancel(id: string) {
    this.cancelled.push(id);
    this.scheduled.delete(id);
  }
  async cancelAll() {
    this.scheduled.clear();
  }
}

const seedPlan = () =>
  webPlanStore.write(activatePlan(templateById("ramadan-khatm")!, "2026-01-01"));

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("plan reminder preference", () => {
  it("defaults to off at the default time", async () => {
    expect(await readPlanReminderPref()).toEqual({ on: false, time: DEFAULT_PLAN_REMINDER_TIME });
  });

  it("round-trips a saved preference", async () => {
    await setPlanReminderPref({ on: true, time: "07:30" });
    expect(await readPlanReminderPref()).toEqual({ on: true, time: "07:30" });
  });

  it("falls back safely on a malformed stored value", async () => {
    localStorage.setItem(PLAN_REMINDER_KEY, "{not json");
    expect((await readPlanReminderPref()).on).toBe(false);
  });
});

describe("syncPlanReminder", () => {
  it("schedules a daily nudge when on, granted, and a plan is active", async () => {
    await seedPlan();
    await setPlanReminderPref({ on: true, time: "20:00" });
    const n = new FakeNotifier("granted");
    await syncPlanReminder(n);

    expect(n.cancelled).toContain(PLAN_REMINDER_ID); // idempotent: cancels first
    const note = n.scheduled.get(PLAN_REMINDER_ID);
    expect(note).toBeDefined();
    expect(note?.title.length).toBeGreaterThan(0);
    expect(typeof note?.at).toBe("string");
  });

  it("is a no-op when the reminder is off", async () => {
    await seedPlan();
    await setPlanReminderPref({ on: false, time: "20:00" });
    const n = new FakeNotifier("granted");
    await syncPlanReminder(n);
    expect(n.scheduled.size).toBe(0);
  });

  it("is a no-op without notification permission", async () => {
    await seedPlan();
    await setPlanReminderPref({ on: true, time: "20:00" });
    const n = new FakeNotifier("denied");
    await syncPlanReminder(n);
    expect(n.scheduled.size).toBe(0);
  });

  it("is a no-op when no plan is active", async () => {
    await setPlanReminderPref({ on: true, time: "20:00" });
    const n = new FakeNotifier("granted");
    await syncPlanReminder(n);
    expect(n.scheduled.size).toBe(0);
  });
});
