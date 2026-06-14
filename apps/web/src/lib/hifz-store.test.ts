import { describe, expect, it } from "vitest";
import type { HifzCard } from "@ummahlibrary/core";
import {
  allRecords,
  cardStrength,
  dueRecords,
  getCard,
  isTracked,
  removeCard,
  setCard,
  surahProgressMap,
} from "./hifz-store";

const card = (due: string, opts: Partial<HifzCard> = {}): HifzCard => ({
  repetitions: 1,
  easeFactor: 2.5,
  intervalDays: 1,
  due,
  lastReviewed: null,
  ...opts,
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

  it("scores card strength from interval, capped at 1", () => {
    // Never reviewed → no strength yet.
    expect(cardStrength(card("2030-01-01T00:00:00.000Z"))).toBe(0);
    // Reviewed, mid-interval → proportional.
    expect(
      cardStrength(card("2030-01-01T00:00:00.000Z", { lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 15 })),
    ).toBe(0.5);
    // Long interval → capped at 1.
    expect(
      cardStrength(card("2030-01-01T00:00:00.000Z", { lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 60 })),
    ).toBe(1);
  });

  it("aggregates per-surah progress, due counts, strength and earliest due", () => {
    const now = new Date("2026-06-14T00:00:00.000Z");
    // Surah 2: one due+memorized (strength 1), one not-due+fresh (strength 0).
    setCard(
      { sura: 2, aya: 1 },
      card("2000-01-01T00:00:00.000Z", { lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 30 }),
    );
    setCard({ sura: 2, aya: 2 }, card("2099-01-01T00:00:00.000Z"));
    // Surah 1: a single due card.
    setCard({ sura: 1, aya: 1 }, card("2000-06-01T00:00:00.000Z"));

    const map = surahProgressMap(now);

    const s2 = map.get(2)!;
    expect(s2.trackedCount).toBe(2);
    expect(s2.dueCount).toBe(1);
    expect(s2.avgStrength).toBe(0.5);
    expect(s2.nextDue).toBe("2000-01-01T00:00:00.000Z");

    const s1 = map.get(1)!;
    expect(s1.trackedCount).toBe(1);
    expect(s1.dueCount).toBe(1);
    expect(s1.avgStrength).toBe(0);
  });
});
