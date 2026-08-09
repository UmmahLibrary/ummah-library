/**
 * Mobile backup-store round-trip: the ul.* key discovery, sync-sidecar exclusion
 * and replace-vs-merge write semantics (the async mirror of the web adapter).
 * AsyncStorage is mocked in-memory. The envelope/merge logic itself is tested in
 * @ummahlibrary/core; this covers the storage glue.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getAllKeys: async () => [...mem.keys()],
    multiGet: async (keys: string[]) => keys.map((k) => [k, mem.get(k) ?? null]),
    multiSet: async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) mem.set(k, v);
    },
    multiRemove: async (keys: string[]) => {
      for (const k of keys) mem.delete(k);
    },
  },
}));

import { clearAll, restore, snapshot } from "./backup-store";

beforeEach(() => mem.clear());

describe("mobile backup-store", () => {
  it("snapshot returns only ul.* keys and excludes the sync sidecar", async () => {
    mem.set("ul.bookmarks", "[1]");
    mem.set("ul.sync.secret", "shh");
    mem.set("theme-cache", "x");
    expect(await snapshot()).toEqual({ "ul.bookmarks": "[1]" });
  });

  it("restore with replace clears existing ul.* first but leaves foreign keys alone", async () => {
    mem.set("ul.a", "1");
    mem.set("ul.b", "2");
    mem.set("keep", "z");
    await restore({ "ul.a": "9", "ul.c": "3" }, true);
    expect(mem.get("ul.a")).toBe("9");
    expect(mem.has("ul.b")).toBe(false); // dropped by replace
    expect(mem.get("ul.c")).toBe("3");
    expect(mem.get("keep")).toBe("z");
  });

  it("restore without replace writes the merged set without clearing", async () => {
    mem.set("ul.a", "1");
    await restore({ "ul.a": "9", "ul.b": "2" }, false);
    expect(mem.get("ul.a")).toBe("9");
    expect(mem.get("ul.b")).toBe("2");
  });

  it("restore never plants foreign or sync keys from a crafted payload", async () => {
    await restore({ "ul.ok": "1", evil: "x", "ul.sync.secret": "leak" }, false);
    expect(mem.get("ul.ok")).toBe("1");
    expect(mem.has("evil")).toBe(false);
    expect(mem.has("ul.sync.secret")).toBe(false);
  });

  it("clearAll removes every ul.* key and returns the count", async () => {
    mem.set("ul.a", "1");
    mem.set("ul.b", "2");
    mem.set("keep", "z");
    expect(await clearAll()).toBe(2);
    expect(mem.has("ul.a")).toBe(false);
    expect(mem.get("keep")).toBe("z");
  });
});
