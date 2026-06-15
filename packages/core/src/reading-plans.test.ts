import { describe, expect, it } from "vitest";
import {
  PLANS,
  type PlanProgress,
  currentPlanDay,
  planById,
  planPercent,
  planWeekWindow,
  togglePlanDay,
} from "./reading-plans";

const progressFor = (planId: string, completed: number[]): PlanProgress => ({
  planId,
  startDate: "2026-01-01",
  completed,
});

describe("PLANS", () => {
  it("ships well-formed plans with readable day targets", () => {
    expect(PLANS.length).toBeGreaterThan(0);
    for (const plan of PLANS) {
      expect(plan.id.length).toBeGreaterThan(0);
      expect(plan.days.length).toBeGreaterThan(0);
      for (const day of plan.days) {
        expect(day.label.length).toBeGreaterThan(0);
        if (day.target.kind === "juz") {
          expect(day.target.juz).toBeGreaterThanOrEqual(1);
          expect(day.target.juz).toBeLessThanOrEqual(30);
        } else {
          expect(day.target.surah).toBeGreaterThanOrEqual(1);
          expect(day.target.surah).toBeLessThanOrEqual(114);
        }
      }
    }
  });
});

describe("planById", () => {
  it("finds a known plan and returns undefined otherwise", () => {
    expect(planById("ramadan-khatm")?.name).toBe("Ramaḍān Khatm");
    expect(planById("does-not-exist")).toBeUndefined();
  });
});

describe("currentPlanDay", () => {
  const plan = planById("juz-amma")!;

  it("is day 1 when nothing is completed", () => {
    expect(currentPlanDay(plan, progressFor(plan.id, []))).toBe(1);
  });

  it("returns the first uncompleted day", () => {
    expect(currentPlanDay(plan, progressFor(plan.id, [0, 1]))).toBe(3);
  });

  it("skips completed days that are out of order", () => {
    expect(currentPlanDay(plan, progressFor(plan.id, [0, 2]))).toBe(2);
  });

  it("caps at the plan length when every day is done", () => {
    const all = plan.days.map((_, i) => i);
    expect(currentPlanDay(plan, progressFor(plan.id, all))).toBe(plan.days.length);
  });
});

describe("planPercent", () => {
  const plan = planById("jewels")!;

  it("is 0 when nothing is done", () => {
    expect(planPercent(plan, progressFor(plan.id, []))).toBe(0);
  });

  it("rounds partial progress", () => {
    // 2 of 5 days = 40%
    expect(planPercent(plan, progressFor(plan.id, [0, 1]))).toBe(40);
  });

  it("is 100 when complete", () => {
    const all = plan.days.map((_, i) => i);
    expect(planPercent(plan, progressFor(plan.id, all))).toBe(100);
  });

  it("guards against an empty plan", () => {
    const empty = { ...plan, days: [] };
    expect(planPercent(empty, progressFor(plan.id, []))).toBe(0);
  });
});

describe("togglePlanDay", () => {
  it("marks a day complete, keeping the list sorted", () => {
    const next = togglePlanDay(progressFor("p", [2, 0]), 1);
    expect(next.completed).toEqual([0, 1, 2]);
  });

  it("unmarks an already-completed day", () => {
    const next = togglePlanDay(progressFor("p", [0, 1, 2]), 1);
    expect(next.completed).toEqual([0, 2]);
  });

  it("preserves the rest of the progress object", () => {
    const before = progressFor("p", []);
    const after = togglePlanDay(before, 0);
    expect(after.planId).toBe(before.planId);
    expect(after.startDate).toBe(before.startDate);
  });
});

describe("planWeekWindow", () => {
  const ramadan = planById("ramadan-khatm")!; // 30 days
  const jewels = planById("jewels")!; // 5 days

  it("centres a seven-day window around the current day", () => {
    expect(planWeekWindow(ramadan, 10)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });

  it("clamps to the start of the plan", () => {
    expect(planWeekWindow(ramadan, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("clamps to the end of the plan", () => {
    expect(planWeekWindow(ramadan, 30)).toEqual([24, 25, 26, 27, 28, 29, 30]);
  });

  it("shrinks the window for short plans", () => {
    expect(planWeekWindow(jewels, 1)).toEqual([1, 2, 3, 4, 5]);
  });
});
