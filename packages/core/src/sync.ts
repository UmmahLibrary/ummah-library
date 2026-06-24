/**
 * Sync primitives (#25, ADR 0033) — the pure, deterministic heart of cross-device
 * sync. A Hybrid Logical Clock gives every write a total order without a central
 * authority; `mergeEntries` resolves the two sides by last-writer-wins per key.
 * Nothing here touches crypto, the network, or the wall clock — the clock is
 * injected as a parameter (ADR 0001/0003) and encryption/transport are ports.
 */

/**
 * A Hybrid Logical Clock stamp: physical time, a same-millisecond counter, and a
 * stable per-device id to break ties. Together they totally order writes across
 * devices even when their wall clocks differ slightly.
 */
export interface Hlc {
  /** Physical wall-clock milliseconds at the moment of the write. */
  millis: number;
  /** Disambiguates writes within the same millisecond on one device. */
  counter: number;
  /** Stable per-device id; the final, deterministic tie-breaker. */
  node: string;
}

/** A fresh clock for a device, before its first write. */
export function hlcInit(node: string): Hlc {
  return { millis: 0, counter: 0, node };
}

/**
 * The clock for a new local write, given the previous stamp for that key and the
 * current instant. Never goes backwards: if the wall clock hasn't advanced past
 * the previous stamp, the counter increments instead of the timestamp.
 */
export function hlcTick(prev: Hlc, now: Date): Hlc {
  const wall = now.getTime();
  if (wall > prev.millis) return { millis: wall, counter: 0, node: prev.node };
  return { millis: prev.millis, counter: prev.counter + 1, node: prev.node };
}

/**
 * Total order over clocks: by physical time, then counter, then node id. Returns
 * `<0` if `a` precedes `b`, `>0` if it follows, and `0` only when identical.
 */
export function hlcCompare(a: Hlc, b: Hlc): number {
  if (a.millis !== b.millis) return a.millis - b.millis;
  if (a.counter !== b.counter) return a.counter - b.counter;
  return a.node < b.node ? -1 : a.node > b.node ? 1 : 0;
}

/** Compact string form for storage/transport: `millis:counter:node`. */
export function encodeHlc(h: Hlc): string {
  return `${h.millis}:${h.counter}:${h.node}`;
}

/** Parse {@link encodeHlc}; `null` if the string isn't a well-formed clock. */
export function parseHlc(s: string): Hlc | null {
  const i1 = s.indexOf(":");
  const i2 = s.indexOf(":", i1 + 1);
  if (i1 < 0 || i2 < 0) return null;
  const ms = s.slice(0, i1);
  const ct = s.slice(i1 + 1, i2);
  const node = s.slice(i2 + 1);
  // Strict plain-decimal fields: `Number()` would otherwise coerce "" → 0, hex,
  // exponent, sign and whitespace, fabricating a clock from malformed input.
  if (!/^\d+$/.test(ms) || !/^\d+$/.test(ct) || node === "") return null;
  return { millis: Number(ms), counter: Number(ct), node };
}

/**
 * One encrypted record as it rests on the server and travels on the wire. The
 * server only ever sees this shape — an opaque id, a clock, and ciphertext —
 * never the key name or the plaintext. `ciphertext: null` is a tombstone (the key
 * was deleted), so deletions propagate like any other write.
 */
export interface SyncEntry {
  /** Opaque, stable id for a logical key — a keyed hash of the key name. */
  id: string;
  /** Logical timestamp of the write this entry represents. */
  hlc: Hlc;
  /** Base64 AES-GCM ciphertext, or `null` for a tombstone. */
  ciphertext: string | null;
  /** Base64 nonce/IV for the ciphertext (`""` for a tombstone). */
  nonce: string;
}

/** A managed local key with its current value and clock (`value: null` = absent/deleted). */
export interface SyncRecord {
  key: string;
  value: string | null;
  hlc: Hlc;
  /**
   * v3 (ADR 0035): whether this entry changed locally since its last successful
   * push and so needs sending. Omitted ⇒ treated as dirty (push it) — preserving
   * the v1/v2 "push everything" behaviour for stores that don't track it.
   */
  dirty?: boolean;
}

/**
 * The server's reply to one exchange (ADR 0035). `entries` is the converged set —
 * or, when the client sent a `cursor`, only the delta newer than it. `cursor` is
 * the server's new high-water version to send next time (absent ⇒ the server
 * doesn't version, so the client falls back to whole-set sync). `more` means the
 * server truncated the delta to a page; the client should sync again.
 */
export interface SyncExchangeResult {
  entries: readonly SyncEntry[];
  cursor?: number;
  more?: boolean;
}

/** The outcome of merging two sides. */
export interface MergeResult {
  /** The converged set — the newest entry per id. */
  merged: SyncEntry[];
  /** Entries where the *other* side won — apply these locally. */
  incoming: SyncEntry[];
  /** Entries where *this* side won, or the other side lacked — push these. */
  outgoing: SyncEntry[];
}

function indexById(entries: readonly SyncEntry[]): Map<string, SyncEntry> {
  const m = new Map<string, SyncEntry>();
  for (const e of entries) m.set(e.id, e);
  return m;
}

/**
 * Merge two sets of entries by last-writer-wins per id (the clock decides). Pure
 * and symmetric in shape, so the one function serves both the client (its local
 * set vs the server's reply) and the server (its stored set vs the client's
 * push). `incoming` is what the caller should apply; `outgoing` is what it should
 * send. Ties (identical clocks) keep `local` and surface in neither list.
 */
export function mergeEntries(
  local: readonly SyncEntry[],
  remote: readonly SyncEntry[],
): MergeResult {
  const l = indexById(local);
  const r = indexById(remote);
  const merged: SyncEntry[] = [];
  const incoming: SyncEntry[] = [];
  const outgoing: SyncEntry[] = [];
  for (const id of new Set<string>([...l.keys(), ...r.keys()])) {
    const a = l.get(id);
    const b = r.get(id);
    if (a && b) {
      const cmp = hlcCompare(a.hlc, b.hlc);
      if (cmp < 0) {
        merged.push(b);
        incoming.push(b);
      } else if (cmp > 0) {
        merged.push(a);
        outgoing.push(a);
      } else {
        merged.push(a);
      }
    } else if (b) {
      merged.push(b);
      incoming.push(b);
    } else if (a) {
      merged.push(a);
      outgoing.push(a);
    }
  }
  return { merged, incoming, outgoing };
}
