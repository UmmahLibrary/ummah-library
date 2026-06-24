/**
 * The sync clock sidecar (#25, ADR 0033): `ul.sync.meta` maps each managed key to
 * its Hybrid Logical Clock plus a hash of the value at that clock. `reconcile`
 * bumps the clock of any key whose value changed locally since the last sync
 * (diff-at-sync), so the engine — which never mints clocks — sees a current clock
 * per key. It lives beside the existing stores and never interprets their values.
 */
import { type Hlc, hlcInit, hlcTick, parseHlc } from "@ummahlibrary/core";
import { getItem, setItem } from "./storage";

const META_KEY = "ul.sync.meta";

interface MetaEntry {
  /**
   * The Hybrid Logical Clock for the key, stored **structurally** so it survives
   * a setClock→clockFor round-trip losslessly — `encodeHlc` can emit forms (empty
   * node, non-finite) that `parseHlc` rejects, which would otherwise drop the
   * clock to zero and make an applied remote entry re-apply every round.
   */
  hlc: Hlc;
  /** Hash of the value at the last clock update — detects local changes. */
  hash: string;
}
type Meta = Record<string, MetaEntry>;

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

function readMeta(): Meta {
  const raw = getItem(META_KEY);
  if (!raw) return {};
  let parsed: Record<string, StoredMetaEntry>;
  try {
    parsed = JSON.parse(raw) as Record<string, StoredMetaEntry>;
  } catch {
    return {};
  }
  // Migrate the legacy `millis:counter:node` string form; drop any entry whose
  // clock can't be recovered rather than carrying a corrupt stamp forward.
  const meta: Meta = {};
  for (const [key, entry] of Object.entries(parsed)) {
    // The legacy string form is validated by parseHlc; the structural form must
    // be validated too (don't trust it on truthiness — a corrupt/peer-synced
    // sidecar could carry {millis:"abc",node:42}, which poisons hlcCompare/hlcTick).
    const hlc = typeof entry.hlc === "string" ? parseHlc(entry.hlc) : entry.hlc;
    if (isValidHlc(hlc)) meta[key] = { hlc, hash: entry.hash };
  }
  return meta;
}

function writeMeta(meta: Meta): void {
  setItem(META_KEY, JSON.stringify(meta));
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
 * sync. A local write therefore carries this device's node, while millis/counter
 * advance monotonically from the prior stamp; a key with an existing value but no
 * meta yet is stamped as a first local write. Persists only when something changed.
 *
 * Crucially, an **absent key with no prior meta is left untouched** (clock stays at
 * the zero `hlcInit`): on a brand-new device "I don't have this key" means *unknown*,
 * not *deleted*. Stamping it at `now` would make the fresh device's emptiness win
 * last-writer-wins and wipe data set on another device. A tombstone is only minted
 * when a key that *did* have a value (prior meta) becomes null — a real deletion.
 */
export function reconcile(keys: readonly string[], now: Date, node: string): void {
  const values = new Map<string, string | null>();
  for (const key of keys) values.set(key, getItem(key));
  reconcileValues(values, now, node);
}

/**
 * Like {@link reconcile}, but over already-computed `key → value` pairs. The
 * element-merge store (ADR 0034) flattens a map key into synthetic element keys
 * that have no storage entry of their own, so it supplies the values directly.
 * Same diff-at-sync semantics and the same never-tombstone-a-never-seen-key
 * invariant — applied per element.
 */
export function reconcileValues(
  valuesByKey: ReadonlyMap<string, string | null>,
  now: Date,
  node: string,
): void {
  const meta = readMeta();
  let changed = false;
  for (const [key, raw] of valuesByKey) {
    const prev = meta[key];
    if (raw === null && !prev) continue; // never-seen absent key/element — not a deletion
    const hash = hashValue(raw);
    if (prev && prev.hash === hash) continue;
    const base = prev ? prev.hlc : hlcInit(node);
    const ticked = hlcTick(base, now);
    meta[key] = { hlc: { ...ticked, node }, hash };
    changed = true;
  }
  if (changed) writeMeta(meta);
}

/** Every key currently tracked in the sidecar — lets the store tombstone a locally-removed element. */
export function metaKeys(): string[] {
  return Object.keys(readMeta());
}

const CURSOR_KEY = "ul.sync.cursor";

/** The highest server version this device has applied (ADR 0035 incremental pull); 0 if unset. */
export function readCursor(): number {
  const raw = getItem(CURSOR_KEY);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

/** Persist the server's new cursor after a successful sync round. */
export function writeCursor(cursor: number): void {
  setItem(CURSOR_KEY, String(cursor));
}

/** The current clock for a key (a fresh clock if it has no meta yet). */
export function clockFor(key: string, node: string): Hlc {
  const prev = readMeta()[key];
  return prev ? prev.hlc : hlcInit(node);
}

/** Record the clock and value-hash for a key after applying a remote winner. */
export function setClock(key: string, value: string | null, hlc: Hlc): void {
  const meta = readMeta();
  meta[key] = { hlc, hash: hashValue(value) };
  writeMeta(meta);
}
