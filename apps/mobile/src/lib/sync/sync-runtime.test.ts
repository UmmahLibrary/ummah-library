/**
 * Mobile sync-runtime tests (#25, ADR 0033): the shared entry point is a no-op
 * when sync is off, derives the (expensive) cipher once per secret, and coalesces
 * concurrent calls — mobile's launch and foreground triggers routinely overlap and
 * must not run two rounds against the same sidecar at once.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./sync-settings", () => ({ isSyncEnabled: vi.fn(), readSyncSecret: vi.fn() }));
vi.mock("./sync-controller", () => ({ createSyncControllerFromSecret: vi.fn() }));
vi.mock("./sync-events", () => ({ emitSyncApplied: vi.fn() }));

import { isSyncEnabled, readSyncSecret } from "./sync-settings";
import { createSyncControllerFromSecret } from "./sync-controller";
import { emitSyncApplied } from "./sync-events";
import { resetSyncRuntime, syncIfEnabled } from "./sync-runtime";

const OUTCOME = { pushed: 1, pulled: 1, applied: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  resetSyncRuntime();
});

describe("syncIfEnabled", () => {
  it("resolves null and derives nothing when sync is off", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(false);
    expect(await syncIfEnabled()).toBeNull();
    expect(createSyncControllerFromSecret).not.toHaveBeenCalled();
  });

  it("resolves null when enabled but no secret is present", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue(null);
    expect(await syncIfEnabled()).toBeNull();
    expect(createSyncControllerFromSecret).not.toHaveBeenCalled();
  });

  it("runs a round and returns its outcome when enabled", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    const syncNow = vi.fn().mockResolvedValue(OUTCOME);
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({ syncNow });
    expect(await syncIfEnabled()).toEqual(OUTCOME);
    expect(syncNow).toHaveBeenCalledOnce();
  });

  it("emits sync-applied so contexts re-hydrate when a remote write won", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({
      syncNow: vi.fn().mockResolvedValue({ pushed: 0, pulled: 1, applied: 1 }),
    });
    await syncIfEnabled();
    expect(emitSyncApplied).toHaveBeenCalledOnce();
  });

  it("doesn't emit sync-applied when the round applied nothing", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({
      syncNow: vi.fn().mockResolvedValue({ pushed: 1, pulled: 0, applied: 0 }),
    });
    await syncIfEnabled();
    expect(emitSyncApplied).not.toHaveBeenCalled();
  });

  it("caches the cipher by secret until reset", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({ syncNow: vi.fn().mockResolvedValue(OUTCOME) });
    await syncIfEnabled();
    await syncIfEnabled();
    expect(createSyncControllerFromSecret).toHaveBeenCalledTimes(1); // reused
    resetSyncRuntime();
    await syncIfEnabled();
    expect(createSyncControllerFromSecret).toHaveBeenCalledTimes(2); // re-derived
  });

  it("resetSyncRuntime breaks coalescing so 'turn on' isn't stuck on a stale OFF round", async () => {
    // A launch/foreground round starts while sync is still OFF and stays pending.
    let releaseOff!: (v: boolean) => void;
    vi.mocked(isSyncEnabled).mockReturnValueOnce(new Promise<boolean>((r) => (releaseOff = r)));
    const p1 = syncIfEnabled();

    // The user enables sync mid-flight: state flips and the runtime is reset.
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    const syncNow = vi.fn().mockResolvedValue(OUTCOME);
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({ syncNow });
    resetSyncRuntime();

    // The next call must start a FRESH round (re-sampling enablement), not the stale one.
    const p2 = syncIfEnabled();
    expect(p2).not.toBe(p1);

    releaseOff(false); // let the stale round finish — it resolves null
    expect(await p1).toBeNull();
    expect(await p2).toEqual(OUTCOME);
    expect(syncNow).toHaveBeenCalledOnce();
  });

  it("coalesces concurrent calls into a single in-flight round", async () => {
    vi.mocked(isSyncEnabled).mockResolvedValue(true);
    vi.mocked(readSyncSecret).mockResolvedValue("secret");
    let release!: (v: typeof OUTCOME) => void;
    const syncNow = vi.fn(() => new Promise<typeof OUTCOME>((r) => (release = r)));
    vi.mocked(createSyncControllerFromSecret).mockResolvedValue({ syncNow });

    const p1 = syncIfEnabled();
    const p2 = syncIfEnabled();
    expect(p1).toBe(p2); // same in-flight promise
    await vi.waitFor(() => expect(syncNow).toHaveBeenCalledTimes(1));
    release(OUTCOME);
    expect(await p1).toEqual(OUTCOME);
    expect(await p2).toEqual(OUTCOME);
    expect(syncNow).toHaveBeenCalledTimes(1);
  });
});
