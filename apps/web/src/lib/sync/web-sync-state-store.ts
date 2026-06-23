/**
 * Web {@link SyncStateStore} (#25, ADR 0033) over the managed `ul.*` localStorage
 * keys. `all()` reconciles each key's clock (diff-at-sync) then reads value+clock;
 * `apply()` installs a winning remote value at its clock and announces the change
 * so an open tab can re-read. This is a sync layer *beside* the existing stores —
 * it never changes how they read or write their own values, so sync staying off
 * is a no-op for every feature.
 */
import type { SyncStateStore } from "@ummahlibrary/core";
import { MANAGED_KEYS } from "./managed-keys";
import { clockFor, reconcile, setClock } from "./sync-meta";
import { getItem, removeItem, setItem } from "./storage";
import { getNodeId } from "./sync-node";

/** Fired (per key) after a remote value is applied, so open UI can re-read. */
export const SYNC_CHANGE_EVENT = "ul:sync:change";

function putItem(key: string, value: string | null): void {
  if (value === null) removeItem(key);
  else setItem(key, value);
}

function announce(key: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_CHANGE_EVENT, { detail: { key } }));
}

/** Build a state store over the given managed keys (defaults to {@link MANAGED_KEYS}). */
export function createWebSyncStateStore(keys: readonly string[] = MANAGED_KEYS): SyncStateStore {
  return {
    all: async () => {
      const node = getNodeId();
      reconcile(keys, new Date(), node);
      return keys.map((key) => ({ key, value: getItem(key), hlc: clockFor(key, node) }));
    },
    apply: async (key, value, hlc) => {
      putItem(key, value);
      setClock(key, value, hlc);
      announce(key);
    },
  };
}
