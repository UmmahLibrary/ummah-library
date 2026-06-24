/**
 * Web {@link SyncStateStore} (#25, ADR 0033 + 0034) over the managed `ul.*`
 * localStorage keys. A **scalar** key syncs whole-value (v1); a **map** key
 * (`sync-shapes.ts`) is flattened into one synced record per element under a
 * synthetic key `mapKey + SEP + elementId`, so the engine merges per element and
 * concurrent edits to different entries don't clobber. `all()` reconciles each
 * (synthetic) key's clock then reads value+clock; `apply()` installs a winning
 * remote value — recomposing the owning map for a map element — and announces the
 * change so an open tab can re-read. A sync layer *beside* the existing stores.
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
import { clockFor, metaKeys, readCursor, reconcileValues, setClock, writeCursor } from "./sync-meta";
import { getItem, removeItem, setItem } from "./storage";
import { getNodeId } from "./sync-node";

/** Fired (per top-level key) after a remote value is applied, so open UI can re-read. */
export const SYNC_CHANGE_EVENT = "ul:sync:change";

function putItem(key: string, value: string | null): void {
  if (value === null) removeItem(key);
  else setItem(key, value);
}

function announce(key: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_CHANGE_EVENT, { detail: { key } }));
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Build a state store over the given managed keys (defaults to {@link MANAGED_KEYS}). */
export function createWebSyncStateStore(keys: readonly string[] = MANAGED_KEYS): SyncStateStore {
  const keySet = new Set(keys);
  return {
    all: async () => {
      const node = getNodeId();
      // Synthetic/scalar key -> value (the self-describing envelope for map elements).
      const values = new Map<string, string | null>();
      for (const key of keys) {
        const shape = shapeOf(key);
        if (shape.kind === "scalar") {
          values.set(key, getItem(key));
          continue;
        }
        for (const [id, v] of shape.explode(parseJson(getItem(key)))) {
          values.set(explodeKey(key, id), wrapElement(key, id, v));
        }
      }
      // An element that previously had meta but is gone locally → tombstone it.
      for (const metaKey of metaKeys()) {
        const parsed = parseElementKey(metaKey);
        if (parsed && keySet.has(parsed.mapKey) && !values.has(metaKey)) values.set(metaKey, null);
      }
      reconcileValues(values, new Date(), node);
      const records: SyncRecord[] = [];
      for (const [key, value] of values) records.push({ key, value, hlc: clockFor(key, node) });
      return records;
    },
    apply: async (key, value, hlc) => {
      const parsed = parseElementKey(key);
      if (parsed === null) {
        // scalar key — whole-value as in v1
        putItem(key, value);
        setClock(key, value, hlc);
        announce(key);
        return;
      }
      // map element — recompose the owning map around the winning element
      const shape = shapeOf(parsed.mapKey);
      if (shape.kind !== "map") return; // not a map this build manages
      const elements = shape.explode(parseJson(getItem(parsed.mapKey)));
      if (value === null) elements.delete(parsed.id);
      else elements.set(parsed.id, unwrapElement(value)?.v ?? value);
      putItem(parsed.mapKey, elements.size === 0 ? null : shape.rebuild(elements));
      setClock(key, value, hlc);
      announce(parsed.mapKey);
    },
    identify: (plaintext) => {
      const env = unwrapElement(plaintext);
      if (!env || !keySet.has(env.mk) || shapeOf(env.mk).kind !== "map") return null;
      return explodeKey(env.mk, env.k);
    },
    getCursor: async () => readCursor(),
    setCursor: async (cursor) => writeCursor(cursor),
  };
}
