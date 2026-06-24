/**
 * In-app refresh signal for mobile sync (#25, ADR 0033/0034). The sync engine writes
 * AsyncStorage directly, bypassing the feature write-paths, so the React contexts
 * don't learn that a pulled value landed. After a sync round applies remote changes,
 * `App` emits this and the providers re-hydrate — the mobile counterpart of the web
 * `SYNC_CHANGE_EVENT` wiring. Uses `DeviceEventEmitter` (RN has no window events).
 */
import { DeviceEventEmitter } from "react-native";

const SYNC_APPLIED = "ul:sync:applied";

/** Announce that a sync round applied remote changes, so contexts re-hydrate live. */
export function emitSyncApplied(): void {
  DeviceEventEmitter.emit(SYNC_APPLIED);
}

/** Re-hydrate on a sync-applied signal; returns an unsubscribe. */
export function onSyncApplied(handler: () => void): () => void {
  const sub = DeviceEventEmitter.addListener(SYNC_APPLIED, handler);
  return () => sub.remove();
}
