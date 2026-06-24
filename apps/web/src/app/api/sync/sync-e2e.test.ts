/**
 * End-to-end sync proof (#163): two independent devices and one server, wired with
 * the *real* crypto (WebCryptoCipher), the *real* engine (runSync), and the *real*
 * server logic (handleSync over an in-memory store). It demonstrates the whole
 * point of #25 — a value bookmarked on device A appears, decrypted, on device B —
 * and that the server only ever holds ciphertext. Each device keeps its own state
 * map, since two devices can't share one jsdom localStorage.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Hlc, SyncBackend, SyncEntry, SyncStateStore } from "@ummahlibrary/core";
import { handleSync } from "./handler";
import { InMemorySyncStore } from "./sync-store";
import { createSyncController } from "../../../lib/sync/sync-controller";
import { createWebCryptoCipher } from "../../../lib/sync/web-crypto-cipher";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const KEY = "ul.bookmarks";

/** A device's local state as an isolated in-memory cell (one managed key). */
function memDevice(node: string, initial: string | null) {
  let value = initial;
  let hlc: Hlc = { millis: initial === null ? 0 : 100, counter: 0, node };
  const state: SyncStateStore = {
    all: async () => [{ key: KEY, value, hlc }],
    apply: async (_key, v, h) => {
      value = v;
      hlc = h;
    },
  };
  return { state, get: () => value };
}

/** The server side: one HTTP round trip modelled as a direct handleSync call. */
function makeBackend(server: InMemorySyncStore): SyncBackend {
  return {
    exchange: async (accountId, entries, cursor) => {
      const res = await handleSync(
        { authorization: `Bearer ${accountId}`, body: { entries, cursor } },
        server,
      );
      const body = res.body as { entries?: SyncEntry[]; cursor?: number; more?: boolean };
      return { entries: body.entries ?? [], cursor: body.cursor, more: body.more };
    },
  };
}

describe("sync end-to-end (two devices, one server)", () => {
  it("device B pulls and decrypts the bookmark device A pushed", async () => {
    const secret = "SYNC1-SYNC2-SYNC3-SYNC4-SYNC5";
    const server = new InMemorySyncStore();
    const backend = makeBackend(server);

    const deviceA = memDevice("node-a", "[2]");
    const deviceB = memDevice("node-b", null);

    await createSyncController(await createWebCryptoCipher(secret), {
      backend,
      state: deviceA.state,
    }).syncNow();
    const outcome = await createSyncController(await createWebCryptoCipher(secret), {
      backend,
      state: deviceB.state,
    }).syncNow();

    expect(deviceB.get()).toBe("[2]"); // B now holds A's bookmark
    expect(outcome.applied).toBe(1);

    // the server only ever held ciphertext, never the plaintext value
    const cipher = await createWebCryptoCipher(secret);
    const stored = await server.get(await cipher.accountId());
    expect(stored[0]!.ciphertext).not.toContain("[2]");
  });

  it("a different secret lands on a separate, empty account", async () => {
    const server = new InMemorySyncStore();
    const backend = makeBackend(server);

    await createSyncController(await createWebCryptoCipher("SECRET-AAAAA"), {
      backend,
      state: memDevice("node-a", "[7]").state,
    }).syncNow();

    const intruder = memDevice("node-x", null);
    const outcome = await createSyncController(await createWebCryptoCipher("SECRET-BBBBB"), {
      backend,
      state: intruder.state,
    }).syncNow();

    expect(intruder.get()).toBeNull(); // isolated account ⇒ nothing to pull
    expect(outcome.applied).toBe(0);
  });
});
