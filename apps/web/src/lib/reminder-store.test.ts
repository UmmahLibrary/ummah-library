import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dismissAdhkar, readAdhkarSeen, webReminderStore as store } from "./reminder-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("webReminderStore", () => {
  it("reads the defaults when nothing is stored", async () => {
    expect(await store.read()).toEqual({
      plan: { on: false, time: "20:00" },
      prayers: {},
      adhkarOn: false,
      sunnahFastOn: false,
      islamicEvents: {},
    });
  });

  it("round-trips plan, prayer, adhkar, sunnah-fast, and event preferences under the existing keys", async () => {
    await store.writePlan({ on: true, time: "07:30" });
    await store.writePrayers({ fajr: true, isha: false });
    await store.writeAdhkarOn(true);
    await store.writeSunnahFastOn(true);
    await store.writeIslamicEvents({ "eid-al-fitr": true, arafah: false });

    const r = await store.read();
    expect(r.plan).toEqual({ on: true, time: "07:30" });
    expect(r.prayers).toEqual({ fajr: true, isha: false });
    expect(r.adhkarOn).toBe(true);
    expect(r.sunnahFastOn).toBe(true);
    expect(r.islamicEvents).toEqual({ "eid-al-fitr": true, arafah: false });
    // adhkar / sunnah-fast stay the historical "on"/"off" string
    expect(localStorage.getItem("ul.adhkarReminders")).toBe("on");
    expect(localStorage.getItem("ul.sunnahFastReminders")).toBe("on");
  });

  it("falls back safely on malformed stored values", async () => {
    localStorage.setItem("ul.planReminder", "{nope");
    localStorage.setItem("ul.prayerReminders", "{nope");
    const r = await store.read();
    expect(r.plan).toEqual({ on: false, time: "20:00" });
    expect(r.prayers).toEqual({});
  });
});

describe("adhkar banner dismissed-today state", () => {
  it("records and reads dismissals for today", () => {
    expect(readAdhkarSeen()).toEqual([]);
    dismissAdhkar("morning");
    expect(readAdhkarSeen()).toContain("morning");
    // dismissing again is idempotent
    dismissAdhkar("morning");
    expect(readAdhkarSeen()).toEqual(["morning"]);
  });

  it("ignores dismissals recorded on a previous day", () => {
    dismissAdhkar("evening", new Date("2026-06-20T10:00:00Z"));
    expect(readAdhkarSeen(new Date("2026-06-21T10:00:00Z"))).toEqual([]);
  });
});
