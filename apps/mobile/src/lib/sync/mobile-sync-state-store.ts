/**
 * Mobile {@link SyncStateStore} (#25, ADR 0033 + 0034) over the managed `ul.*`
 * AsyncStorage keys. A **scalar** key syncs whole-value (v1); a **map** key
 * (`sync-shapes.ts`) is flattened into one synced record per element under a
 * synthetic key `mapKey + SEP + elementId`, so the engine merges per element and
 * concurrent edits to different entries don't clobber. `all()` reads every managed
 * value in one `multiGet`, explodes the maps, reconciles each (synthetic) key's
 * clock, then returns value+clock; `apply()` installs a winning remote value —
 * recomposing the owning map for a map element — and records it in the sidecar.
 *
 * Named `*-store.ts` (and routing raw access through `./storage`) so the ADR-0028
 * persistence lint is satisfied without a single disable.
 */
import {
  MANAGED_KEYS,
  type SyncRecord,
  type SyncStateStore,
  explodeKey,
  parseElementKey,
  shapeOf,
  unwrapElement,
  wrapElement,
} from "@ummahlibrary/core";
import { getItem, multiGet, removeItem, setItem } from "./storage";
import {
  clockOf,
  loadMeta,
  readCursor,
  reconcileMeta,
  saveMeta,
  setClockIn,
  writeCursor,
} from "./sync-meta";
import { getNodeId } from "./sync-node";

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Build a state store over the given managed keys (defaults to {@link MANAGED_KEYS}). */
export function createMobileSyncStateStore(
  keys: readonly string[] = MANAGED_KEYS,
): SyncStateStore {
  const keySet = new Set(keys);
  return {
    all: async () => {
      const node = await getNodeId();
      const stored = await multiGet(keys); // base key -> whole value
      // Synthetic/scalar key -> value (the self-describing envelope for map elements).
      const values = new Map<string, string | null>();
      for (const key of keys) {
        const shape = shapeOf(key);
        if (shape.kind === "scalar") {
          values.set(key, stored.get(key) ?? null);
          continue;
        }
        for (const [id, v] of shape.explode(parseJson(stored.get(key) ?? null))) {
          values.set(explodeKey(key, id), wrapElement(key, id, v));
        }
      }
      const meta = await loadMeta();
      // An element that previously had meta but is gone locally → tombstone it.
      for (const metaKey of Object.keys(meta)) {
        const parsed = parseElementKey(metaKey);
        if (parsed && keySet.has(parsed.mapKey) && !values.has(metaKey)) values.set(metaKey, null);
      }
      const syntheticKeys = [...values.keys()];
      if (reconcileMeta(meta, syntheticKeys, values, new Date(), node)) await saveMeta(meta);
      const records: SyncRecord[] = [];
      for (const [key, value] of values) records.push({ key, value, hlc: clockOf(meta, key, node) });
      return records;
    },
    apply: async (key, value, hlc) => {
      const parsed = parseElementKey(key);
      if (parsed === null) {
        // scalar key — whole-value as in v1
        if (value === null) await removeItem(key);
        else await setItem(key, value);
        const meta = await loadMeta();
        setClockIn(meta, key, value, hlc);
        await saveMeta(meta);
        return;
      }
      // map element — recompose the owning map around the winning element
      const shape = shapeOf(parsed.mapKey);
      if (shape.kind !== "map") return; // not a map this build manages
      const elements = shape.explode(parseJson(await getItem(parsed.mapKey)));
      if (value === null) elements.delete(parsed.id);
      else elements.set(parsed.id, unwrapElement(value)?.v ?? value);
      const rebuilt = elements.size === 0 ? null : shape.rebuild(elements);
      if (rebuilt === null) await removeItem(parsed.mapKey);
      else await setItem(parsed.mapKey, rebuilt);
      const meta = await loadMeta();
      setClockIn(meta, key, value, hlc);
      await saveMeta(meta);
    },
    identify: (plaintext) => {
      const env = unwrapElement(plaintext);
      if (!env || !keySet.has(env.mk) || shapeOf(env.mk).kind !== "map") return null;
      return explodeKey(env.mk, env.k);
    },
    getCursor: () => readCursor(),
    setCursor: (cursor) => writeCursor(cursor),
  };
}
