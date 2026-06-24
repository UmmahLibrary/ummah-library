import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { disableSync, enableSync, isSyncEnabled, readSyncSecret } from "./sync-settings";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("sync-settings", () => {
  it("is off and secret-less by default", () => {
    expect(isSyncEnabled()).toBe(false);
    expect(readSyncSecret()).toBeNull();
  });

  it("enables with a secret and reports it", () => {
    enableSync("DEMO1-DEMO2-DEMO3");
    expect(isSyncEnabled()).toBe(true);
    expect(readSyncSecret()).toBe("DEMO1-DEMO2-DEMO3");
  });

  it("disabling forgets the secret", () => {
    enableSync("s");
    disableSync();
    expect(isSyncEnabled()).toBe(false);
    expect(readSyncSecret()).toBeNull();
  });

  it("is not 'enabled' if the secret is gone but the flag lingers", () => {
    enableSync("s");
    localStorage.removeItem("ul.sync.secret");
    expect(isSyncEnabled()).toBe(false);
  });
});
