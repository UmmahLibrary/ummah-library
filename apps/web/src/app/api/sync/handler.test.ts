import { describe, expect, it } from "vitest";
import type { SyncEntry } from "@ummahlibrary/core";
import { handleSync, parseAccountId } from "./handler";
import { InMemorySyncStore } from "./sync-store";

const ACCT = "a".repeat(64);
const auth = `Bearer ${ACCT}`;
const entry = (id: string, millis: number, ciphertext: string | null = "ct"): SyncEntry => ({
  id,
  hlc: { millis, counter: 0, node: "n" },
  ciphertext,
  nonce: ciphertext === null ? "" : "iv",
});

describe("parseAccountId", () => {
  it("accepts a 64-hex Bearer token and rejects anything else", () => {
    expect(parseAccountId(auth)).toBe(ACCT);
    expect(parseAccountId(null)).toBeNull();
    expect(parseAccountId("Bearer short")).toBeNull();
    expect(parseAccountId("Basic " + ACCT)).toBeNull();
    expect(parseAccountId(`Bearer ${"Z".repeat(64)}`)).toBeNull();
  });
});

describe("handleSync", () => {
  it("rejects a missing/bad account id with 401", async () => {
    const r = await handleSync(
      { authorization: null, body: { entries: [] } },
      new InMemorySyncStore(),
    );
    expect(r.status).toBe(401);
  });

  it("rejects a non-array entries field with 400", async () => {
    const r = await handleSync(
      { authorization: auth, body: { entries: "nope" } },
      new InMemorySyncStore(),
    );
    expect(r.status).toBe(400);
  });

  it("rejects too many entries with 413", async () => {
    const entries = Array.from({ length: 501 }, (_, i) => entry(`id${i}`, 1));
    const r = await handleSync({ authorization: auth, body: { entries } }, new InMemorySyncStore());
    expect(r.status).toBe(413);
  });

  it("rejects a malformed entry with 400", async () => {
    const r = await handleSync(
      { authorization: auth, body: { entries: [{ id: "x", nonce: "n" }] } },
      new InMemorySyncStore(),
    );
    expect(r.status).toBe(400);
  });

  it("converges the client set with the stored set and persists it", async () => {
    const store = new InMemorySyncStore();
    await store.set(ACCT, [entry("x", 10, "old"), entry("y", 5)]);

    const r = await handleSync(
      { authorization: auth, body: { entries: [entry("x", 20, "new"), entry("z", 1)] } },
      store,
    );

    expect(r.status).toBe(200);
    const out = (r.body as { entries: SyncEntry[] }).entries;
    const byId = Object.fromEntries(out.map((e) => [e.id, e]));
    expect(byId.x!.ciphertext).toBe("new"); // newer client write won
    expect(byId.y).toBeDefined(); // stored-only kept
    expect(byId.z).toBeDefined(); // client-only added
    expect((await store.get(ACCT)).length).toBe(3); // persisted
  });

  it("accepts a tombstone entry (null ciphertext)", async () => {
    const r = await handleSync(
      { authorization: auth, body: { entries: [entry("x", 30, null)] } },
      new InMemorySyncStore(),
    );
    expect(r.status).toBe(200);
  });
});
