/**
 * The `/api/sync` request logic (#25, ADR 0033), separated from the Next route
 * shell so it unit-tests against an {@link SyncStore} fake. It authenticates the
 * Bearer `accountId`, validates the encrypted entries (size/shape caps guard the
 * unauthenticated, E2E-encrypted endpoint against abuse), then converges the
 * client's set with the stored set via the pure core `mergeEntries` and persists
 * the result. The server never decrypts anything.
 */
import { type SyncEntry, mergeEntries } from "@ummahlibrary/core";
import type { SyncStore } from "./sync-store";

const MAX_ENTRIES = 500;
const MAX_CIPHERTEXT = 64 * 1024;

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
  if (typeof e.nonce !== "string") return false;
  if (e.ciphertext !== null && typeof e.ciphertext !== "string") return false;
  if (typeof e.ciphertext === "string" && e.ciphertext.length > MAX_CIPHERTEXT) return false;
  const h = e.hlc as Record<string, unknown> | null;
  if (typeof h !== "object" || h === null) return false;
  return (
    typeof h.millis === "number" && typeof h.counter === "number" && typeof h.node === "string"
  );
}

/** Run one sync exchange: authenticate, validate, converge by clock, persist. */
export async function handleSync(
  input: { authorization: string | null; body: unknown },
  store: SyncStore,
): Promise<SyncResult> {
  const accountId = parseAccountId(input.authorization);
  if (!accountId) return { status: 401, body: { error: "missing or malformed account id" } };

  const entries = (input.body as { entries?: unknown } | null)?.entries;
  if (!Array.isArray(entries)) return { status: 400, body: { error: "entries must be an array" } };
  if (entries.length > MAX_ENTRIES) return { status: 413, body: { error: "too many entries" } };
  if (!entries.every(isValidEntry)) return { status: 400, body: { error: "malformed entry" } };

  const stored = await store.get(accountId);
  const merged = mergeEntries(stored, entries).merged;
  await store.set(accountId, merged);
  return { status: 200, body: { entries: merged } };
}
