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

  it("rejects a non-finite hlc.millis (1e400 → Infinity via JSON) with 400", async () => {
    // 1e400 parses to Infinity, which would win every last-writer-wins race
    // forever — permanently poisoning a key. Must be rejected at the boundary.
    const body = JSON.parse(
      '{"entries":[{"id":"k","hlc":{"millis":1e400,"counter":0,"node":"n"},"ciphertext":"c","nonce":"iv"}]}',
    );
    const r = await handleSync({ authorization: auth, body }, new InMemorySyncStore());
    expect(r.status).toBe(400);
  });

  it("rejects negative / fractional / over-MAX_SAFE / empty-node clocks with 400", async () => {
    const store = new InMemorySyncStore();
    const mk = (hlc: unknown) => ({ id: "k", hlc, ciphertext: "c", nonce: "iv" });
    const badClocks = [
      { millis: -1, counter: 0, node: "n" },
      { millis: 1.5, counter: 0, node: "n" },
      { millis: 1e308, counter: 0, node: "n" }, // finite but > MAX_SAFE_INTEGER
      { millis: 1, counter: -1, node: "n" },
      { millis: 1, counter: 0, node: "" }, // empty node → un-round-trippable clock
    ];
    for (const hlc of badClocks) {
      const r = await handleSync({ authorization: auth, body: { entries: [mk(hlc)] } }, store);
      expect(r.status).toBe(400);
    }
  });

  it("rejects an oversized nonce or node (per-entry size cap) with 400", async () => {
    const big = "A".repeat(5000);
    const goodHlc = { millis: 1, counter: 0, node: "n" };
    const r1 = await handleSync(
      { authorization: auth, body: { entries: [{ id: "k", hlc: goodHlc, ciphertext: "c", nonce: big }] } },
      new InMemorySyncStore(),
    );
    expect(r1.status).toBe(400);
    const r2 = await handleSync(
      { authorization: auth, body: { entries: [{ id: "k", hlc: { ...goodHlc, node: big }, ciphertext: "c", nonce: "iv" }] } },
      new InMemorySyncStore(),
    );
    expect(r2.status).toBe(400);
  });

  it("re-validates the stored set so a previously-corrupt entry can't poison the merge", async () => {
    const store = new InMemorySyncStore();
    await store.set(ACCT, [
      { id: "bad", hlc: { millis: Infinity, counter: 0, node: "" }, ciphertext: "x", nonce: "iv" } as unknown as SyncEntry,
    ]);
    const r = await handleSync({ authorization: auth, body: { entries: [entry("good", 5)] } }, store);
    expect(r.status).toBe(200);
    const out = (r.body as { entries: SyncEntry[] }).entries;
    expect(out.some((e) => e.id === "bad")).toBe(false); // corrupt stored entry dropped
    expect(out.some((e) => e.id === "good")).toBe(true);
  });
});
