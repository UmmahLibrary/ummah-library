/**
 * Web sync-meta tests (#25, ADR 0033/0035). Locks the diff-at-sync clock logic —
 * especially the invariant that a fresh device must NOT tombstone a key it has
 * simply never seen (which would let its emptiness win LWW and wipe another
 * device) — plus the dirty/pushed-hash tracking that drives the bounded push.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clockOf,
  dirtyOf,
  loadMeta,
  markPushedIn,
  reconcileMeta,
  saveMeta,
  setClockIn,
  type Meta,
} from "./sync-meta";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const NOW = new Date(1_700_000_000_000);

describe("reconcileMeta", () => {
  it("stamps a key that has a value but no prior meta as a first local write", () => {
    const meta: Meta = {};
    const changed = reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "v"]]), NOW, "n1");
    expect(changed).toBe(true);
    expect(meta["ul.x"]!.hlc).toEqual({ millis: NOW.getTime(), counter: 0, node: "n1" });
  });

  it("leaves a never-seen ABSENT key untouched — absence is unknown, not deletion", () => {
    const meta: Meta = {};
    const changed = reconcileMeta(meta, ["ul.x"], new Map([["ul.x", null]]), NOW, "n1");
    expect(changed).toBe(false);
    expect(meta["ul.x"]).toBeUndefined();
  });

  it("tombstones a key that HAD a value and is now absent (a real deletion)", () => {
    const meta: Meta = { "ul.x": { hlc: { millis: 1000, counter: 0, node: "n1" }, hash: "abc" } };
    const changed = reconcileMeta(meta, ["ul.x"], new Map([["ul.x", null]]), NOW, "n1");
    expect(changed).toBe(true);
    expect(meta["ul.x"]!.hlc.millis).toBe(NOW.getTime());
    expect(meta["ul.x"]!.hash).toBe("_");
  });

  it("does not bump a key whose value is unchanged", () => {
    const meta: Meta = {};
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "v"]]), NOW, "n1");
    const first = meta["ul.x"];
    const changed = reconcileMeta(
      meta,
      ["ul.x"],
      new Map([["ul.x", "v"]]),
      new Date(NOW.getTime() + 9999),
      "n1",
    );
    expect(changed).toBe(false);
    expect(meta["ul.x"]).toBe(first);
  });

  it("advances counter (not millis) when two writes land in the same instant", () => {
    const meta: Meta = {};
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "a"]]), NOW, "n1");
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "b"]]), NOW, "n1");
    expect(meta["ul.x"]!.hlc).toEqual({ millis: NOW.getTime(), counter: 1, node: "n1" });
  });

  it("preserves pushedHash across a clock bump (a local edit doesn't un-push a prior push)", () => {
    const meta: Meta = { "ul.x": { hlc: { millis: 1, counter: 0, node: "n1" }, hash: "a", pushedHash: "a" } };
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "b"]]), NOW, "n1");
    expect(meta["ul.x"]!.pushedHash).toBe("a"); // unchanged — now differs from hash ⇒ dirty
    expect(meta["ul.x"]!.hash).not.toBe(meta["ul.x"]!.pushedHash);
  });
});

describe("clockOf / setClockIn", () => {
  it("returns a zero clock for an unknown key and the stored clock once set", () => {
    const meta: Meta = {};
    expect(clockOf(meta, "ul.x", "n1")).toEqual({ millis: 0, counter: 0, node: "n1" });
    const hlc = { millis: 5, counter: 2, node: "remote" };
    setClockIn(meta, "ul.x", "v", hlc);
    expect(clockOf(meta, "ul.x", "n1")).toEqual(hlc);
  });
});

describe("dirtyOf / markPushedIn", () => {
  it("is dirty when never pushed, and clean right after markPushedIn", () => {
    const meta: Meta = {};
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "v"]]), NOW, "n1");
    expect(dirtyOf(meta, "ul.x")).toBe(true);
    markPushedIn(meta, ["ul.x"]);
    expect(dirtyOf(meta, "ul.x")).toBe(false);
  });

  it("goes dirty again after a further local change, independent of other keys", () => {
    const meta: Meta = {};
    reconcileMeta(meta, ["ul.x", "ul.y"], new Map([["ul.x", "v"], ["ul.y", "w"]]), NOW, "n1");
    markPushedIn(meta, ["ul.x", "ul.y"]);
    expect(dirtyOf(meta, "ul.x")).toBe(false);
    expect(dirtyOf(meta, "ul.y")).toBe(false);
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "v2"]]), new Date(NOW.getTime() + 1), "n1");
    expect(dirtyOf(meta, "ul.x")).toBe(true);
    expect(dirtyOf(meta, "ul.y")).toBe(false); // untouched key stays clean
  });

  it("treats a key with no meta at all as dirty (safest default)", () => {
    expect(dirtyOf({}, "ul.unknown")).toBe(true);
  });

  it("markPushedIn is a no-op for a key with no meta yet", () => {
    const meta: Meta = {};
    expect(() => markPushedIn(meta, ["ul.x"])).not.toThrow();
    expect(meta["ul.x"]).toBeUndefined();
  });
});

describe("loadMeta / saveMeta", () => {
  it("round-trips a structural clock and pushedHash losslessly", () => {
    const meta: Meta = { "ul.x": { hlc: { millis: 5, counter: 2, node: "abc-123" }, hash: "h", pushedHash: "h" } };
    saveMeta(meta);
    expect(loadMeta()).toEqual(meta);
  });

  it("returns {} for missing or non-JSON sidecar", () => {
    expect(loadMeta()).toEqual({});
    localStorage.setItem("ul.sync.meta", "{not json");
    expect(loadMeta()).toEqual({});
  });

  it("migrates the legacy `millis:counter:node` string clock", () => {
    localStorage.setItem("ul.sync.meta", JSON.stringify({ "ul.x": { hlc: "7:1:node9", hash: "h" } }));
    expect(loadMeta()).toEqual({ "ul.x": { hlc: { millis: 7, counter: 1, node: "node9" }, hash: "h" } });
  });

  it("drops entries with a corrupt clock or hash rather than trusting them", () => {
    localStorage.setItem(
      "ul.sync.meta",
      JSON.stringify({
        ok: { hlc: { millis: 1, counter: 0, node: "a" }, hash: "h" },
        badClock: { hlc: { millis: "x", node: 1 }, hash: "h" },
        badStr: { hlc: "nope", hash: "h" },
        badHash: { hlc: { millis: 1, counter: 0, node: "a" }, hash: 5 },
      }),
    );
    expect(Object.keys(loadMeta())).toEqual(["ok"]);
  });

  it("drops a structurally-corrupt clock from the sidecar rather than trusting it", () => {
    // A corrupt/peer-synced ul.sync.meta with a bad structural clock must not be
    // carried into clockOf → hlcCompare/hlcTick (where it produces NaN ordering).
    localStorage.setItem(
      "ul.sync.meta",
      JSON.stringify({ "ul.x": { hlc: { millis: "abc", counter: null, node: 42 }, hash: "h" } }),
    );
    expect(clockOf(loadMeta(), "ul.x", "n1")).toEqual({ millis: 0, counter: 0, node: "n1" });
  });

  it("preserves a large valid clock losslessly through setClockIn → loadMeta/saveMeta → clockOf", () => {
    // The legacy encoded-string form would round-trip a big millis/counter through
    // parseHlc; structural storage must preserve it exactly so an applied remote
    // entry is never re-applied (the cycle-1 infinite-re-apply regression).
    const meta: Meta = {};
    setClockIn(meta, "ul.x", "[1]", { millis: 9_000_000_000_000_000, counter: 3, node: "remote-device" });
    saveMeta(meta);
    expect(clockOf(loadMeta(), "ul.x", "n1")).toEqual({
      millis: 9_000_000_000_000_000,
      counter: 3,
      node: "remote-device",
    });
  });
});
