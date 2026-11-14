import { describe, expect, it } from "vitest";
import {
  JUZ_START_PAGES,
  daysSinceLastActive,
  daysThisWeek,
  homeAction,
  khatmJourney,
  lastSevenDays,
  prayerIsNear,
} from "./consistency";

describe("days this week", () => {
  it("lists the last seven days ending today", () => {
    const days = lastSevenDays(["2026-11-14", "2026-11-10"], "2026-11-14");
    expect(days.map((d) => d.date)).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(days.filter((d) => d.active).map((d) => d.date)).toEqual(["2026-11-10", "2026-11-14"]);
    expect(days[6]!.isToday).toBe(true);
  });

  it("counts reading days and ignores older ones", () => {
    expect(daysThisWeek(["2026-11-14", "2026-11-13", "2026-10-01"], "2026-11-14")).toBe(2);
  });

  it("crosses month and year boundaries", () => {
    expect(lastSevenDays([], "2027-01-02")[0]!.date).toBe("2026-12-27");
  });
});

describe("daysSinceLastActive", () => {
  it("is null with no history and 0 when read today", () => {
    expect(daysSinceLastActive([], "2026-11-14")).toBeNull();
    expect(daysSinceLastActive(["2026-11-14"], "2026-11-14")).toBe(0);
    expect(daysSinceLastActive(["2026-11-10"], "2026-11-14")).toBe(4);
  });
});

describe("homeAction", () => {
  const at = { sura: 25, aya: 61 };
  it("offers a gentle start to a first-time reader", () => {
    expect(
      homeAction({ resume: null, activeDates: [], today: "2026-11-14", portionDone: false }),
    ).toEqual({
      kind: "start",
    });
  });

  it("continues where the reader left off", () => {
    expect(
      homeAction({
        resume: at,
        activeDates: ["2026-11-13"],
        today: "2026-11-14",
        portionDone: false,
      }),
    ).toEqual({ kind: "continue", at, welcomeBack: false });
  });

  it("welcomes back after a gap without counting missed days", () => {
    expect(
      homeAction({
        resume: at,
        activeDates: ["2026-11-01"],
        today: "2026-11-14",
        portionDone: false,
      }),
    ).toEqual({ kind: "continue", at, welcomeBack: true });
  });

  it("says today's portion is done", () => {
    expect(
      homeAction({
        resume: at,
        activeDates: ["2026-11-14"],
        today: "2026-11-14",
        portionDone: true,
      }),
    ).toEqual({ kind: "done", at });
  });
});

describe("prayerIsNear", () => {
  const now = new Date("2026-11-14T15:30:00Z");
  it("is true only for a prayer starting soon", () => {
    expect(prayerIsNear(new Date("2026-11-14T15:45:00Z"), now)).toBe(true);
    expect(prayerIsNear(new Date("2026-11-14T16:30:00Z"), now)).toBe(false);
    expect(prayerIsNear(new Date("2026-11-14T15:00:00Z"), now)).toBe(false);
  });
});

describe("khatmJourney", () => {
  it("starts with every juz to do", () => {
    expect(khatmJourney(0).every((s) => s === "todo")).toBe(true);
  });

  it("marks finished juz done and the current one now", () => {
    const j = khatmJourney(JUZ_START_PAGES[2]! + 3); // inside juz 3
    expect(j.slice(0, 2)).toEqual(["done", "done"]);
    expect(j[2]).toBe("now");
    expect(j[3]).toBe("todo");
  });

  it("completes on the last page", () => {
    expect(khatmJourney(604).every((s) => s === "done")).toBe(true);
  });

  it("knows where each juz begins", () => {
    expect(JUZ_START_PAGES[0]).toBe(1);
    expect(JUZ_START_PAGES).toHaveLength(30);
  });
});
