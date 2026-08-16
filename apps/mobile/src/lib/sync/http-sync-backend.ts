/**
 * Mobile implementation of the core {@link SyncBackend} port (#25, ADR 0033): one
 * HTTPS round trip to the deployed `/api/sync` that pushes this device's encrypted
 * entries and returns the converged set. Mirrors the web adapter, but resolves an
 * absolute endpoint (mobile has no same origin) from the same `EXPO_PUBLIC_*`
 * config the REST client uses. The `accountId` rides as a Bearer capability
 * (HTTPS only); only ciphertext travels in the body. `fetch` is injected so tests
 * need no network.
 */
import type { SyncBackend, SyncEntry } from "@ummahlibrary/core";

/** The deployed sync endpoint — the API base's origin + `/api/sync`. */
function defaultEndpoint(): string {
  const explicit = process.env.EXPO_PUBLIC_SYNC_URL;
  if (explicit) return explicit;
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://ummahlibrary.org/api/v1";
  // Take just the scheme+host; the `/api/v1` REST prefix is not where sync lives.
  const origin = apiBase.match(/^https?:\/\/[^/]+/)?.[0] ?? "https://ummahlibrary.org";
  return `${origin}/api/sync`;
}

/** A clock field must be a non-negative safe integer (mirrors the server guard). */
const isClockInt = (v: unknown): boolean =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;

/**
 * The server is untrusted (ADR 0033 — a "dumb ciphertext box"); a malicious or
 * compromised one could reply with a malformed/out-of-range clock that, applied
 * locally, poisons the HLC ordering. E2EE blocks foreign *content* (decrypt
 * fails), but not a bad envelope — so validate each returned entry's shape and
 * clock here, dropping anything malformed, symmetric with the server's guard.
 */
function isValidEntry(e: unknown): e is SyncEntry {
  if (typeof e !== "object" || e === null) return false;
  const x = e as Record<string, unknown>;
  if (typeof x.id !== "string" || x.id.length === 0) return false;
  if (typeof x.nonce !== "string") return false;
  if (x.ciphertext !== null && typeof x.ciphertext !== "string") return false;
  const h = x.hlc as Record<string, unknown> | null;
  if (typeof h !== "object" || h === null) return false;
  return (
    isClockInt(h.millis) &&
    isClockInt(h.counter) &&
    typeof h.node === "string" &&
    h.node.length >= 1
  );
}

export interface HttpSyncBackendOptions {
  /** Endpoint to POST to; defaults to the deployed `/api/sync`. */
  endpoint?: string;
  /** Injected fetch — defaults to the global; tests pass a stub. */
  fetchImpl?: typeof fetch;
}

export function createHttpSyncBackend(options: HttpSyncBackendOptions = {}): SyncBackend {
  const endpoint = options.endpoint ?? defaultEndpoint();
  const doFetch = options.fetchImpl ?? fetch;
  return {
    exchange: async (accountId, entries, cursor) => {
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${accountId}` },
        body: JSON.stringify({ entries, cursor }),
      });
      if (!res.ok) throw new Error(`sync failed (${res.status})`);
      const data = (await res.json()) as { entries?: unknown; cursor?: unknown; more?: unknown };
      return {
        entries: Array.isArray(data.entries) ? data.entries.filter(isValidEntry) : [],
        cursor: typeof data.cursor === "number" ? data.cursor : undefined,
        more: data.more === true,
      };
    },
  };
}
