import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";
import { readEventReminders, setEventReminder, syncIslamicEventReminders } from "./islamic-event-reminders";

class FakeNotifier implements Notifier {
  scheduled = new Map<string, AppNotification>();
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
    this.scheduled.delete(id);
  }
  async cancelAll() {
    this.scheduled.clear();
  }
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("islamic-event reminder web wiring", () => {
  it("round-trips a per-event preference through the store", async () => {
    expect(await readEventReminders()).toEqual({});
    const next = await setEventReminder("eid-al-fitr", true);
    expect(next["eid-al-fitr"]).toBe(true);
    expect(await readEventReminders()).toEqual({ "eid-al-fitr": true });
  });

  it("turning an event off removes it from the map rather than storing false", async () => {
    await setEventReminder("eid-al-adha", true);
    const next = await setEventReminder("eid-al-adha", false);
    expect(next).toEqual({});
    expect(await readEventReminders()).toEqual({});
  });

  it("dispatches EVENT_REMINDERS_KEY with the updated map so open UI can re-read", async () => {
    const onChange = vi.fn();
    window.addEventListener("ul.islamicEventReminders", onChange);
    await setEventReminder("ramadan-start", true);
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener("ul.islamicEventReminders", onChange);
  });

  it("schedules nothing without permission", async () => {
    await setEventReminder("eid-al-fitr", true);
    const n = new FakeNotifier("denied");
    await syncIslamicEventReminders(n);
    expect(n.scheduled.size).toBe(0);
  });
});
