/**
 * Extension sync-meta tests (#25, ADR 0033). Same diff-at-sync clock logic as
 * web/mobile, over chrome.storage.local — including the never-tombstone-a-
 * never-seen-key invariant and dropping a structurally-corrupt sidecar entry.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clockOf, loadMeta, reconcileMeta, saveMeta, setClockIn, type Meta } from "./sync-meta";

function area() {
  const store: Record<string, unknown> = {};
  return {
    store,
    get: (key: string) => Promise.resolve(key in store ? { [key]: store[key] } : {}),
    set: (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
      return Promise.resolve();
    },
  };
}
let local: ReturnType<typeof area>;
beforeEach(() => {
  local = area();
  (globalThis as { chrome?: unknown }).chrome = { storage: { sync: area(), local } };
});
afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
  localStorage.clear();
});

const NOW = new Date(1_700_000_000_000);

describe("reconcileMeta", () => {
  it("stamps a key that has a value but no prior meta", () => {
    const meta: Meta = {};
    expect(reconcileMeta(meta, ["ul.theme"], new Map([["ul.theme", "emerald"]]), NOW, "n1")).toBe(true);
    expect(meta["ul.theme"]!.hlc).toEqual({ millis: NOW.getTime(), counter: 0, node: "n1" });
  });

  it("leaves a never-seen absent key untouched", () => {
    const meta: Meta = {};
    expect(reconcileMeta(meta, ["ul.theme"], new Map([["ul.theme", null]]), NOW, "n1")).toBe(false);
    expect(meta["ul.theme"]).toBeUndefined();
  });

  it("tombstones a key that had a value and is now absent", () => {
    const meta: Meta = { "ul.theme": { hlc: { millis: 1, counter: 0, node: "n1" }, hash: "abc" } };
    expect(reconcileMeta(meta, ["ul.theme"], new Map([["ul.theme", null]]), NOW, "n1")).toBe(true);
    expect(meta["ul.theme"]!.hash).toBe("_");
  });
});

describe("loadMeta / saveMeta", () => {
  it("round-trips a structural clock and reads it back", async () => {
    const meta: Meta = { "ul.theme": { hlc: { millis: 5, counter: 2, node: "abc" }, hash: "h" } };
    await saveMeta(meta);
    expect(await loadMeta()).toEqual(meta);
    expect(clockOf(await loadMeta(), "ul.theme", "n1")).toEqual({ millis: 5, counter: 2, node: "abc" });
  });

  it("drops a corrupt entry rather than trusting it", async () => {
    const meta: Meta = {};
    setClockIn(meta, "ok", "v", { millis: 1, counter: 0, node: "a" });
    await saveMeta(meta);
    // hand-corrupt the stored sidecar
    local.store["sync.meta"] = { ...(local.store["sync.meta"] as object), bad: { hlc: { millis: "x" }, hash: "h" } };
    expect(Object.keys(await loadMeta())).toEqual(["ok"]);
  });
});
