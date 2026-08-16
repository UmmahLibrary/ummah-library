/**
 * Mobile {@link SyncStateStore} (#25, ADR 0033) over the managed `ul.*`
 * AsyncStorage keys. `all()` reads every managed value in one `multiGet`,
 * reconciles each key's clock (diff-at-sync) against the sidecar, then returns
 * value+clock; `apply()` installs a winning remote value at its clock and records
 * it in the sidecar. This is a sync layer *beside* the existing stores — it never
 * changes how they read or write their own values, so sync staying off is a no-op
 * for every feature.
 *
 * Named `*-store.ts` (and routing raw access through `./storage`) so the ADR-0028
 * persistence lint is satisfied without a single disable.
 */
import { MANAGED_KEYS, type SyncStateStore } from "@ummahlibrary/core";
import { multiGet, removeItem, setItem } from "./storage";
import { clockOf, loadMeta, reconcileMeta, saveMeta, setClockIn } from "./sync-meta";
import { getNodeId } from "./sync-node";

/** Build a state store over the given managed keys (defaults to {@link MANAGED_KEYS}). */
export function createMobileSyncStateStore(
  keys: readonly string[] = MANAGED_KEYS,
): SyncStateStore {
  return {
    all: async () => {
      const node = await getNodeId();
      const values = await multiGet(keys);
      const meta = await loadMeta();
      if (reconcileMeta(meta, keys, values, new Date(), node)) await saveMeta(meta);
      return keys.map((key) => ({ key, value: values.get(key) ?? null, hlc: clockOf(meta, key, node) }));
    },
    apply: async (key, value, hlc) => {
      if (value === null) await removeItem(key);
      else await setItem(key, value);
      const meta = await loadMeta();
      setClockIn(meta, key, value, hlc);
      await saveMeta(meta);
    },
  };
}
