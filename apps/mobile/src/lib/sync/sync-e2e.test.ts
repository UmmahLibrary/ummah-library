/**
 * End-to-end mobile sync (#25, ADR 0033). Drives the *real* stack — noble cipher,
 * the AsyncStorage state store, the clock sidecar, and the core engine — against an
 * in-memory backend that merges like the server (`mergeEntries`). Two "devices"
 * are simulated by clearing the shared storage between rounds (a fresh install)
 * while the server keeps its state. Proves a value written on one device lands on
 * another, and that a later edit propagates back — the whole point of the feature.
 */
import { webcrypto } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => void mem.set(k, v),
    removeItem: async (k: string) => void mem.delete(k),
    multiGet: async (keys: string[]) => keys.map((k) => [k, mem.get(k) ?? null]),
  },
}));
let nodes = 0;
vi.mock("./crypto-random", () => ({
  randomBytes: (n: number) => webcrypto.getRandomValues(new Uint8Array(n)),
  randomId: () => `device-${++nodes}`,
}));

import { type SyncBackend, type SyncEntry, mergeEntries } from "@ummahlibrary/core";
import { createMobileSyncStateStore } from "./mobile-sync-state-store";
import { createNobleCipher } from "./noble-cipher";
import { createSyncController } from "./sync-controller";

const PHRASE = "MBTQ7-K9XAR-2P4WD-NHJ58-VYZ36";
const KEYS = ["ul.lastRead", "ul.theme"] as const;

/** A server stand-in: per-account ciphertext bundles, converged with the same pure merge. */
function inMemoryServer(): { backend: SyncBackend; bucket: (a: string) => SyncEntry[] } {
  const store = new Map<string, SyncEntry[]>();
  return {
    backend: {
      exchange: async (accountId, entries) => {
        const { merged } = mergeEntries(store.get(accountId) ?? [], entries);
        store.set(accountId, merged);
        return { entries: merged };
      },
    },
    bucket: (a) => store.get(a) ?? [],
  };
}

describe("two-device sync round-trip", () => {
  it("carries a last-read position to a second device and propagates a later edit back", async () => {
    const cipher = await createNobleCipher(PHRASE); // one (slow) derivation, reused by all devices
    const { backend } = inMemoryServer();
    const run = () =>
      createSyncController(cipher, { backend, state: createMobileSyncStateStore(KEYS) }).syncNow();

    // Device A sets a position and pushes it (nothing to apply yet).
    mem.clear();
    mem.set("ul.lastRead", "18");
    const a1 = await run();
    expect(a1.pushed).toBe(1);
    expect(a1.applied).toBe(0);

    // Device B is a fresh install with the same phrase → pulls and applies it.
    mem.clear();
    const b1 = await run();
    expect(b1.applied).toBe(1);
    expect(mem.get("ul.lastRead")).toBe("18");

    // Device B moves on and syncs the new position up.
    mem.set("ul.lastRead", "42");
    const b2 = await run();
    expect(b2.pushed).toBe(1);

    // Device A (fresh again) pulls the update — LWW resolved by the HLC.
    mem.clear();
    const a2 = await run();
    expect(a2.applied).toBe(1);
    expect(mem.get("ul.lastRead")).toBe("42");
  });

  it("keeps a different phrase on a completely separate account (isolation)", async () => {
    const me = await createNobleCipher(PHRASE);
    const stranger = await createNobleCipher("ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ");
    const { backend } = inMemoryServer();

    mem.clear();
    mem.set("ul.theme", "midnight");
    await createSyncController(me, { backend, state: createMobileSyncStateStore(KEYS) }).syncNow();

    // The stranger's account is keyed by a different accountId → it sees nothing of mine.
    mem.clear();
    const out = await createSyncController(stranger, {
      backend,
      state: createMobileSyncStateStore(KEYS),
    }).syncNow();
    expect(out.applied).toBe(0);
    expect(mem.get("ul.theme")).toBeUndefined();
  });
});
