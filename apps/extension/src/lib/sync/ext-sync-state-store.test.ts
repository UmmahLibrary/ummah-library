/**
 * Extension SyncStateStore tests (#25, ADR 0033). The store bridges the shared
 * `ul.*` sync keys to the extension's own `chrome.storage.sync` prefs and value
 * formats. Verifies presence-aware reads (a never-set pref is `null`, not its
 * default, so a fresh install can't clobber another device) and that applying a
 * remote winner writes it back into the extension's storage.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MANAGED_KEYS } from "@ummahlibrary/core";
import { getPref, setPref } from "../storage";
import { EXT_MANAGED, createExtSyncStateStore } from "./ext-sync-state-store";

function area() {
  const store: Record<string, unknown> = {};
  return {
    store,
    get: (key: string) => Promise.resolve(key in store ? { [key]: store[key] } : {}),
    set: (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
      return Promise.resolve();
    },
    remove: (key: string) => {
      delete store[key];
      return Promise.resolve();
    },
  };
}
beforeEach(() => {
  (globalThis as { chrome?: unknown }).chrome = { storage: { sync: area(), local: area() } };
});
afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
  localStorage.clear();
});

describe("EXT_MANAGED", () => {
  it("syncs exactly theme + hijriAdjust, and is a subset of the shared contract", () => {
    expect([...EXT_MANAGED].sort()).toEqual(["ul.hijriAdjust", "ul.theme"]);
    for (const k of EXT_MANAGED) expect(MANAGED_KEYS).toContain(k);
  });
});

describe("createExtSyncStateStore", () => {
  it("reads set prefs as the shared serialized values", async () => {
    await setPref("theme", "emerald");
    await setPref("hijriAdjust", 2);
    const recs = await createExtSyncStateStore().all();
    const byKey = Object.fromEntries(recs.map((r) => [r.key, r.value]));
    expect(byKey["ul.theme"]).toBe("emerald");
    expect(byKey["ul.hijriAdjust"]).toBe("2"); // web stores String(n)
    expect(recs.find((r) => r.key === "ul.theme")!.hlc.millis).toBeGreaterThan(0);
  });

  it("reports a never-set pref as null at the zero clock (no clobber)", async () => {
    const recs = await createExtSyncStateStore().all();
    for (const r of recs) {
      expect(r.value).toBeNull();
      expect(r.hlc).toEqual({ millis: 0, counter: 0, node: r.hlc.node });
      expect(r.hlc.node.length).toBeGreaterThan(0);
    }
  });

  it("applies a remote theme + hijriAdjust back into the extension's own storage", async () => {
    const store = createExtSyncStateStore();
    await store.apply("ul.theme", "midnight", { millis: 9, counter: 0, node: "peer" });
    await store.apply("ul.hijriAdjust", "1", { millis: 9, counter: 0, node: "peer" });
    expect(await getPref("theme", "x")).toBe("midnight");
    expect(await getPref("hijriAdjust", 0)).toBe(1); // parsed back to a number
  });

  it("clamps an out-of-range hijriAdjust to the project-wide [-2, 2] domain on apply", async () => {
    await createExtSyncStateStore().apply("ul.hijriAdjust", "5", { millis: 1, counter: 0, node: "p" });
    expect(await getPref("hijriAdjust", 0)).toBe(2);
  });

  it("ignores a non-finite hijriAdjust rather than writing garbage", async () => {
    await createExtSyncStateStore().apply("ul.hijriAdjust", "NaN", { millis: 1, counter: 0, node: "p" });
    expect(await getPref("hijriAdjust", 0)).toBe(0); // unchanged
  });

  it("rejects an unknown theme value rather than persisting/propagating it", async () => {
    await setPref("theme", "emerald");
    await createExtSyncStateStore().apply("ul.theme", "not-a-theme", { millis: 9, counter: 0, node: "p" });
    expect(await getPref("theme", "x")).toBe("emerald"); // unchanged
  });

  it("does not resurrect/re-push a value after a tombstone apply (meta stays consistent)", async () => {
    await setPref("theme", "emerald");
    const store = createExtSyncStateStore();
    await store.all(); // establish local meta for ul.theme
    const peer = { millis: 9_000_000, counter: 0, node: "peer" };
    await store.apply("ul.theme", null, peer); // deletion winner: bridge no-ops, keeps "emerald"
    const theme = (await store.all()).find((r) => r.key === "ul.theme")!;
    expect(theme.value).toBe("emerald"); // local choice retained
    expect(theme.hlc).toEqual(peer); // NOT re-bumped → won't re-push and clobber the peer
  });
});
