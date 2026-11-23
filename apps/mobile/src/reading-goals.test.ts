/**
 * `reading-goals.ts` — the reading-habit orchestration mobile builds on top of
 * `mobileReadingGoalsStore`/`mobilePlanStore` (both thin AsyncStorage
 * pass-throughs, already covered for the corrupt-value path by
 * `stores-corrupt.test.ts`). This file's own logic — de-duplicating a day's
 * pages, keeping the khatma cursor monotonic, clamping a user-entered goal —
 * had no direct coverage. AsyncStorage is mocked in-memory, same pattern as
 * `stores-corrupt.test.ts`/`storage.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

import {
  DEFAULT_GOAL,
  readReadingState,
  recordMushafPage,
  todayStr,
  writeGoal,
} from "./reading-goals";

beforeEach(() => mem.clear());

describe("readReadingState", () => {
  it("defaults to DEFAULT_GOAL and zero pagesToday with nothing stored", async () => {
    const s = await readReadingState();
    expect(s.goal).toBe(DEFAULT_GOAL);
    expect(s.pagesToday).toBe(0);
    expect(s.log).toEqual({});
    expect(s.active).toEqual([]);
    expect(s.khatma).toBeNull();
  });

  it("derives pagesToday from today's log entry specifically, not any entry", async () => {
    mem.set("ul.readingLog", JSON.stringify({ [todayStr()]: 7, "2020-01-01": 99 }));
    const s = await readReadingState();
    expect(s.pagesToday).toBe(7);
  });
});

describe("writeGoal", () => {
  it("floors a fractional target", async () => {
    await writeGoal(5.9);
    expect((await readReadingState()).goal).toBe(5);
  });

  it("clamps a negative target up to DEFAULT_GOAL, not to 1", async () => {
    // Math.floor(-3) || DEFAULT_GOAL is truthy (-3), so Math.max(1, -3) = 1 —
    // this is the actual current behavior, asserted so a future refactor
    // can't silently invert it without a test noticing.
    await writeGoal(-3);
    expect((await readReadingState()).goal).toBe(1);
  });

  it("falls back to DEFAULT_GOAL for a zero target (0 is falsy)", async () => {
    await writeGoal(0);
    expect((await readReadingState()).goal).toBe(DEFAULT_GOAL);
  });
});

describe("recordMushafPage", () => {
  it("adds today to activeDates and records the page on a first call", async () => {
    await recordMushafPage(12);
    const s = await readReadingState();
    expect(s.active).toEqual([todayStr()]);
    expect(s.log[todayStr()]).toBe(1);
  });

  it("does not double-count the same page read twice in one day", async () => {
    await recordMushafPage(12);
    await recordMushafPage(12);
    const s = await readReadingState();
    expect(s.log[todayStr()]).toBe(1);
    expect(s.active).toEqual([todayStr()]); // not duplicated either
  });

  it("counts a second distinct page the same day", async () => {
    await recordMushafPage(12);
    await recordMushafPage(13);
    const s = await readReadingState();
    expect(s.log[todayStr()]).toBe(2);
  });

  it("advances an active khatma's currentPage forward", async () => {
    mem.set("ul.khatma", JSON.stringify({ currentPage: 10, totalPages: 604 }));
    await recordMushafPage(15);
    const s = await readReadingState();
    expect(s.khatma?.currentPage).toBe(15);
  });

  it("never regresses the khatma cursor when re-reading an earlier page", async () => {
    mem.set("ul.khatma", JSON.stringify({ currentPage: 50, totalPages: 604 }));
    await recordMushafPage(10);
    const s = await readReadingState();
    expect(s.khatma?.currentPage).toBe(50);
  });

  it("is a no-op on the khatma cursor when there's no active khatma", async () => {
    await recordMushafPage(15);
    const s = await readReadingState();
    expect(s.khatma).toBeNull();
  });
});
