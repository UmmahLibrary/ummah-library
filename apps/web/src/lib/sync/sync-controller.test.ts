import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cipher, SyncBackend, SyncEntry, SyncStateStore } from "@ummahlibrary/core";
import { createSyncController, createSyncControllerFromSecret } from "./sync-controller";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const fakeCipher: Cipher = {
  accountId: async () => "a".repeat(64),
  entryId: async (k) => `id:${k}`,
  encrypt: async (p) => ({ ciphertext: `enc(${p})`, nonce: "iv" }),
  decrypt: async (c) => (c.startsWith("enc(") ? c.slice(4, -1) : null),
};

describe("createSyncController", () => {
  it("runs a round through the injected backend and state", async () => {
    const state: SyncStateStore = {
      all: async () => [
        { key: "ul.bookmarks", value: "[1]", hlc: { millis: 1, counter: 0, node: "n" } },
      ],
      apply: vi.fn(async () => {}),
    };
    const exchange = vi.fn(async (_id: string, entries: readonly SyncEntry[]) => ({ entries }));
    const backend: SyncBackend = { exchange };
    const controller = createSyncController(fakeCipher, { backend, state });

    const outcome = await controller.syncNow();
    expect(exchange).toHaveBeenCalledOnce();
    expect(outcome.pushed).toBe(1);
  });

  it("builds a working controller from a recovery secret", async () => {
    const exchange = vi.fn(async () => ({ entries: [] }));
    const controller = await createSyncControllerFromSecret("ABCDE-ABCDE-ABCDE-ABCDE-ABCDE", {
      backend: { exchange },
      state: { all: async () => [], apply: async () => {} },
    });
    const outcome = await controller.syncNow();
    expect(outcome.pushed).toBe(0);
    expect(exchange).toHaveBeenCalled();
  });
});
