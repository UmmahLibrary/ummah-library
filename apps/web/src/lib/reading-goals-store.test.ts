import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { webReadingGoalsStore as store } from "./reading-goals-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("webReadingGoalsStore", () => {
  it("reads sensible defaults when nothing is stored", async () => {
    expect(await store.read()).toEqual({
      goal: null,
      activeDates: [],
      log: {},
      pages: { date: "", pages: [] },
      khatma: null,
    });
  });

  it("round-trips each piece under the existing keys", async () => {
    await store.writeGoal(7);
    await store.writeActiveDates(["2026-01-01"]);
    await store.writeLog({ "2026-01-01": 5 });
    await store.writePages({ date: "2026-01-01", pages: [1, 2] });
    await store.writeKhatma({ totalPages: 604, currentPage: 12, targetDate: "2030-01-01" });

    const s = await store.read();
    expect(s.goal).toBe(7);
    expect(s.activeDates).toEqual(["2026-01-01"]);
    expect(s.log).toEqual({ "2026-01-01": 5 });
    expect(s.pages).toEqual({ date: "2026-01-01", pages: [1, 2] });
    expect(s.khatma?.currentPage).toBe(12);
    // the adapter must keep the same localStorage key the backup reads
    expect(JSON.parse(localStorage.getItem("ul.readingGoal") ?? "{}").target).toBe(7);
  });

  it("removes the khatma when written null", async () => {
    await store.writeKhatma({ totalPages: 604, currentPage: 1, targetDate: "2030-01-01" });
    await store.writeKhatma(null);
    expect((await store.read()).khatma).toBeNull();
    expect(localStorage.getItem("ul.khatma")).toBeNull();
  });
});
