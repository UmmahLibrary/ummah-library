import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { explodeKey } from "@ummahlibrary/core";
import { SYNC_CHANGE_EVENT, createWebSyncStateStore } from "./web-sync-state-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const KEY = "ul.bookmarks";

describe("createWebSyncStateStore", () => {
  it("all() returns a record per key with its value and a clock", async () => {
    localStorage.setItem(KEY, "[3]");
    const store = createWebSyncStateStore([KEY]);
    const records = await store.all();
    expect(records).toHaveLength(1);
    expect(records[0]!.key).toBe(KEY);
    expect(records[0]!.value).toBe("[3]");
    expect(records[0]!.hlc.node).toBeTruthy();
  });

  it("all() reports null for an unset key", async () => {
    const store = createWebSyncStateStore([KEY]);
    expect((await store.all())[0]!.value).toBeNull();
  });

  it("apply() writes a value and a tombstone removes it", async () => {
    const store = createWebSyncStateStore([KEY]);
    await store.apply(KEY, "[7]", { millis: 5, counter: 0, node: "r" });
    expect(localStorage.getItem(KEY)).toBe("[7]");
    await store.apply(KEY, null, { millis: 6, counter: 0, node: "r" });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("apply() announces the change so open UI can re-read", async () => {
    const store = createWebSyncStateStore([KEY]);
    const onChange = vi.fn();
    window.addEventListener(SYNC_CHANGE_EVENT, onChange);
    await store.apply(KEY, "[1]", { millis: 1, counter: 0, node: "r" });
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener(SYNC_CHANGE_EVENT, onChange);
  });

  it("defaults to the managed keys when none are passed", async () => {
    const records = await createWebSyncStateStore().all();
    expect(records.some((r) => r.key === KEY)).toBe(true);
  });

  it("persists and reports the incremental-pull cursor (ADR 0035)", async () => {
    const store = createWebSyncStateStore([KEY]);
    expect(await store.getCursor!()).toBe(0);
    await store.setCursor!(42);
    expect(await store.getCursor!()).toBe(42);
  });

  describe("element-merge (v2) for a map key", () => {
    const NOTES = "ul.ayahNotes";

    it("all() flattens a map key into one record per element, self-describing", async () => {
      localStorage.setItem(NOTES, JSON.stringify({ "2:255": "ayat al-kursi", "1:1": "fatiha" }));
      const records = await createWebSyncStateStore([NOTES]).all();
      const keys = records.map((r) => r.key).sort();
      // synthetic keys: `ul.ayahNotes<SEP>1:1` etc. (one per element, no bare map-key record)
      expect(keys).toHaveLength(2);
      expect(keys.every((k) => k.startsWith(NOTES))).toBe(true);
      const one = records.find((r) => r.key.endsWith("1:1"))!;
      expect(JSON.parse(one.value!)).toEqual({ mk: NOTES, k: "1:1", v: '"fatiha"' });
    });

    it("never-set map key emits no records", async () => {
      expect(await createWebSyncStateStore([NOTES]).all()).toEqual([]);
    });

    it("apply() recomposes the owning map around the winning element", async () => {
      localStorage.setItem(NOTES, JSON.stringify({ "1:1": "old" }));
      const store = createWebSyncStateStore([NOTES]);
      const recs = await store.all();
      // simulate a remote element arriving for a DIFFERENT ayah
      await store.apply(explodeKey(NOTES, "2:255"), JSON.stringify({ mk: NOTES, k: "2:255", v: '"new"' }), {
        millis: 9,
        counter: 0,
        node: "peer",
      });
      expect(JSON.parse(localStorage.getItem(NOTES)!)).toEqual({ "1:1": "old", "2:255": "new" });
      // the original element is untouched (no clobber)
      expect(recs.length).toBe(1);
    });

    it("apply() of a tombstone removes only that element", async () => {
      localStorage.setItem(NOTES, JSON.stringify({ "1:1": "a", "2:2": "b" }));
      const store = createWebSyncStateStore([NOTES]);
      await store.apply(explodeKey(NOTES, "1:1"), null, { millis: 9, counter: 0, node: "peer" });
      expect(JSON.parse(localStorage.getItem(NOTES)!)).toEqual({ "2:2": "b" });
    });

    it("identify() resolves an element born on another device from its payload", async () => {
      const store = createWebSyncStateStore([NOTES]);
      const synthetic = store.identify!(JSON.stringify({ mk: NOTES, k: "3:3", v: '"x"' }));
      expect(synthetic).toBe(explodeKey(NOTES, "3:3"));
      expect(store.identify!('"a bare scalar value"')).toBeNull();
      expect(store.identify!(JSON.stringify({ mk: "ul.notManaged", k: "1", v: "1" }))).toBeNull();
    });
  });
});
