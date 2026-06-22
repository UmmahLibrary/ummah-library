import { describe, expect, it } from "vitest";
import { adjustQada, makeUp, owedFor, recordMissed, setQada, totalOwed, type QadaLog } from "./qada";

describe("qada (missed-prayer backlog)", () => {
  it("reports zero owed for an empty log", () => {
    expect(owedFor({}, "fajr")).toBe(0);
    expect(totalOwed({})).toBe(0);
  });

  it("reads an existing balance and sums the total", () => {
    const log: QadaLog = { fajr: 3, isha: 2 };
    expect(owedFor(log, "fajr")).toBe(3);
    expect(owedFor(log, "dhuhr")).toBe(0);
    expect(totalOwed(log)).toBe(5);
  });

  it("clamps corrupt stored values (negative / fractional / non-finite) to a safe count", () => {
    expect(owedFor({ fajr: -4 }, "fajr")).toBe(0);
    expect(owedFor({ fajr: 2.9 }, "fajr")).toBe(2);
    expect(owedFor({ fajr: Number.NaN }, "fajr")).toBe(0);
    expect(owedFor({ fajr: Infinity }, "fajr")).toBe(0);
  });

  it("setQada stores an explicit count and is immutable", () => {
    const log: QadaLog = {};
    const next = setQada(log, "asr", 5);
    expect(next.asr).toBe(5);
    expect(log).toEqual({}); // original untouched
  });

  it("setQada drops the entry when set to zero (keeps the log sparse)", () => {
    expect(setQada({ asr: 5 }, "asr", 0)).toEqual({});
    expect(setQada({ asr: 5 }, "asr", -3)).toEqual({}); // clamped to 0 → dropped
  });

  it("setQada floors fractional inputs", () => {
    expect(setQada({}, "maghrib", 3.8).maghrib).toBe(3);
  });

  it("adjustQada increments and decrements, clamped at zero", () => {
    let log: QadaLog = {};
    log = adjustQada(log, "fajr", 2);
    expect(log.fajr).toBe(2);
    log = adjustQada(log, "fajr", -1);
    expect(log.fajr).toBe(1);
    log = adjustQada(log, "fajr", -5); // cannot go negative; entry dropped at 0
    expect(log.fajr).toBeUndefined();
    expect(totalOwed(log)).toBe(0);
  });

  it("adjustQada truncates a fractional delta", () => {
    expect(adjustQada({}, "isha", 2.9).isha).toBe(2);
  });

  it("recordMissed adds one and makeUp removes one", () => {
    const afterMiss = recordMissed(recordMissed({}, "dhuhr"), "dhuhr");
    expect(afterMiss.dhuhr).toBe(2);
    expect(makeUp(afterMiss, "dhuhr").dhuhr).toBe(1);
  });

  it("makeUp is a no-op when none are owed", () => {
    expect(makeUp({}, "asr")).toEqual({});
  });
});
