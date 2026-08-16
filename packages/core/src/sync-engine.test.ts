import { describe, expect, it } from "vitest";
import type { Cipher, SyncBackend, SyncStateStore } from "./ports";
import {
  type Hlc,
  type SyncEntry,
  type SyncExchangeResult,
  hlcCompare,
  hlcInit,
  mergeEntries,
} from "./sync";
import { runSync } from "./sync-engine";
import { explodeKey, isMapKey, parseElementKey, unwrapElement, wrapElement } from "./sync-shapes";

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

/** The server, faithfully: store ciphertext per account and converge by clock (v2 full-set). */
class FakeBackend implements SyncBackend {
  readonly store = new Map<string, SyncEntry[]>();
  async exchange(
    accountId: string,
    entries: readonly SyncEntry[],
    _cursor?: number,
  ): Promise<SyncExchangeResult> {
    const merged = mergeEntries(this.store.get(accountId) ?? [], entries).merged;
    this.store.set(accountId, merged);
    return { entries: merged };
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

/**
 * An element-merged state over one real map key (`ul.ayahNotes`), using the actual
 * `sync-shapes` helpers. Each element is flattened to a synthetic key and carries a
 * self-describing payload; `identify` resolves an element first seen on another
 * device. Exercises the v2 engine path end to end.
 */
class FakeElementState implements SyncStateStore {
  private readonly map = new Map<string, string>(); // elementId -> element-JSON value
  private readonly clocks = new Map<string, Hlc>(); // synthetic key -> hlc
  private readonly mapKey = "ul.ayahNotes";
  setEl(id: string, value: string, hlc: Hlc): void {
    this.map.set(id, value);
    this.clocks.set(explodeKey(this.mapKey, id), hlc);
  }
  getEl(id: string): string | null {
    return this.map.get(id) ?? null;
  }
  async all() {
    return [...this.map.entries()].map(([id, value]) => {
      const synthetic = explodeKey(this.mapKey, id);
      return {
        key: synthetic,
        value: wrapElement(this.mapKey, id, value),
        hlc: this.clocks.get(synthetic) ?? hlcInit("node"),
      };
    });
  }
  async apply(key: string, value: string | null, hlc: Hlc): Promise<void> {
    const p = parseElementKey(key);
    if (!p) return;
    if (value === null) this.map.delete(p.id);
    else this.map.set(p.id, unwrapElement(value)?.v ?? value);
    this.clocks.set(key, hlc);
  }
  identify(plaintext: string): string | null {
    const env = unwrapElement(plaintext);
    return env && isMapKey(env.mk) ? explodeKey(env.mk, env.k) : null;
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

  it("discovers an element first created on another device via the identify hook (v2)", async () => {
    const backend = new FakeBackend();
    const a = new FakeElementState();
    a.setEl("2:255", '"my note"', at(10));
    const b = new FakeElementState(); // has never seen 2:255 — its id isn't in b's keyById

    await runSync({ cipher, backend, state: a }); // A pushes the element
    const out = await runSync({ cipher, backend, state: b }); // B must DISCOVER it

    expect(b.getEl("2:255")).toBe('"my note"');
    expect(out.applied).toBe(1);
  });

  it("merges different elements from two devices without clobbering (the v2 win)", async () => {
    const backend = new FakeBackend();
    const a = new FakeElementState();
    a.setEl("1:1", '"alpha"', at(10, 0, "a"));
    const b = new FakeElementState();
    b.setEl("2:2", '"beta"', at(10, 0, "b"));

    await runSync({ cipher, backend, state: a }); // server: {1:1}
    await runSync({ cipher, backend, state: b }); // server: {1:1, 2:2}; b discovers 1:1
    await runSync({ cipher, backend, state: a }); // a discovers 2:2

    for (const dev of [a, b]) {
      expect(dev.getEl("1:1")).toBe('"alpha"');
      expect(dev.getEl("2:2")).toBe('"beta"'); // neither write clobbered the other
    }
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

// --- v3: incremental-pull cursor + dirty/bounded push (ADR 0035) ---

/** A versioned server: stamps each written entry with a version, returns only the
 * delta past the client's cursor (paged), and excludes the client's own unchanged
 * pushes. Mirrors the real handler + in-memory store. */
class VersionedBackend implements SyncBackend {
  readonly store = new Map<string, (SyncEntry & { v: number })[]>();
  exchanges = 0;
  constructor(private readonly pageLimit = 1000) {}
  async exchange(
    accountId: string,
    push: readonly SyncEntry[],
    cursor = 0,
  ): Promise<SyncExchangeResult> {
    this.exchanges++;
    const stored = this.store.get(accountId) ?? [];
    let top = stored.reduce((m, e) => Math.max(m, e.v), 0);
    const { merged, incoming } = mergeEntries(stored, push); // push won ⇒ in `incoming`
    const wonIds = new Set(incoming.map((e) => e.id));
    const storedV = new Map(stored.map((e) => [e.id, e.v]));
    const versioned = merged.map((e) => ({
      ...e,
      v: wonIds.has(e.id) ? ++top : (storedV.get(e.id) ?? ++top),
    }));
    this.store.set(accountId, versioned);
    const pushedHlc = new Map(push.map((e) => [e.id, e.hlc]));
    const delta = versioned
      .filter((e) => e.v > cursor)
      .filter((e) => !(pushedHlc.has(e.id) && hlcCompare(e.hlc, pushedHlc.get(e.id)!) === 0))
      .sort((a, b) => a.v - b.v);
    const page = delta.slice(0, this.pageLimit);
    const more = delta.length > page.length;
    return {
      entries: page.map(({ v: _v, ...e }) => e),
      cursor: more ? page[page.length - 1]!.v : top,
      more,
    };
  }
}

/** A state that tracks a cursor + per-key dirty flags, like the real web/mobile stores. */
class CursorState implements SyncStateStore {
  private readonly data = new Map<string, { value: string | null; hlc: Hlc }>();
  private readonly dirty = new Set<string>();
  private cursor = 0;
  /** Enumerate the managed keys (unset, zero clock) like a real store, so the
   * engine can map the server's opaque ids back even on a fresh device. */
  constructor(keys: readonly string[] = []) {
    for (const k of keys) this.data.set(k, { value: null, hlc: hlcInit("b") });
  }
  set(key: string, value: string | null, hlc: Hlc): void {
    this.data.set(key, { value, hlc });
    this.dirty.add(key);
  }
  get(key: string): string | null {
    return this.data.get(key)?.value ?? null;
  }
  async all() {
    return [...this.data.entries()].map(([key, v]) => ({
      key,
      value: v.value,
      hlc: v.hlc,
      dirty: this.dirty.has(key),
    }));
  }
  async apply(key: string, value: string | null, hlc: Hlc): Promise<void> {
    this.data.set(key, { value, hlc });
    this.dirty.delete(key); // a remote winner is already on the server — not dirty
  }
  async getCursor() {
    return this.cursor;
  }
  async setCursor(c: number) {
    this.cursor = c;
  }
  async markPushed(keys: readonly string[]) {
    for (const k of keys) this.dirty.delete(k);
  }
}

describe("runSync — incremental cursor (v3)", () => {
  it("a caught-up device pulls ~nothing on the next round (delta, not full set)", async () => {
    const backend = new VersionedBackend();
    const a = new CursorState();
    a.set("ul.x", "hello", at(10));
    await runSync({ cipher, backend, state: a });

    const b = new CursorState(["ul.x"]);
    const first = await runSync({ cipher, backend, state: b }); // cursor 0 → pulls the delta
    expect(b.get("ul.x")).toBe("hello");
    expect(first.applied).toBe(1);

    const second = await runSync({ cipher, backend, state: b }); // cursor advanced → nothing new
    expect(second.pulled).toBe(0);
    expect(second.applied).toBe(0);
  });

  it("pushes only dirty entries — a steady-state round uploads nothing", async () => {
    const backend = new VersionedBackend();
    const a = new CursorState();
    a.set("ul.x", "v", at(10));
    const first = await runSync({ cipher, backend, state: a });
    expect(first.pushed).toBe(1);
    const second = await runSync({ cipher, backend, state: a }); // nothing changed locally
    expect(second.pushed).toBe(0);
  });

  it("pages a large push under the chunk size", async () => {
    const backend = new VersionedBackend();
    const a = new CursorState();
    for (let i = 0; i < 600; i++) a.set(`ul.k${i}`, `v${i}`, at(10 + i));
    const out = await runSync({ cipher, backend, state: a });
    expect(out.pushed).toBe(600);
    expect(backend.exchanges).toBeGreaterThanOrEqual(2); // 600 > PUSH_CHUNK (500) → ≥2 pages
  });

  it("pages a large pull via the `more` flag until drained", async () => {
    const backend = new VersionedBackend(250); // small server page → forces multi-page pull
    const a = new CursorState();
    for (let i = 0; i < 600; i++) a.set(`ul.k${i}`, `v${i}`, at(10 + i));
    await runSync({ cipher, backend, state: a });

    const b = new CursorState(Array.from({ length: 600 }, (_, i) => `ul.k${i}`));
    const out = await runSync({ cipher, backend, state: b });
    expect(out.applied).toBe(600); // all pulled across pages
    for (let i = 0; i < 600; i++) expect(b.get(`ul.k${i}`)).toBe(`v${i}`);
  });

  it("converges two devices through the cursor (newer write wins, both directions)", async () => {
    const backend = new VersionedBackend();
    const a = new CursorState(["ul.x"]);
    const b = new CursorState(["ul.x"]);
    a.set("ul.x", "A", at(10, 0, "a"));
    await runSync({ cipher, backend, state: a });
    b.set("ul.x", "B", at(20, 0, "b")); // newer
    await runSync({ cipher, backend, state: b });
    const out = await runSync({ cipher, backend, state: a }); // a pulls the newer B
    expect(a.get("ul.x")).toBe("B");
    expect(out.applied).toBe(1);
  });
});
