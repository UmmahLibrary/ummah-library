/**
 * The extension sync controller (#25, ADR 0033): wires an unlocked {@link Cipher}
 * to the HTTP transport and the extension state store, exposing one `syncNow()`
 * that runs a full round via the pure core engine. The cipher is derived once from
 * the recovery secret; nothing here generates clocks — that is the state store's job.
 */
import {
  type Cipher,
  type SyncBackend,
  type SyncOutcome,
  type SyncStateStore,
  runSync,
} from "@ummahlibrary/core";
import { createHttpSyncBackend } from "./http-sync-backend";
import { createExtSyncStateStore } from "./ext-sync-state-store";
import { createWebCryptoCipher } from "./web-crypto-cipher";

export interface SyncController {
  syncNow(): Promise<SyncOutcome>;
}

export interface SyncControllerOptions {
  backend?: SyncBackend;
  state?: SyncStateStore;
}

export function createSyncController(
  cipher: Cipher,
  options: SyncControllerOptions = {},
): SyncController {
  const backend = options.backend ?? createHttpSyncBackend();
  const state = options.state ?? createExtSyncStateStore();
  return {
    syncNow: () => runSync({ cipher, backend, state }),
  };
}

export async function createSyncControllerFromSecret(
  secret: string,
  options: SyncControllerOptions = {},
): Promise<SyncController> {
  return createSyncController(await createWebCryptoCipher(secret), options);
}
