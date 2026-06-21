import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFastsRaw, readWorshipRaw, writeFastsRaw, writeWorshipRaw } from "./ramadan-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("ramadan-store", () => {
  it("round-trips kept fasts", () => {
    expect(readFastsRaw()).toEqual({});
    writeFastsRaw({ 1: true, 3: true });
    expect(readFastsRaw()).toEqual({ 1: true, 3: true });
  });

  it("round-trips the per-date worship checklist", () => {
    expect(readWorshipRaw()).toEqual({});
    writeWorshipRaw({ "2026-03-01": { taraweeh: true } });
    expect(readWorshipRaw()["2026-03-01"]).toEqual({ taraweeh: true });
  });

  it("falls back to empty on a malformed value", () => {
    localStorage.setItem("ul.ramadanFasts", "{nope");
    expect(readFastsRaw()).toEqual({});
  });
});
