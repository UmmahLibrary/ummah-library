import { describe, expect, it } from "vitest";
import {
  type Hlc,
  type SyncEntry,
  encodeHlc,
  hlcCompare,
  hlcInit,
  hlcTick,
  mergeEntries,
  parseHlc,
} from "./sync";

const at = (millis: number, counter = 0, node = "a"): Hlc => ({ millis, counter, node });
const entry = (id: string, hlc: Hlc, ciphertext: string | null = "c"): SyncEntry => ({
  id,
  hlc,
  ciphertext,
  nonce: ciphertext === null ? "" : "n",
});

describe("hlcInit", () => {
  it("starts at zero for the given node", () => {
    expect(hlcInit("dev1")).toEqual({ millis: 0, counter: 0, node: "dev1" });
  });
});

describe("hlcTick", () => {
  it("advances to the wall clock and resets the counter when time moved on", () => {
    expect(hlcTick(at(100, 5), new Date(200))).toEqual({ millis: 200, counter: 0, node: "a" });
  });
  it("bumps the counter when the wall clock has not advanced", () => {
    expect(hlcTick(at(200, 5), new Date(200))).toEqual({ millis: 200, counter: 6, node: "a" });
    expect(hlcTick(at(200, 5), new Date(150))).toEqual({ millis: 200, counter: 6, node: "a" });
  });
  it("never goes backwards", () => {
    const a = at(1000, 0);
    const b = hlcTick(a, new Date(500));
    expect(hlcCompare(b, a)).toBeGreaterThan(0);
  });
});

describe("hlcCompare", () => {
  it("orders by physical time first", () => {
    expect(hlcCompare(at(10), at(20))).toBeLessThan(0);
    expect(hlcCompare(at(20), at(10))).toBeGreaterThan(0);
  });
  it("then by counter", () => {
    expect(hlcCompare(at(10, 1), at(10, 2))).toBeLessThan(0);
  });
  it("then by node id as the final tie-breaker", () => {
    expect(hlcCompare(at(10, 1, "a"), at(10, 1, "b"))).toBeLessThan(0);
    expect(hlcCompare(at(10, 1, "b"), at(10, 1, "a"))).toBeGreaterThan(0);
  });
  it("is zero only for identical clocks", () => {
    expect(hlcCompare(at(10, 1, "a"), at(10, 1, "a"))).toBe(0);
  });
});

describe("encodeHlc / parseHlc", () => {
  it("round-trips a clock", () => {
    const h = at(1718000000000, 3, "node-xyz");
    expect(parseHlc(encodeHlc(h))).toEqual(h);
  });
  it("keeps a node id that itself contains a colon", () => {
    const h: Hlc = { millis: 5, counter: 0, node: "ns:dev" };
    expect(parseHlc(encodeHlc(h))).toEqual(h);
  });
  it("rejects malformed strings", () => {
    expect(parseHlc("")).toBeNull();
    expect(parseHlc("123")).toBeNull();
    expect(parseHlc("123:4")).toBeNull();
    expect(parseHlc("x:4:node")).toBeNull();
    expect(parseHlc("12:y:node")).toBeNull();
    expect(parseHlc("12:4:")).toBeNull();
  });
  it("rejects numeric fields Number() would silently coerce (strict decimal)", () => {
    // Number("")===0, Number("0x10")===16, Number("1e3")===1000, Number(" 12")===12 —
    // each would fabricate a clock from malformed input, so they must be rejected.
    expect(parseHlc(":4:node")).toBeNull(); // empty millis
    expect(parseHlc("12::node")).toBeNull(); // empty counter
    expect(parseHlc("0x10:4:node")).toBeNull();
    expect(parseHlc("1e3:4:node")).toBeNull();
    expect(parseHlc("-1:4:node")).toBeNull();
    expect(parseHlc("1.5:4:node")).toBeNull();
    expect(parseHlc(" 12:4:node")).toBeNull();
  });
});

describe("mergeEntries", () => {
  it("keeps an entry only one side has, in the right bucket", () => {
    const mine = entry("x", at(10));
    const theirs = entry("y", at(10));
    const r = mergeEntries([mine], [theirs]);
    expect(r.merged.map((e) => e.id).sort()).toEqual(["x", "y"]);
    expect(r.incoming).toEqual([theirs]); // y is only on the remote → apply
    expect(r.outgoing).toEqual([mine]); // x is only here → push
  });

  it("lets the newer clock win when both have the id", () => {
    const older = entry("x", at(10), "old");
    const newer = entry("x", at(20), "new");
    const remoteWins = mergeEntries([older], [newer]);
    expect(remoteWins.merged).toEqual([newer]);
    expect(remoteWins.incoming).toEqual([newer]);
    expect(remoteWins.outgoing).toEqual([]);

    const localWins = mergeEntries([newer], [older]);
    expect(localWins.merged).toEqual([newer]);
    expect(localWins.incoming).toEqual([]);
    expect(localWins.outgoing).toEqual([newer]);
  });

  it("treats identical clocks as a no-op, keeping the LOCAL entry by reference", () => {
    // Same clock, different value: the tie must resolve to local (pins the
    // documented contract — merged.push(a), not push(b)).
    const localEntry = entry("x", at(10), "mine");
    const remoteEntry = entry("x", at(10), "theirs");
    const r = mergeEntries([localEntry], [remoteEntry]);
    expect(r.merged).toHaveLength(1);
    expect(r.merged[0]).toBe(localEntry); // reference identity, not just deep-equal
    expect(r.merged[0]!.ciphertext).toBe("mine");
    expect(r.incoming).toEqual([]);
    expect(r.outgoing).toEqual([]);
  });

  it("handles two empty sides", () => {
    expect(mergeEntries([], [])).toEqual({ merged: [], incoming: [], outgoing: [] });
  });
});
