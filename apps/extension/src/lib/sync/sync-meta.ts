/**
 * The sync clock sidecar (#25, ADR 0033) for the extension: a `Meta` map from each
 * managed key to its Hybrid Logical Clock + a hash of the value at that clock,
 * stored device-locally (`chrome.storage.local` via `getCache`/`setCache`, key
 * `sync.meta`). Mirrors the mobile adapter's logic — pure in-memory helpers plus
 * async load/save — since `chrome.storage` is async. Never synced; never browser-
 * mirrored. Same never-tombstone-a-never-seen-key invariant as web/mobile.
 */
import { type Hlc, hlcInit, hlcTick, parseHlc } from "@ummahlibrary/core";
import { getCache, setCache } from "../storage";

const META_KEY = "sync.meta";

export interface MetaEntry {
  hlc: Hlc;
  hash: string;
}
export type Meta = Record<string, MetaEntry>;

function isValidHlc(v: unknown): v is Hlc {
  if (v === null || typeof v !== "object") return false;
  const h = v as { millis?: unknown; counter?: unknown; node?: unknown };
  return (
    typeof h.millis === "number" &&
    Number.isInteger(h.millis) &&
    h.millis >= 0 &&
    typeof h.counter === "number" &&
    Number.isInteger(h.counter) &&
    h.counter >= 0 &&
    typeof h.node === "string" &&
    h.node.length >= 1
  );
}

/** Read the sidecar, dropping any structurally-corrupt entry rather than trusting it. */
export async function loadMeta(): Promise<Meta> {
  const raw = await getCache<unknown>(META_KEY, {});
  if (raw === null || typeof raw !== "object") return {};
  const meta: Meta = {};
  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (entry === null || typeof entry !== "object") continue;
    const e = entry as { hlc?: unknown; hash?: unknown };
    const hlc = typeof e.hlc === "string" ? parseHlc(e.hlc) : e.hlc;
    if (isValidHlc(hlc) && typeof e.hash === "string") meta[key] = { hlc, hash: e.hash };
  }
  return meta;
}

export async function saveMeta(meta: Meta): Promise<void> {
  await setCache(META_KEY, meta);
}

/** FNV-1a — a tiny non-cryptographic hash, only used to detect a changed value. */
function hashValue(value: string | null): string {
  if (value === null) return "_";
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Bump the clock of every managed key whose value changed locally since the last
 * sync, mutating `meta` in place and returning whether anything changed. An absent
 * key with no prior meta is left untouched (no clock): "I don't have this key"
 * means *unknown*, not *deleted*, so a fresh device can't wipe another's data via
 * last-writer-wins. A tombstone is only minted when a key that *had* a value
 * (prior meta) becomes null.
 */
export function reconcileMeta(
  meta: Meta,
  keys: readonly string[],
  valuesByKey: Map<string, string | null>,
  now: Date,
  node: string,
): boolean {
  let changed = false;
  for (const key of keys) {
    const raw = valuesByKey.get(key) ?? null;
    const prev = meta[key];
    if (raw === null && !prev) continue;
    const hash = hashValue(raw);
    if (prev && prev.hash === hash) continue;
    const base = prev ? prev.hlc : hlcInit(node);
    const ticked = hlcTick(base, now);
    meta[key] = { hlc: { ...ticked, node }, hash };
    changed = true;
  }
  return changed;
}

/** The current clock for a key (a fresh clock if it has no meta yet). */
export function clockOf(meta: Meta, key: string, node: string): Hlc {
  const prev = meta[key];
  return prev ? prev.hlc : hlcInit(node);
}

/** Record the clock and value-hash for a key after applying a remote winner (mutates `meta`). */
export function setClockIn(meta: Meta, key: string, value: string | null, hlc: Hlc): void {
  meta[key] = { hlc, hash: hashValue(value) };
}
