/**
 * The app's active sync controller (#25, ADR 0033). Derives the cipher once from
 * the stored secret (PBKDF2 is deliberately slow) and caches it by secret, so the
 * {@link SyncBootstrap} auto-triggers and the Settings "Sync now" button share one
 * instance. `syncIfEnabled` is the single entry point both call — a no-op
 * (resolves `null`) whenever sync is off, so callers never need to check first.
 *
 * Concurrent calls are **coalesced** (matching the mobile runtime): `SyncBootstrap`
 * wires both `visibilitychange` and window `focus`, which both fire on a single tab
 * refocus, and "Sync now" can overlap a background round. Two overlapping rounds
 * would interleave at every `await` and could transiently regress the shared
 * `ul.sync.meta` clock sidecar, so while a round is in flight, extra calls return it.
 */
import type { SyncOutcome } from "@ummahlibrary/core";
import { type SyncController, createSyncControllerFromSecret } from "./sync-controller";
import { isSyncEnabled, readSyncSecret } from "./sync-settings";

let cached: { secret: string; controller: Promise<SyncController> } | null = null;
let inFlight: Promise<SyncOutcome | null> | null = null;

function controllerFor(secret: string): Promise<SyncController> {
  if (cached?.secret !== secret) {
    cached = { secret, controller: createSyncControllerFromSecret(secret) };
  }
  return cached.controller;
}

async function run(): Promise<SyncOutcome | null> {
  if (!isSyncEnabled()) return null;
  const secret = readSyncSecret();
  if (!secret) return null;
  return (await controllerFor(secret)).syncNow();
}

/** Run one sync round if sync is enabled; resolves `null` when it's off. Coalesces concurrent calls. */
export function syncIfEnabled(): Promise<SyncOutcome | null> {
  if (inFlight) return inFlight;
  const round = run().finally(() => {
    if (inFlight === round) inFlight = null;
  });
  inFlight = round;
  return round;
}

/** Drop the cached controller and any in-flight round — call after enabling/disabling/changing the secret. */
export function resetSyncRuntime(): void {
  cached = null;
  inFlight = null;
}
