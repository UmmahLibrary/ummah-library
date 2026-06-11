import { describe, expect, it } from "vitest";
import type { HifzCard } from "@ummahlibrary/core";
import { allRecords, dueRecords, getCard, isTracked, removeCard, setCard } from "./hifz-store";

const card = (due: string): HifzCard => ({
  repetitions: 1,
  easeFactor: 2.5,
  intervalDays: 1,
  due,
  lastReviewed: null,
});

describe("hifz store", () => {
  it("sets, gets, tracks and removes a card", () => {
    const ref = { sura: 2, aya: 255 };
    expect(getCard(ref)).toBeNull();
    expect(isTracked(ref)).toBe(false);

    setCard(ref, card("2030-01-01T00:00:00.000Z"));
    expect(isTracked(ref)).toBe(true);
    expect(getCard(ref)?.due).toBe("2030-01-01T00:00:00.000Z");

    removeCard(ref);
    expect(getCard(ref)).toBeNull();
  });

  it("lists records sorted by verse and filters those due", () => {
    setCard({ sura: 2, aya: 1 }, card("2000-01-01T00:00:00.000Z")); // past — due
    setCard({ sura: 1, aya: 1 }, card("2099-01-01T00:00:00.000Z")); // future — not due

    expect(allRecords().map((r) => `${r.ref.sura}:${r.ref.aya}`)).toEqual(["1:1", "2:1"]);

    const due = dueRecords(new Date("2026-06-11T00:00:00.000Z"));
    expect(due.map((r) => `${r.ref.sura}:${r.ref.aya}`)).toEqual(["2:1"]);
  });
});
