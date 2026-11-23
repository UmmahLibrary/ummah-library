/**
 * Extension sync-settings tests (#25, ADR 0033): enablement + the recovery secret
 * live device-locally; disabling truly forgets the secret (removeCache).
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { disableSync, enableSync, isSyncEnabled, readSyncSecret } from "./sync-settings";

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
let local: ReturnType<typeof area>;
beforeEach(() => {
  local = area();
  (globalThis as { chrome?: unknown }).chrome = { storage: { sync: area(), local } };
});
afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
  localStorage.clear();
});

describe("sync-settings", () => {
  it("is off and secret-less by default", async () => {
    expect(await isSyncEnabled()).toBe(false);
    expect(await readSyncSecret()).toBeNull();
  });

  it("enableSync stores the secret, wrapped, in local storage and turns sync on", async () => {
    await enableSync("MBTQ7-K9XAR");
    expect(await readSyncSecret()).toBe("MBTQ7-K9XAR");
    expect(await isSyncEnabled()).toBe(true);
    // device-local, not the synced area — and wrapped, not plaintext (ADR 0033 §5)
    expect(local.store["sync.secret"]).not.toBe("MBTQ7-K9XAR");
    expect(local.store["sync.secret"]).toMatch(/^v1:/);
  });

  it("disableSync forgets the secret entirely", async () => {
    await enableSync("x");
    await disableSync();
    expect(await readSyncSecret()).toBeNull();
    expect(await isSyncEnabled()).toBe(false);
    expect("sync.secret" in local.store).toBe(false);
  });

  it("migrates a pre-hardening plaintext secret in place", async () => {
    local.store["sync.secret"] = "LEGACY-PLAINTEXT-CODE"; // simulates a pre-hardening install
    local.store["sync.enabled"] = true;
    expect(await readSyncSecret()).toBe("LEGACY-PLAINTEXT-CODE");
    expect(local.store["sync.secret"]).toMatch(/^v1:/); // upgraded in place
    expect(await readSyncSecret()).toBe("LEGACY-PLAINTEXT-CODE"); // still reads back correctly
  });
});
