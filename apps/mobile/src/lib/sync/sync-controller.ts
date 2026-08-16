/**
 * The mobile sync controller (#25, ADR 0033): wires an unlocked {@link Cipher} to
 * the HTTP transport and the local state store, exposing one `syncNow()` that runs
 * a full round (push local, pull + apply remote winners) via the pure core engine.
 * The cipher is derived once from the recovery secret and held for the session;
 * nothing here generates clocks — that is the state store's job.
 */
import {
  type Cipher,
  type SyncBackend,
  type SyncOutcome,
  type SyncStateStore,
  runSync,
} from "@ummahlibrary/core";
import { createHttpSyncBackend } from "./http-sync-backend";
import { createMobileSyncStateStore } from "./mobile-sync-state-store";
import { createNobleCipher } from "./noble-cipher";

export interface SyncController {
  /** Run one sync round now; resolves with what it pushed, pulled, and applied. */
  syncNow(): Promise<SyncOutcome>;
}

export interface SyncControllerOptions {
  /** Transport; defaults to the deployed HTTP backend. */
  backend?: SyncBackend;
  /** Local state; defaults to the managed-key AsyncStorage store. */
  state?: SyncStateStore;
}

/** Wire an already-unlocked cipher to the transport and local state. */
export function createSyncController(
  cipher: Cipher,
  options: SyncControllerOptions = {},
): SyncController {
  const backend = options.backend ?? createHttpSyncBackend();
  const state = options.state ?? createMobileSyncStateStore();
  return {
    syncNow: () => runSync({ cipher, backend, state }),
  };
}

/** Build a controller from the user's recovery secret (derives the cipher once). */
export async function createSyncControllerFromSecret(
  secret: string,
  options: SyncControllerOptions = {},
): Promise<SyncController> {
  return createSyncController(await createNobleCipher(secret), options);
}
