/**
 * The `/api/sync` request logic (#25, ADR 0033/0035), separated from the Next route
 * shell so it unit-tests against an {@link SyncStore} fake. It authenticates the
 * Bearer `accountId`, validates the encrypted entries (size/shape caps guard the
 * unauthenticated, E2E-encrypted endpoint against abuse), merges the client's push
 * with the stored set via the pure core `mergeEntries`, and returns only the
 * **delta** past the client's `cursor` (ADR 0035), paged. The server never
 * decrypts anything.
 */
import { type SyncEntry, hlcCompare, mergeEntries } from "@ummahlibrary/core";
import type { Lock } from "./lock";
import type { ServerEntry, SyncStore } from "./sync-store";

const MAX_ENTRIES = 2000; // max push entries per request (clients page well under this)
const MAX_CIPHERTEXT = 64 * 1024;
const MAX_NONCE = 256;
const MAX_NODE = 128;
const MAX_DELTA = 1000; // max entries returned per delta page (ADR 0035 — the client pages via `more`)

/**
 * A clock field must be a non-negative safe integer. Rejects `NaN`/`Infinity`
 * (reachable via `1e400` in a JSON body), `1e308` (finite but past the safe
 * range), and negative/fractional values — any of which would corrupt the
 * last-writer-wins ordering in `hlcCompare`.
 */
function isClockInt(v: unknown): boolean {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
}

export interface SyncResult {
  status: number;
  body: unknown;
}

/** The 64-hex `accountId` out of an `Authorization: Bearer …` header, or `null`. */
export function parseAccountId(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer ([0-9a-f]{64})$/.exec(authorization);
  return m ? m[1]! : null;
}

function isValidEntry(v: unknown): v is SyncEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  if (typeof e.id !== "string" || e.id.length === 0 || e.id.length > 128) return false;
  if (typeof e.nonce !== "string" || e.nonce.length > MAX_NONCE) return false;
  if (e.ciphertext !== null && typeof e.ciphertext !== "string") return false;
  if (typeof e.ciphertext === "string" && e.ciphertext.length > MAX_CIPHERTEXT) return false;
  const h = e.hlc as Record<string, unknown> | null;
  if (typeof h !== "object" || h === null) return false;
  return (
    isClockInt(h.millis) &&
    isClockInt(h.counter) &&
    typeof h.node === "string" &&
    h.node.length >= 1 &&
    h.node.length <= MAX_NODE
  );
}

/** Re-read a stored entry's version, defaulting a missing/corrupt one to 0. */
function versionOf(e: SyncEntry): number {
  const v = (e as ServerEntry).v;
  return isClockInt(v) ? v : 0;
}

/**
 * Run one sync exchange (ADR 0035): authenticate, validate, merge by clock, assign
 * a server version to every entry the push changed, persist, and return the delta
 * newer than the client's `cursor` (paged, with a `more` flag), excluding the
 * client's own unchanged pushes (it already has those).
 *
 * The read → merge → write is serialized per account by the optional {@link Lock}
 * (ADR 0035) so two devices pushing at once can't lose a write; without a lock it
 * behaves as before (fine for a single instance / tests).
 */
export async function handleSync(
  input: { authorization: string | null; body: unknown },
  store: SyncStore,
  lock?: Lock,
): Promise<SyncResult> {
  const accountId = parseAccountId(input.authorization);
  if (!accountId) return { status: 401, body: { error: "missing or malformed account id" } };

  const body = input.body as { entries?: unknown; cursor?: unknown } | null;
  const push = body?.entries;
  if (!Array.isArray(push)) return { status: 400, body: { error: "entries must be an array" } };
  if (push.length > MAX_ENTRIES) return { status: 413, body: { error: "too many entries" } };
  if (!push.every(isValidEntry)) return { status: 400, body: { error: "malformed entry" } };
  const cursor = isClockInt(body?.cursor) ? (body!.cursor as number) : 0;

  // The atomic critical section: re-read, merge, version, persist, compute the delta.
  const exchange = async (): Promise<SyncResult> => {
    // Re-validate the stored set on read: a value persisted before this hardening
    // (or hand-edited in Redis) must not poison the merge with a malformed clock.
    const stored: ServerEntry[] = (await store.get(accountId))
      .filter(isValidEntry)
      .map((e) => ({ ...e, v: versionOf(e) }));

    let top = stored.reduce((max, e) => Math.max(max, e.v), 0);
    const { merged, incoming } = mergeEntries(stored, push); // stored = local, push = remote ⇒ incoming = push won
    const changedIds = new Set(incoming.map((e) => e.id));
    const storedV = new Map(stored.map((e) => [e.id, e.v]));
    // A push-changed entry gets a fresh (higher) version; an unchanged one keeps its
    // version — UNLESS that version is ≤ 0, which means it was written by the pre-v3
    // server (no `v` field, defaulted to 0). Such legacy entries must be re-stamped
    // above 0 on the first v3 exchange, or a fresh device's cursor-0 delta (`v > 0`)
    // would exclude them forever and never converge after the upgrade.
    const next: ServerEntry[] = merged.map((e) => {
      const prior = storedV.get(e.id) ?? 0;
      return { ...e, v: changedIds.has(e.id) || prior <= 0 ? ++top : prior };
    });
    await store.set(accountId, next);

    const pushedHlc = new Map(push.map((e) => [e.id, e.hlc]));
    const delta = next
      .filter((e) => e.v > cursor)
      // Don't echo the client's own pushes back unchanged — it already has them.
      .filter((e) => !(pushedHlc.has(e.id) && hlcCompare(e.hlc, pushedHlc.get(e.id)!) === 0))
      .sort((a, b) => a.v - b.v);
    const page = delta.slice(0, MAX_DELTA);
    const more = delta.length > page.length;
    const nextCursor = more ? page[page.length - 1]!.v : top;

    return {
      status: 200,
      body: { entries: page.map(({ v: _v, ...entry }) => entry), cursor: nextCursor, more },
    };
  };

  return lock ? lock.withLock(accountId, exchange) : exchange();
}
