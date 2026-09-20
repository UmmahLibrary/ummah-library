/**
 * Mobile sync-settings tests (#25, ADR 0033): enablement and the recovery secret
 * are persisted under `ul.sync.*`, and "enabled" means the flag is set AND a
 * secret is present to drive it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem, secureMem } = vi.hoisted(() => ({
  mem: new Map<string, string>(),
  secureMem: new Map<string, string>(),
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => void mem.set(k, v),
    removeItem: async (k: string) => void mem.delete(k),
  },
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (k: string) => secureMem.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void secureMem.set(k, v),
  deleteItemAsync: async (k: string) => void secureMem.delete(k),
}));

import { disableSync, enableSync, isSyncEnabled, readSyncSecret } from "./sync-settings";

beforeEach(() => {
  mem.clear();
  secureMem.clear();
});

describe("sync-settings", () => {
  it("is off and secret-less by default", async () => {
    expect(await isSyncEnabled()).toBe(false);
    expect(await readSyncSecret()).toBeNull();
  });

  it("enableSync stores the secret (in the Keychain/Keystore store) and turns sync on", async () => {
    await enableSync("MBTQ7-K9XAR");
    expect(await readSyncSecret()).toBe("MBTQ7-K9XAR");
    expect(await isSyncEnabled()).toBe(true);
    expect(secureMem.get("ul.sync.secret")).toBe("MBTQ7-K9XAR");
    expect(mem.has("ul.sync.secret")).toBe(false); // never touches plain AsyncStorage
  });

  it("is NOT enabled if the flag is set but the secret is gone", async () => {
    await enableSync("x");
    secureMem.delete("ul.sync.secret");
    expect(await isSyncEnabled()).toBe(false);
  });

  it("disableSync forgets the secret and turns sync off", async () => {
    await enableSync("x");
    await disableSync();
    expect(await readSyncSecret()).toBeNull();
    expect(await isSyncEnabled()).toBe(false);
  });

  it("migrates a pre-hardening plaintext secret from AsyncStorage into the secure store", async () => {
    mem.set("ul.sync.secret", "LEGACY-PLAINTEXT-CODE"); // simulates an install from before this change
    mem.set("ul.sync.enabled", "1");
    expect(await readSyncSecret()).toBe("LEGACY-PLAINTEXT-CODE");
    expect(secureMem.get("ul.sync.secret")).toBe("LEGACY-PLAINTEXT-CODE");
    expect(mem.has("ul.sync.secret")).toBe(false); // migrated, not left behind
    expect(await isSyncEnabled()).toBe(true);
  });
});
