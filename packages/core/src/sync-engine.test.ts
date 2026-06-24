import { describe, expect, it } from "vitest";
import type { Cipher, SyncBackend, SyncStateStore } from "./ports";
import { type Hlc, type SyncEntry, hlcInit, mergeEntries } from "./sync";
import { runSync } from "./sync-engine";

const at = (millis: number, counter = 0, node = "a"): Hlc => ({ millis, counter, node });

/**
 * A deterministic stand-in for the real WebCrypto adapter: `entryId` is a stable
 * keyed hash, `encrypt`/`decrypt` wrap and unwrap with an `enc(...)` marker, and
 * anything not wrapped fails to decrypt (the foreign/corrupt path).
 */
const cipher: Cipher = {
  accountId: async () => "acct-1",
  entryId: async (keyName) => `id:${keyName}`,
  encrypt: async (plaintext) => ({ ciphertext: `enc(${plaintext})`, nonce: "iv" }),
  decrypt: async (ciphertext) => {
    const m = /^enc\(([\s\S]*)\)$/.exec(ciphertext);
    return m ? m[1]! : null;
  },
};

/** The server, faithfully: store ciphertext per account and converge by clock. */
class FakeBackend implements SyncBackend {
  readonly store = new Map<string, SyncEntry[]>();
  async exchange(accountId: string, entries: readonly SyncEntry[]): Promise<readonly SyncEntry[]> {
    const merged = mergeEntries(this.store.get(accountId) ?? [], entries).merged;
    this.store.set(accountId, merged);
    return merged;
  }
}

/** Local state over a fixed key namespace; every key present, `null` when unset. */
class FakeState implements SyncStateStore {
  private readonly data = new Map<string, { value: string | null; hlc: Hlc }>();
  constructor(keys: string[]) {
    for (const k of keys) this.data.set(k, { value: null, hlc: hlcInit("node") });
  }
  /** test helper — simulate a local feature write at a clock */
  set(key: string, value: string | null, hlc: Hlc): void {
    this.data.set(key, { value, hlc });
  }
  /** test helper — read the current value */
  get(key: string): string | null {
    return this.data.get(key)?.value ?? null;
  }
  async all() {
    return [...this.data.entries()].map(([key, v]) => ({ key, value: v.value, hlc: v.hlc }));
  }
  async apply(key: string, value: string | null, hlc: Hlc): Promise<void> {
    this.data.set(key, { value, hlc });
  }
}

describe("runSync", () => {
  it("propagates a value from one device to another", async () => {
    const backend = new FakeBackend();
    const a = new FakeState(["ul.x", "ul.y"]);
    a.set("ul.x", "hello", at(10));
    const b = new FakeState(["ul.x", "ul.y"]);

    await runSync({ cipher, backend, state: a });
    const out = await runSync({ cipher, backend, state: b });

    expect(b.get("ul.x")).toBe("hello");
    expect(out.applied).toBe(1); // only ul.x
    expect(out.pushed).toBe(0); // b never set anything, so it pushes nothing
  });

  it("does not push keys this device never set", async () => {
    const backend = new FakeBackend();
    const a = new FakeState(["ul.x", "ul.y", "ul.z"]);
    a.set("ul.x", "v", at(10));

    const out = await runSync({ cipher, backend, state: a });

    expect(out.pushed).toBe(1); // ul.x only; ul.y and ul.z were never set
    expect(backend.store.get("acct-1")).toHaveLength(1);
  });

  it("resolves a conflict in favour of the newer clock, on every device", async () => {
    const backend = new FakeBackend();
    const a = new FakeState(["ul.x"]);
    a.set("ul.x", "A", at(10, 0, "a"));
    const b = new FakeState(["ul.x"]);
    b.set("ul.x", "B", at(20, 0, "b"));

    await runSync({ cipher, backend, state: a }); // server: x=A@10
    await runSync({ cipher, backend, state: b }); // server: x=B@20 (B is newer)
    expect(b.get("ul.x")).toBe("B");

    const out = await runSync({ cipher, backend, state: a }); // A pulls the newer B
    expect(a.get("ul.x")).toBe("B");
    expect(out.applied).toBe(1);
  });

  it("propagates a deletion as a tombstone", async () => {
    const backend = new FakeBackend();
    const a = new FakeState(["ul.x"]);
    a.set("ul.x", "val", at(10, 0, "a"));
    const b = new FakeState(["ul.x"]);

    await runSync({ cipher, backend, state: a });
    await runSync({ cipher, backend, state: b });
    expect(b.get("ul.x")).toBe("val");

    a.set("ul.x", null, at(30, 0, "a")); // delete on A
    await runSync({ cipher, backend, state: a });
    const out = await runSync({ cipher, backend, state: b });

    expect(b.get("ul.x")).toBeNull();
    expect(out.applied).toBe(1);
  });

  it("never clobbers local data with an entry it cannot decrypt", async () => {
    const backend = new FakeBackend();
    const d = new FakeState(["ul.x"]);
    d.set("ul.x", "mine", at(10, 0, "a"));
    backend.store.set("acct-1", [
      { id: "id:ul.x", hlc: at(99, 0, "z"), ciphertext: "garbage", nonce: "iv" },
    ]);

    const out = await runSync({ cipher, backend, state: d });

    expect(d.get("ul.x")).toBe("mine");
    expect(out.applied).toBe(0);
  });

  it("only auto-skips a never-set key at the exact zero clock (pins the counter sub-clause)", async () => {
    const backend = new FakeBackend();
    const a = new FakeState(["ul.x"]);
    // A null value but a non-zero counter is NOT the untouched hlcInit {0,0} clock,
    // so it must still be pushed as a tombstone — pinning `r.hlc.counter === 0` in
    // the skip guard (a mutant dropping that sub-clause would wrongly skip it).
    a.set("ul.x", null, at(0, 1, "a"));
    const out = await runSync({ cipher, backend, state: a });
    expect(out.pushed).toBe(1);
    expect(backend.store.get("acct-1")).toHaveLength(1);
  });

  it("ignores server entries for keys this build does not manage", async () => {
    const backend = new FakeBackend();
    const d = new FakeState(["ul.x"]);
    backend.store.set("acct-1", [
      { id: "id:ul.ghost", hlc: at(99, 0, "z"), ciphertext: "enc(ghost)", nonce: "iv" },
    ]);

    const out = await runSync({ cipher, backend, state: d });

    expect(out.applied).toBe(0);
    expect(out.pulled).toBeGreaterThanOrEqual(1);
  });
});
