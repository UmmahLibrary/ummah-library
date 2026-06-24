/**
 * The extension's active sync controller (#25, ADR 0033). Derives the cipher once
 * from the stored secret (PBKDF2 is deliberately slow) and caches it by secret, so
 * the popup-open trigger and the "Sync now" button share one instance.
 * `syncIfEnabled` is the single entry point — a no-op (resolves `null`) when sync
 * is off — and coalesces concurrent calls; `resetSyncRuntime()` clears both the
 * cached cipher and any in-flight round so a just-enabled sync starts fresh rather
 * than being coalesced onto a round that sampled sync as OFF.
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
  if (!(await isSyncEnabled())) return null;
  const secret = await readSyncSecret();
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
