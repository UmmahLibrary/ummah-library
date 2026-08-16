/**
 * Extension implementation of the core {@link SyncBackend} port (#25, ADR 0033):
 * one HTTPS round trip to the deployed `/api/sync` (the apex `BASE_URL` the popup
 * already reads from). The `accountId` rides as a Bearer capability; only
 * ciphertext travels in the body. The endpoint is cross-origin from the
 * `chrome-extension://` popup, which is why the route answers a CORS preflight.
 * `fetch` is injected so tests need no network. The server is untrusted, so each
 * returned entry's shape and clock are re-validated before use.
 */
import type { SyncBackend, SyncEntry } from "@ummahlibrary/core";
import { BASE_URL } from "../config";

const isClockInt = (v: unknown): boolean =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;

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
  /** Endpoint to POST to; defaults to the deployed `${BASE_URL}/api/sync`. */
  endpoint?: string;
  /** Injected fetch — defaults to the global; tests pass a stub. */
  fetchImpl?: typeof fetch;
}

export function createHttpSyncBackend(options: HttpSyncBackendOptions = {}): SyncBackend {
  const endpoint = options.endpoint ?? `${BASE_URL}/api/sync`;
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
