import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub the controller factory so we never run real PBKDF2 / network here.
const syncNow = vi.fn(async () => ({ pushed: 3, pulled: 3, applied: 1 }));
const create = vi.fn(async (_secret: string) => ({ syncNow }));
vi.mock("./sync-controller", () => ({
  createSyncControllerFromSecret: (secret: string) => create(secret),
}));

import { enableSync } from "./sync-settings";
import { resetSyncRuntime, syncIfEnabled } from "./sync-runtime";

beforeEach(() => {
  localStorage.clear();
  resetSyncRuntime();
  syncNow.mockClear();
  create.mockClear();
});
afterEach(() => localStorage.clear());

describe("syncIfEnabled", () => {
  it("is a no-op when sync is off", async () => {
    expect(await syncIfEnabled()).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("runs a round when enabled and returns the outcome", async () => {
    enableSync("phrase-a");
    const outcome = await syncIfEnabled();
    expect(outcome).toEqual({ pushed: 3, pulled: 3, applied: 1 });
    expect(syncNow).toHaveBeenCalledOnce();
  });

  it("derives the cipher only once across repeated syncs (same secret)", async () => {
    enableSync("phrase-a");
    await syncIfEnabled();
    await syncIfEnabled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(syncNow).toHaveBeenCalledTimes(2);
  });

  it("re-derives when the secret changes", async () => {
    enableSync("phrase-a");
    await syncIfEnabled();
    enableSync("phrase-b");
    await syncIfEnabled();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
