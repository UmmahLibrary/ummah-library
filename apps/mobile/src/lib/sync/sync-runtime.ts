/**
 * The app's active sync controller (#25, ADR 0033). Derives the cipher once from
 * the stored secret (PBKDF2 is deliberately slow) and caches it by secret, so the
 * foreground auto-trigger and the Settings "Sync now" button share one instance.
 * `syncIfEnabled` is the single entry point both call — a no-op (resolves `null`)
 * whenever sync is off, so callers never need to check first.
 *
 * Concurrent calls are **coalesced**: on mobile the app-launch trigger and the
 * `AppState` "active" trigger routinely fire within the same tick, and two
 * overlapping rounds would race on the shared `ul.sync.meta` sidecar. While a
 * round is in flight, additional calls return that same promise.
 */
import type { SyncOutcome } from "@ummahlibrary/core";
import { type SyncController, createSyncControllerFromSecret } from "./sync-controller";
import { emitSyncApplied } from "./sync-events";
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
  const outcome = await (await controllerFor(secret)).syncNow();
  // The engine writes AsyncStorage directly (bypassing every feature's own
  // setter), so re-hydrate the contexts that mirror it in memory — but only
  // when a remote write actually won, to avoid a pointless re-read on every
  // round (most rounds pull nothing new).
  if (outcome.applied > 0) emitSyncApplied();
  return outcome;
}

/** Run one sync round if sync is enabled; resolves `null` when it's off. Coalesces concurrent calls. */
export function syncIfEnabled(): Promise<SyncOutcome | null> {
  if (inFlight) return inFlight;
  // Capture the round locally so its `finally` only clears `inFlight` if it's still
  // THIS round — `resetSyncRuntime()` may have already started a fresh one (e.g. the
  // user enabled sync mid-flight), and that newer round must not be cleared early.
  const round = run().finally(() => {
    if (inFlight === round) inFlight = null;
  });
  inFlight = round;
  return round;
}

/**
 * Drop the cached controller AND any in-flight round — call after enabling,
 * disabling, or changing the secret. Clearing `inFlight` is essential: a state
 * change must force the next `syncIfEnabled()` to start a fresh round that
 * re-samples enablement, otherwise "Turn on sync" could be coalesced onto a
 * still-pending round that sampled sync as OFF and resolves a misleading `null`.
 */
export function resetSyncRuntime(): void {
  cached = null;
  inFlight = null;
}
