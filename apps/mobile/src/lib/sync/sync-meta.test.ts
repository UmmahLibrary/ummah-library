/**
 * Mobile sync-meta tests (#25, ADR 0033). Locks the diff-at-sync clock logic —
 * especially the invariant that a fresh device must NOT tombstone a key it has
 * simply never seen (which would let its emptiness win LWW and wipe another
 * device), and that corrupt/legacy sidecar entries are migrated or dropped.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => void mem.set(k, v),
    removeItem: async (k: string) => void mem.delete(k),
    multiGet: async (keys: string[]) => keys.map((k) => [k, mem.get(k) ?? null]),
  },
}));

import { clockOf, loadMeta, reconcileMeta, saveMeta, setClockIn, type Meta } from "./sync-meta";

const NOW = new Date(1_700_000_000_000);
beforeEach(() => mem.clear());

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
    const changed = reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "v"]]), new Date(NOW.getTime() + 9999), "n1");
    expect(changed).toBe(false);
    expect(meta["ul.x"]).toBe(first);
  });

  it("advances counter (not millis) when two writes land in the same instant", () => {
    const meta: Meta = {};
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "a"]]), NOW, "n1");
    reconcileMeta(meta, ["ul.x"], new Map([["ul.x", "b"]]), NOW, "n1");
    expect(meta["ul.x"]!.hlc).toEqual({ millis: NOW.getTime(), counter: 1, node: "n1" });
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

describe("loadMeta / saveMeta", () => {
  it("round-trips a structural clock losslessly", async () => {
    const meta: Meta = { "ul.x": { hlc: { millis: 5, counter: 2, node: "abc-123" }, hash: "h" } };
    await saveMeta(meta);
    expect(await loadMeta()).toEqual(meta);
  });

  it("returns {} for missing or non-JSON sidecar", async () => {
    expect(await loadMeta()).toEqual({});
    mem.set("ul.sync.meta", "{not json");
    expect(await loadMeta()).toEqual({});
  });

  it("migrates the legacy `millis:counter:node` string clock", async () => {
    mem.set("ul.sync.meta", JSON.stringify({ "ul.x": { hlc: "7:1:node9", hash: "h" } }));
    expect(await loadMeta()).toEqual({ "ul.x": { hlc: { millis: 7, counter: 1, node: "node9" }, hash: "h" } });
  });

  it("drops entries with a corrupt clock or hash rather than trusting them", async () => {
    mem.set(
      "ul.sync.meta",
      JSON.stringify({
        ok: { hlc: { millis: 1, counter: 0, node: "a" }, hash: "h" },
        badClock: { hlc: { millis: "x", node: 1 }, hash: "h" },
        badStr: { hlc: "nope", hash: "h" },
        badHash: { hlc: { millis: 1, counter: 0, node: "a" }, hash: 5 },
      }),
    );
    expect(Object.keys(await loadMeta())).toEqual(["ok"]);
  });
});
