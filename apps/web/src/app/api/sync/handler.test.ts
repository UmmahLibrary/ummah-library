import { describe, expect, it } from "vitest";
import type { SyncEntry } from "@ummahlibrary/core";
import { handleSync, parseAccountId } from "./handler";
import { InMemorySyncStore, type ServerEntry } from "./sync-store";

const ACCT = "a".repeat(64);
const auth = `Bearer ${ACCT}`;
const entry = (id: string, millis: number, ciphertext: string | null = "ct"): ServerEntry => ({
  id,
  hlc: { millis, counter: 0, node: "n" },
  ciphertext,
  nonce: ciphertext === null ? "" : "iv",
  v: 1,
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

  it("accepts the first MAX_ENTRIES and reports the rest as rejected, rather than failing the whole push (ADR 0035 graceful overflow)", async () => {
    const store = new InMemorySyncStore();
    const entries = Array.from({ length: 2001 }, (_, i) => entry(`id${i}`, 1));
    const r = await handleSync({ authorization: auth, body: { entries } }, store);
    expect(r.status).toBe(200);
    const rejected = (r.body as { rejected?: string[] }).rejected;
    expect(rejected).toEqual(["id2000"]);
    expect((await store.get(ACCT)).map((e) => e.id)).toHaveLength(2000);
  });

  it("accepts the rest of the push and reports only the malformed entry as rejected", async () => {
    const store = new InMemorySyncStore();
    const r = await handleSync(
      { authorization: auth, body: { entries: [{ id: "x", nonce: "n" }, entry("good", 1)] } },
      store,
    );
    expect(r.status).toBe(200);
    expect((r.body as { rejected?: string[] }).rejected).toEqual(["x"]);
    const stored = await store.get(ACCT);
    expect(stored.some((e) => e.id === "good")).toBe(true);
    expect(stored.some((e) => e.id === "x")).toBe(false);
  });

  it("silently drops an entry with no usable id (nothing to name back), without disturbing the rest", async () => {
    const store = new InMemorySyncStore();
    const r = await handleSync(
      { authorization: auth, body: { entries: [{ nonce: "n" }, entry("good", 1)] } },
      store,
    );
    expect(r.status).toBe(200);
    expect((r.body as { rejected?: string[] }).rejected).toBeUndefined();
    expect((await store.get(ACCT)).map((e) => e.id)).toEqual(["good"]);
  });

  it("converges + persists the merged set and returns the stored-only delta", async () => {
    const store = new InMemorySyncStore();
    await store.set(ACCT, [entry("x", 10, "old"), entry("y", 5)]);

    const r = await handleSync(
      { authorization: auth, body: { entries: [entry("x", 20, "new"), entry("z", 1)] } },
      store,
    );

    expect(r.status).toBe(200);
    // the server converged + persisted all three (the newer client `x` won)
    const stored = Object.fromEntries((await store.get(ACCT)).map((e) => [e.id, e]));
    expect(stored.x!.ciphertext).toBe("new");
    expect(stored.y).toBeDefined();
    expect(stored.z).toBeDefined();
    // the delta returns only what the client didn't have — its own pushes (x, z) are excluded
    const out = (r.body as { entries: SyncEntry[] }).entries;
    expect(out.map((e) => e.id)).toEqual(["y"]);
  });

  it("migrates a legacy entry (no version field) so a fresh device still pulls it", async () => {
    const store = new InMemorySyncStore();
    // a v2-era entry, stored before per-entry versions existed (no `v`)
    await store.set(ACCT, [
      {
        id: "legacy",
        hlc: { millis: 100, counter: 0, node: "old" },
        ciphertext: "ct",
        nonce: "iv",
      } as unknown as ServerEntry,
    ]);
    const r = await handleSync({ authorization: auth, body: { entries: [], cursor: 0 } }, store);
    expect((r.body as { entries: SyncEntry[] }).entries.map((e) => e.id)).toEqual(["legacy"]);
  });

  it("returns only the delta past the client's cursor (incremental pull, ADR 0035)", async () => {
    const store = new InMemorySyncStore();
    await handleSync({ authorization: auth, body: { entries: [entry("x", 10)] } }, store); // x → v1
    const b1 = await handleSync({ authorization: auth, body: { entries: [], cursor: 0 } }, store);
    expect((b1.body as { entries: SyncEntry[] }).entries.map((e) => e.id)).toEqual(["x"]);
    const cursor = (b1.body as { cursor: number }).cursor;
    const b2 = await handleSync({ authorization: auth, body: { entries: [], cursor } }, store);
    expect((b2.body as { entries: SyncEntry[] }).entries).toEqual([]); // nothing new past the cursor
  });

  it("accepts a tombstone entry (null ciphertext)", async () => {
    const r = await handleSync(
      { authorization: auth, body: { entries: [entry("x", 30, null)] } },
      new InMemorySyncStore(),
    );
    expect(r.status).toBe(200);
  });

  it("rejects (not stores) a non-finite hlc.millis (1e400 → Infinity via JSON)", async () => {
    // 1e400 parses to Infinity, which would win every last-writer-wins race
    // forever — permanently poisoning a key. Must never be persisted.
    const store = new InMemorySyncStore();
    const body = JSON.parse(
      '{"entries":[{"id":"k","hlc":{"millis":1e400,"counter":0,"node":"n"},"ciphertext":"c","nonce":"iv"}]}',
    );
    const r = await handleSync({ authorization: auth, body }, store);
    expect(r.status).toBe(200);
    expect((r.body as { rejected?: string[] }).rejected).toEqual(["k"]);
    expect(await store.get(ACCT)).toEqual([]);
  });

  it("rejects (not stores) negative / fractional / over-MAX_SAFE / empty-node clocks", async () => {
    const mk = (hlc: unknown) => ({ id: "k", hlc, ciphertext: "c", nonce: "iv" });
    const badClocks = [
      { millis: -1, counter: 0, node: "n" },
      { millis: 1.5, counter: 0, node: "n" },
      { millis: 1e308, counter: 0, node: "n" }, // finite but > MAX_SAFE_INTEGER
      { millis: 1, counter: -1, node: "n" },
      { millis: 1, counter: 0, node: "" }, // empty node → un-round-trippable clock
    ];
    for (const hlc of badClocks) {
      const store = new InMemorySyncStore();
      const r = await handleSync({ authorization: auth, body: { entries: [mk(hlc)] } }, store);
      expect(r.status).toBe(200);
      expect((r.body as { rejected?: string[] }).rejected).toEqual(["k"]);
      expect(await store.get(ACCT)).toEqual([]);
    }
  });

  it("rejects (not stores) an oversized nonce or node (per-entry size cap)", async () => {
    const big = "A".repeat(5000);
    const goodHlc = { millis: 1, counter: 0, node: "n" };
    const store1 = new InMemorySyncStore();
    const r1 = await handleSync(
      { authorization: auth, body: { entries: [{ id: "k", hlc: goodHlc, ciphertext: "c", nonce: big }] } },
      store1,
    );
    expect(r1.status).toBe(200);
    expect((r1.body as { rejected?: string[] }).rejected).toEqual(["k"]);
    expect(await store1.get(ACCT)).toEqual([]);

    const store2 = new InMemorySyncStore();
    const r2 = await handleSync(
      { authorization: auth, body: { entries: [{ id: "k", hlc: { ...goodHlc, node: big }, ciphertext: "c", nonce: "iv" }] } },
      store2,
    );
    expect(r2.status).toBe(200);
    expect((r2.body as { rejected?: string[] }).rejected).toEqual(["k"]);
    expect(await store2.get(ACCT)).toEqual([]);
  });

  it("re-validates the stored set so a previously-corrupt entry can't poison the merge", async () => {
    const store = new InMemorySyncStore();
    await store.set(ACCT, [
      {
        id: "bad",
        hlc: { millis: Infinity, counter: 0, node: "" },
        ciphertext: "x",
        nonce: "iv",
        v: 1,
      } as unknown as ServerEntry,
    ]);
    const r = await handleSync({ authorization: auth, body: { entries: [entry("good", 5)] } }, store);
    expect(r.status).toBe(200);
    const stored = await store.get(ACCT);
    expect(stored.some((e) => e.id === "bad")).toBe(false); // corrupt stored entry dropped on re-validate
    expect(stored.some((e) => e.id === "good")).toBe(true); // the good push persisted
  });
});
