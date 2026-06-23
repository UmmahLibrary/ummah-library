/**
 * Web/extension implementation of the core {@link SyncBackend} port (#25, ADR
 * 0033): one HTTPS round trip to `/api/sync` that pushes the device's encrypted
 * entries and returns the converged set. The `accountId` rides as a Bearer
 * capability (never logged, HTTPS only); only ciphertext travels in the body, so
 * the transport — like the server — never sees plaintext or key names. `fetch` is
 * injected so tests need no network.
 */
import type { SyncBackend, SyncEntry } from "@ummahlibrary/core";

export interface HttpSyncBackendOptions {
  /** Endpoint to POST to; defaults to the same-origin `/api/sync`. */
  endpoint?: string;
  /** Injected fetch — defaults to the global; tests pass a stub. */
  fetchImpl?: typeof fetch;
}

export function createHttpSyncBackend(options: HttpSyncBackendOptions = {}): SyncBackend {
  const endpoint = options.endpoint ?? "/api/sync";
  const doFetch = options.fetchImpl ?? fetch;
  return {
    exchange: async (accountId, entries) => {
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${accountId}` },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error(`sync failed (${res.status})`);
      const data = (await res.json()) as { entries?: SyncEntry[] };
      return data.entries ?? [];
    },
  };
}
