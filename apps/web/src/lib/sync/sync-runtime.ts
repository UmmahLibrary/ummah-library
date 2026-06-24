/**
 * The app's active sync controller (#25, ADR 0033). Derives the cipher once from
 * the stored secret (PBKDF2 is deliberately slow) and caches it by secret, so the
 * {@link SyncBootstrap} auto-triggers and the Settings "Sync now" button share one
 * instance. `syncIfEnabled` is the single entry point both call — it is a no-op
 * (resolves `null`) whenever sync is off, so callers never need to check first.
 */
import type { SyncOutcome } from "@ummahlibrary/core";
import { type SyncController, createSyncControllerFromSecret } from "./sync-controller";
import { isSyncEnabled, readSyncSecret } from "./sync-settings";

let cached: { secret: string; controller: Promise<SyncController> } | null = null;

function controllerFor(secret: string): Promise<SyncController> {
  if (cached?.secret !== secret) {
    cached = { secret, controller: createSyncControllerFromSecret(secret) };
  }
  return cached.controller;
}

/** Run one sync round if sync is enabled; resolves `null` when it's off. */
export async function syncIfEnabled(): Promise<SyncOutcome | null> {
  if (!isSyncEnabled()) return null;
  const secret = readSyncSecret();
  if (!secret) return null;
  return (await controllerFor(secret)).syncNow();
}

/** Drop the cached controller — call after disabling sync or changing the secret. */
export function resetSyncRuntime(): void {
  cached = null;
}
