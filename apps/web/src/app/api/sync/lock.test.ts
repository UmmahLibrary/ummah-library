import { describe, expect, it } from "vitest";
import { handleSync } from "./handler";
import { InMemoryLock } from "./lock";
import { InMemorySyncStore } from "./sync-store";

describe("InMemoryLock", () => {
  it("serializes critical sections for the same key (never two at once)", async () => {
    const lock = new InMemoryLock();
    let active = 0;
    let maxActive = 0;
    const task = () =>
      lock.withLock("k", async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active -= 1;
      });
    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(1);
  });

  it("runs different keys concurrently", async () => {
    const lock = new InMemoryLock();
    let active = 0;
    let maxActive = 0;
    const task = (k: string) =>
      lock.withLock(k, async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active -= 1;
      });
    await Promise.all([task("a"), task("b")]);
    expect(maxActive).toBe(2);
  });

  it("releases the lock even when the body throws", async () => {
    const lock = new InMemoryLock();
    await expect(
      lock.withLock("k", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await lock.withLock("k", async () => "ok")).toBe("ok"); // not deadlocked
  });
});

describe("handleSync under a lock (atomic merge, ADR 0035)", () => {
  it("does not lose a write when two devices push the same account at once", async () => {
    const store = new InMemorySyncStore();
    const lock = new InMemoryLock();
    const auth = `Bearer ${"a".repeat(64)}`;
    const entry = (id: string) => ({
      id,
      hlc: { millis: 1, counter: 0, node: id },
      ciphertext: "c",
      nonce: "iv",
    });
    await Promise.all([
      handleSync({ authorization: auth, body: { entries: [entry("X")] } }, store, lock),
      handleSync({ authorization: auth, body: { entries: [entry("Y")] } }, store, lock),
    ]);
    const ids = (await store.get("a".repeat(64))).map((e) => e.id).sort();
    expect(ids).toEqual(["X", "Y"]); // both survived — neither push clobbered the other
  });
});
