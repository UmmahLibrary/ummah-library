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
