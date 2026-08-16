/**
 * End-to-end extension sync (#25, ADR 0033). Drives the real stack — WebCrypto
 * cipher, the chrome.storage state store, the clock sidecar, and the core engine —
 * against an in-memory backend that merges like the server. Two "installs" are
 * simulated by swapping the chrome.storage areas (a fresh install) while the server
 * keeps its state. Proves a theme set in one install reaches the other and that a
 * later change propagates back, and that a different phrase stays isolated.
 */
import { afterEach, describe, expect, it } from "vitest";
import { type SyncBackend, type SyncEntry, mergeEntries } from "@ummahlibrary/core";
import { getPref, setPref } from "../storage";
import { createExtSyncStateStore } from "./ext-sync-state-store";
import { createSyncController } from "./sync-controller";
import { createWebCryptoCipher } from "./web-crypto-cipher";

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
/** Simulate a fresh install: brand-new chrome.storage areas. */
function freshInstall(): void {
  (globalThis as { chrome?: unknown }).chrome = { storage: { sync: area(), local: area() } };
}
afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
  localStorage.clear();
});

function inMemoryServer(): SyncBackend {
  const store = new Map<string, SyncEntry[]>();
  return {
    exchange: async (accountId, entries) => {
      const { merged } = mergeEntries(store.get(accountId) ?? [], entries);
      store.set(accountId, merged);
      return { entries: merged };
    },
  };
}

const PHRASE = "MBTQ7-K9XAR-2P4WD-NHJ58-VYZ36";

describe("two-install extension sync round-trip", () => {
  it("carries the theme to a second install and propagates a later change back", async () => {
    const cipher = await createWebCryptoCipher(PHRASE);
    const backend = inMemoryServer();
    const run = () => createSyncController(cipher, { backend, state: createExtSyncStateStore() }).syncNow();

    // Install A picks a theme and pushes it.
    freshInstall();
    await setPref("theme", "emerald");
    const a1 = await run();
    expect(a1.pushed).toBe(1);
    expect(a1.applied).toBe(0);

    // Install B (fresh) with the same phrase pulls and applies it.
    freshInstall();
    const b1 = await run();
    expect(b1.applied).toBe(1);
    expect(await getPref("theme", "x")).toBe("emerald");

    // Install B changes the theme and syncs it up.
    await setPref("theme", "midnight");
    const b2 = await run();
    expect(b2.pushed).toBe(1);

    // Install A (fresh again) pulls the update.
    freshInstall();
    const a2 = await run();
    expect(a2.applied).toBe(1);
    expect(await getPref("theme", "x")).toBe("midnight");
  });

  it("keeps a different phrase on a separate account (isolation)", async () => {
    const me = await createWebCryptoCipher(PHRASE);
    const stranger = await createWebCryptoCipher("ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ");
    const backend = inMemoryServer();

    freshInstall();
    await setPref("theme", "emerald");
    await createSyncController(me, { backend, state: createExtSyncStateStore() }).syncNow();

    freshInstall();
    const out = await createSyncController(stranger, {
      backend,
      state: createExtSyncStateStore(),
    }).syncNow();
    expect(out.applied).toBe(0);
    expect(await getPref("theme", "unset")).toBe("unset");
  });
});
