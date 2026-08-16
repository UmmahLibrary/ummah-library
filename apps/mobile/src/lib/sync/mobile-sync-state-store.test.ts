/**
 * Mobile SyncStateStore tests (#25, ADR 0033). Verifies the store reads every
 * managed value in one pass, reconciles clocks against the sidecar, and applies a
 * remote winner to both the value and the clock — the local seam the engine drives.
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
vi.mock("./crypto-random", () => ({ randomBytes: () => new Uint8Array(0), randomId: () => "node-A" }));

import { explodeKey } from "@ummahlibrary/core";
import { createMobileSyncStateStore } from "./mobile-sync-state-store";

beforeEach(() => mem.clear());

describe("createMobileSyncStateStore", () => {
  const KEYS = ["ul.lastRead", "ul.theme"] as const;

  it("returns a record per managed key, stamping ones that have a value", async () => {
    mem.set("ul.lastRead", "18");
    const store = createMobileSyncStateStore(KEYS);
    const records = await store.all();
    expect(records.map((r) => r.key)).toEqual(["ul.lastRead", "ul.theme"]);

    const lastRead = records.find((r) => r.key === "ul.lastRead")!;
    expect(lastRead.value).toBe("18");
    expect(lastRead.hlc.millis).toBeGreaterThan(0);
    expect(lastRead.hlc.node).toBe("node-A");

    const theme = records.find((r) => r.key === "ul.theme")!;
    expect(theme.value).toBeNull();
    expect(theme.hlc).toEqual({ millis: 0, counter: 0, node: "node-A" }); // never-seen → zero clock
  });

  it("apply() installs a remote value at its clock; a later all() does not re-bump it", async () => {
    const store = createMobileSyncStateStore(KEYS);
    const remoteHlc = { millis: 9_000, counter: 3, node: "node-B" };
    await store.apply("ul.theme", "midnight", remoteHlc);

    expect(mem.get("ul.theme")).toBe("midnight");
    const records = await store.all();
    const theme = records.find((r) => r.key === "ul.theme")!;
    expect(theme.value).toBe("midnight");
    expect(theme.hlc).toEqual(remoteHlc); // unchanged hash ⇒ clock stays at the applied stamp
  });

  it("apply(null) deletes the value and records a tombstone clock", async () => {
    mem.set("ul.theme", "midnight");
    const store = createMobileSyncStateStore(KEYS);
    await store.all(); // establishes meta for ul.theme
    const tombHlc = { millis: 10_000, counter: 0, node: "node-B" };
    await store.apply("ul.theme", null, tombHlc);
    expect(mem.has("ul.theme")).toBe(false);
    const theme = (await store.all()).find((r) => r.key === "ul.theme")!;
    expect(theme.value).toBeNull();
    expect(theme.hlc).toEqual(tombHlc);
  });
});

describe("createMobileSyncStateStore — element-merge (v2) for a map key", () => {
  const NOTES = "ul.ayahNotes";

  it("flattens a map key into one self-describing record per element", async () => {
    mem.set(NOTES, JSON.stringify({ "2:255": "kursi", "1:1": "fatiha" }));
    const records = await createMobileSyncStateStore([NOTES]).all();
    expect(records).toHaveLength(2);
    expect(records.every((r) => r.key.startsWith(NOTES))).toBe(true);
    const one = records.find((r) => r.key.endsWith("1:1"))!;
    expect(JSON.parse(one.value!)).toEqual({ mk: NOTES, k: "1:1", v: '"fatiha"' });
  });

  it("apply() recomposes the owning map; a tombstone removes only that element", async () => {
    mem.set(NOTES, JSON.stringify({ "1:1": "a", "2:2": "b" }));
    const store = createMobileSyncStateStore([NOTES]);
    await store.apply(explodeKey(NOTES, "3:3"), JSON.stringify({ mk: NOTES, k: "3:3", v: '"c"' }), {
      millis: 9,
      counter: 0,
      node: "peer",
    });
    expect(JSON.parse(mem.get(NOTES)!)).toEqual({ "1:1": "a", "2:2": "b", "3:3": "c" });
    await store.apply(explodeKey(NOTES, "1:1"), null, { millis: 10, counter: 0, node: "peer" });
    expect(JSON.parse(mem.get(NOTES)!)).toEqual({ "2:2": "b", "3:3": "c" });
  });

  it("identify() resolves an element born on another device", async () => {
    const store = createMobileSyncStateStore([NOTES]);
    expect(store.identify!(JSON.stringify({ mk: NOTES, k: "5:5", v: '"x"' }))).toBe(
      explodeKey(NOTES, "5:5"),
    );
    expect(store.identify!('"bare scalar"')).toBeNull();
  });

  it("persists and reports the incremental-pull cursor (ADR 0035)", async () => {
    const store = createMobileSyncStateStore([NOTES]);
    expect(await store.getCursor!()).toBe(0);
    await store.setCursor!(7);
    expect(await store.getCursor!()).toBe(7);
  });
});
