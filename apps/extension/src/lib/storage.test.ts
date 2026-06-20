import { afterEach, describe, expect, it, vi } from "vitest";
import { getCache, getPref, setCache, setPref } from "./storage";

interface FakeArea {
  store: Record<string, unknown>;
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (obj: Record<string, unknown>) => Promise<void>;
}

function makeArea(): FakeArea {
  const store: Record<string, unknown> = {};
  return {
    store,
    get: vi.fn((key: string) => Promise.resolve(key in store ? { [key]: store[key] } : {})),
    set: vi.fn((obj: Record<string, unknown>) => {
      Object.assign(store, obj);
      return Promise.resolve();
    }),
  };
}

function installChrome(sync: FakeArea, local: FakeArea): void {
  (globalThis as { chrome?: unknown }).chrome = { storage: { sync, local } };
}

afterEach(() => {
  localStorage.clear();
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("storage — localStorage fallback (no chrome)", () => {
  it("returns the fallback when nothing is stored", async () => {
    expect(await getPref("edition", "default")).toBe("default");
    expect(await getCache("surahs", [])).toEqual([]);
  });

  it("round-trips prefs and caches", async () => {
    await setPref("edition", "eng-sahih");
    await setCache("count", 5);
    expect(await getPref("edition", "x")).toBe("eng-sahih");
    expect(await getCache("count", 0)).toBe(5);
  });
});

describe("storage — chrome.storage", () => {
  it("keeps prefs in sync and caches in local", async () => {
    const sync = makeArea();
    const local = makeArea();
    installChrome(sync, local);

    await setPref("edition", "ur-jalandhry");
    await setCache("editions", [{ id: "x" }]);

    expect(await getPref("edition", "x")).toBe("ur-jalandhry");
    expect(sync.store.edition).toBe("ur-jalandhry");
    expect(local.store.editions).toEqual([{ id: "x" }]);
    // caches must not leak into the synced area
    expect(sync.store.editions).toBeUndefined();
  });
});
