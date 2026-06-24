import { beforeEach, describe, expect, it } from "vitest";
import {
  type ActivePlan,
  type PlanTemplate,
  activatePlan,
  addDays,
  buildBackup,
  rangeOfJuz,
  rangeOfPages,
  templateById,
  toggleDayComplete,
} from "@ummahlibrary/core";
import { webPlanStore } from "./plan-store";
import {
  READING_PLAN_EVENT,
  advancePlanToPage,
  clearPlan,
  extendPlanBy,
  readActivePlan,
  rebalancePlan,
  startCustomPlan,
  startPlan,
  todayStr,
  toggleDay,
} from "./reading-plan";
import { clearAllData, collectLocalData, importBackup } from "./backup";

/** An active plan with a little progress, for round-trip checks. */
const samplePlan = () => toggleDayComplete(activatePlan(templateById("ramadan-khatm")!, "2026-03-01"), 3);

describe("webPlanStore (PlanStore adapter)", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips an active plan through storage (survives reload)", async () => {
    expect(await webPlanStore.read()).toBeNull();
    const plan = samplePlan();
    await webPlanStore.write(plan);
    expect(await webPlanStore.read()).toEqual(plan);
    await webPlanStore.clear();
    expect(await webPlanStore.read()).toBeNull();
  });

  it("reads null when storage holds garbage", async () => {
    localStorage.setItem("ul.readingPlan", "{not json");
    expect(await webPlanStore.read()).toBeNull();
  });

  it("reads null for a structurally-corrupt plan (valid JSON, wrong shape)", async () => {
    // A peer-synced or corrupt ul.readingPlan that parses but lacks a usable
    // template/units would make planDuration throw at render — drop it instead.
    const corrupt = [
      "{}",
      '{"template":{"range":{"units":[]},"schedule":{"kind":"fixed","unitsPerDay":1}},"startDate":"2026-01-01","unitsRead":0}',
      '{"template":null,"startDate":"2026-01-01","unitsRead":0}',
      '"oops"',
      "5",
      "[]",
    ];
    for (const bad of corrupt) {
      localStorage.setItem("ul.readingPlan", bad);
      expect(await webPlanStore.read()).toBeNull();
    }
  });
});

describe("reading-plan glue", () => {
  beforeEach(() => localStorage.clear());

  it("starts, toggles and clears the active plan, emitting refresh events", async () => {
    let events = 0;
    const onEvt = () => {
      events++;
    };
    window.addEventListener(READING_PLAN_EVENT, onEvt);

    expect(await readActivePlan()).toBeNull();
    await startPlan("ramadan-khatm");
    expect((await readActivePlan())?.template.id).toBe("ramadan-khatm");

    await toggleDay(1);
    expect((await readActivePlan())?.unitsRead).toBe(1);

    await clearPlan();
    expect(await readActivePlan()).toBeNull();

    window.removeEventListener(READING_PLAN_EVENT, onEvt);
    expect(events).toBeGreaterThanOrEqual(3); // start + toggle + clear
  });

  it("ignores an unknown template and formats today as YYYY-MM-DD", async () => {
    await startPlan("does-not-exist");
    expect(await readActivePlan()).toBeNull();
    expect(todayStr(new Date(2026, 2, 5))).toBe("2026-03-05");
  });

  it("starts a one-off custom plan from a synthesized template", async () => {
    const template: PlanTemplate = {
      id: "custom",
      name: "Your plan",
      tag: "302 days",
      len: "2 pages a day",
      desc: "Two pages a day.",
      range: rangeOfPages(1, 604),
      schedule: { kind: "fixed", unitsPerDay: 2 },
    };
    await startCustomPlan(template);
    const active = await readActivePlan();
    expect(active?.template.id).toBe("custom");
    expect(active?.template.schedule).toEqual({ kind: "fixed", unitsPerDay: 2 });
    expect(active?.unitsRead).toBe(0);
  });
});

describe("plan state through export/import (acceptance #61)", () => {
  beforeEach(() => localStorage.clear());

  it("survives an export → wipe → import round-trip", async () => {
    const plan = samplePlan();
    await webPlanStore.write(plan);

    // Export everything, then simulate a fresh device.
    const fileText = JSON.stringify(buildBackup(collectLocalData(), new Date()));
    clearAllData();
    expect(await webPlanStore.read()).toBeNull();

    // Import the backup → the plan comes back intact.
    const result = importBackup(fileText, "replace");
    expect(result.ok).toBe(true);
    expect(await webPlanStore.read()).toEqual(plan);
  });
});

describe("re-pace glue (#70)", () => {
  beforeEach(() => localStorage.clear());

  /** A behind plan: started 10 days ago, ends 90 days out, barely read. */
  const behindPlan = (): ActivePlan => {
    const today = todayStr();
    return {
      template: {
        id: "x",
        name: "X",
        tag: "",
        len: "",
        desc: "",
        range: rangeOfJuz(1, 30),
        schedule: { kind: "targetDate", endDate: addDays(today, 90) },
      },
      startDate: addDays(today, -10),
      unitsRead: 1,
    };
  };

  it("rebalances the active plan, keeping its end date and re-anchoring at today", async () => {
    const today = todayStr();
    await webPlanStore.write(behindPlan());
    await rebalancePlan();
    const after = await readActivePlan();
    expect(after?.anchor).toEqual({ date: today, units: 1 });
    expect(after?.template.schedule).toEqual({ kind: "targetDate", endDate: addDays(today, 90) });
  });

  it("extends the active plan's end date by a week and re-anchors", async () => {
    const today = todayStr();
    await webPlanStore.write(behindPlan());
    await extendPlanBy(7);
    const after = await readActivePlan();
    expect(after?.template.schedule).toEqual({ kind: "targetDate", endDate: addDays(today, 97) });
    expect(after?.anchor?.date).toBe(today);
  });

  it("advances the active plan as pages are read (#69)", async () => {
    await webPlanStore.write(activatePlan(templateById("quran-year")!, todayStr())); // page plan, 2/day
    await advancePlanToPage(5);
    expect((await readActivePlan())?.unitsRead).toBe(5);
  });
});
