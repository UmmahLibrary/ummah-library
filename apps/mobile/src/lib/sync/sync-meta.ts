/**
 * The sync clock sidecar (#25, ADR 0033): `ul.sync.meta` maps each managed key to
 * its Hybrid Logical Clock plus a hash of the value at that clock. Mirrors the web
 * adapter's logic exactly, but split into pure in-memory helpers plus async
 * load/save — AsyncStorage has no synchronous read, so the state store loads the
 * sidecar once per round instead of re-reading it per key. It lives beside the
 * existing stores and never interprets their values.
 */
import { type Hlc, hlcInit, hlcTick, parseHlc } from "@ummahlibrary/core";
import { getItem, setItem } from "./storage";

const META_KEY = "ul.sync.meta";

export interface MetaEntry {
  /**
   * The Hybrid Logical Clock for the key, stored **structurally** so it survives a
   * setClock→clockOf round-trip losslessly — `encodeHlc` can emit forms (empty
   * node, non-finite) that `parseHlc` rejects, which would otherwise drop the clock
   * to zero and make an applied remote entry re-apply every round.
   */
  hlc: Hlc;
  /** Hash of the value at the last clock update — detects local changes. */
  hash: string;
}
export type Meta = Record<string, MetaEntry>;

/** A persisted entry, tolerating the legacy encoded-string clock for migration. */
interface StoredMetaEntry {
  hlc: Hlc | string;
  hash: string;
}

/** A well-formed structural clock: non-negative integer millis/counter, non-empty node. */
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

/** Read + parse the sidecar, migrating legacy string clocks and dropping corrupt entries. */
export async function loadMeta(): Promise<Meta> {
  const raw = await getItem(META_KEY);
  if (!raw) return {};
  let parsed: Record<string, StoredMetaEntry>;
  try {
    parsed = JSON.parse(raw) as Record<string, StoredMetaEntry>;
  } catch {
    return {};
  }
  const meta: Meta = {};
  for (const [key, entry] of Object.entries(parsed)) {
    if (entry === null || typeof entry !== "object") continue;
    // Validate both the legacy string form (via parseHlc) and the structural form —
    // a corrupt or peer-synced sidecar could carry {millis:"abc",node:42}, which
    // would poison hlcCompare/hlcTick if trusted on truthiness alone.
    const hlc = typeof entry.hlc === "string" ? parseHlc(entry.hlc) : entry.hlc;
    if (isValidHlc(hlc) && typeof entry.hash === "string") meta[key] = { hlc, hash: entry.hash };
  }
  return meta;
}

export async function saveMeta(meta: Meta): Promise<void> {
  await setItem(META_KEY, JSON.stringify(meta));
}

const CURSOR_KEY = "ul.sync.cursor";

/** The highest server version this device has applied (ADR 0035 incremental pull); 0 if unset. */
export async function readCursor(): Promise<number> {
  const raw = await getItem(CURSOR_KEY);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

/** Persist the server's new cursor after a successful sync round. */
export async function writeCursor(cursor: number): Promise<void> {
  await setItem(CURSOR_KEY, String(cursor));
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
 * sync, mutating `meta` in place and returning whether anything changed. A local
 * write carries this device's node, while millis/counter advance monotonically
 * from the prior stamp; a key with an existing value but no meta yet is stamped as
 * a first local write.
 *
 * Crucially, an **absent key with no prior meta is left untouched** (no clock):
 * on a brand-new device "I don't have this key" means *unknown*, not *deleted*.
 * Stamping it at `now` would make the fresh device's emptiness win
 * last-writer-wins and wipe data set on another device. A tombstone is only minted
 * when a key that *did* have a value (prior meta) becomes null — a real deletion.
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
    if (raw === null && !prev) continue; // never-seen absent key — not a deletion
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
