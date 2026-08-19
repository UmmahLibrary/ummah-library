import { describe, expect, it } from "vitest";
import { DHIKR_PHRASES, TASBIH_TARGETS, tasbihPhraseProgress, tasbihState } from "./tasbih";

describe("tasbihState", () => {
  it("cycles the count within a round and counts rounds", () => {
    expect(tasbihState(0, 33)).toEqual({ count: 0, rounds: 0, total: 0 });
    expect(tasbihState(1, 33)).toEqual({ count: 1, rounds: 0, total: 1 });
    expect(tasbihState(33, 33)).toEqual({ count: 0, rounds: 1, total: 33 });
    expect(tasbihState(34, 33)).toEqual({ count: 1, rounds: 1, total: 34 });
    expect(tasbihState(100, 33)).toEqual({ count: 1, rounds: 3, total: 100 });
  });
  it("guards against bad inputs", () => {
    expect(tasbihState(-5, 33)).toEqual({ count: 0, rounds: 0, total: 0 });
    expect(tasbihState(5, 0)).toEqual({ count: 0, rounds: 5, total: 5 });
  });
});

describe("catalogues", () => {
  it("offers the five core dhikr phrases with stable ids and complete text", () => {
    // The ids key the persisted counter; arabic/transliteration/meaning are shown
    // to the user. Pin the table's shape (ids + non-empty fields) without hard-coding
    // the exact script/prose, so a blanked or dropped phrase is caught.
    expect(DHIKR_PHRASES.map((p) => p.id)).toEqual([
      "subhanallah",
      "alhamdulillah",
      "allahuakbar",
      "tahlil",
      "istighfar",
    ]);
    for (const p of DHIKR_PHRASES) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.arabic.length).toBeGreaterThan(0);
      expect(p.transliteration.length).toBeGreaterThan(0);
      expect(p.meaning.length).toBeGreaterThan(0);
    }
  });

  it("offers the common per-round targets", () => {
    expect(TASBIH_TARGETS).toEqual([33, 99, 100]);
  });
});

describe("tasbihPhraseProgress", () => {
  it("returns a phrase's own stored progress untouched", () => {
    const record = {
      phraseId: "alhamdulillah",
      phrases: { subhanallah: { total: 35, target: 33 }, alhamdulillah: { total: 5, target: 33 } },
    };
    expect(tasbihPhraseProgress(record, "alhamdulillah")).toEqual({ total: 5, target: 33 });
    // Switching away and back must not touch another phrase's entry.
    expect(tasbihPhraseProgress(record, "subhanallah")).toEqual({ total: 35, target: 33 });
  });

  it("starts an uncounted phrase at zero, using its default target", () => {
    const record = { phraseId: "tahlil", phrases: {} };
    expect(tasbihPhraseProgress(record, "tahlil")).toEqual({ total: 0, target: 100 });
    expect(tasbihPhraseProgress(record, "allahuakbar")).toEqual({ total: 0, target: 34 });
  });

  it("falls back to 33 for a phrase with no known default (e.g. istighfar)", () => {
    const record = { phraseId: "istighfar", phrases: {} };
    expect(tasbihPhraseProgress(record, "istighfar")).toEqual({ total: 0, target: 33 });
  });
});
