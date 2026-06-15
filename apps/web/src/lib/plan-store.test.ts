import { beforeEach, describe, expect, it } from "vitest";
import { activatePlan, buildBackup, templateById, toggleDayComplete } from "@ummahlibrary/core";
import { webPlanStore } from "./plan-store";
import {
  READING_PLAN_EVENT,
  clearPlan,
  readActivePlan,
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
