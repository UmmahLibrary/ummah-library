import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { disableSync, enableSync, isSyncEnabled, readSyncSecret } from "./sync-settings";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("sync-settings", () => {
  it("is off and secret-less by default", async () => {
    expect(await isSyncEnabled()).toBe(false);
    expect(await readSyncSecret()).toBeNull();
  });

  it("enables with a secret and reports it", async () => {
    await enableSync("DEMO1-DEMO2-DEMO3");
    expect(await isSyncEnabled()).toBe(true);
    expect(await readSyncSecret()).toBe("DEMO1-DEMO2-DEMO3");
  });

  it("stores the secret wrapped, not in plaintext (ADR 0033 §5 at-rest hardening)", async () => {
    await enableSync("DEMO1-DEMO2-DEMO3");
    const stored = localStorage.getItem("ul.sync.secret");
    expect(stored).not.toBeNull();
    expect(stored).not.toBe("DEMO1-DEMO2-DEMO3");
    expect(stored).toMatch(/^v1:/);
  });

  it("disabling forgets the secret", async () => {
    await enableSync("s");
    disableSync();
    expect(await isSyncEnabled()).toBe(false);
    expect(await readSyncSecret()).toBeNull();
  });

  it("is not 'enabled' if the secret is gone but the flag lingers", async () => {
    await enableSync("s");
    localStorage.removeItem("ul.sync.secret");
    expect(await isSyncEnabled()).toBe(false);
  });

  it("migrates a pre-hardening plaintext secret in place", async () => {
    localStorage.setItem("ul.sync.secret", "LEGACY-PLAINTEXT-CODE"); // simulates a pre-hardening install
    localStorage.setItem("ul.sync.enabled", "1");
    expect(await readSyncSecret()).toBe("LEGACY-PLAINTEXT-CODE");
    const stored = localStorage.getItem("ul.sync.secret");
    expect(stored).toMatch(/^v1:/); // upgraded in place
    expect(await readSyncSecret()).toBe("LEGACY-PLAINTEXT-CODE"); // still reads back correctly after upgrading
  });
});
