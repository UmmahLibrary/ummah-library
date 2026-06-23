import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
});
