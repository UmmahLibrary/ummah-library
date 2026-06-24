/**
 * Server-side ciphertext store for sync (#25, ADR 0033/0035). The server is a dumb
 * box: it persists `accountId → entries` and can read none of it (entries are
 * opaque — id, clock, ciphertext). Each stored entry also carries a server
 * **version** `v` (ADR 0035) — the account's monotonic counter at the moment it
 * last changed — so the handler can return only the delta past a client's cursor.
 * Kept behind a small interface so the route is testable with an in-memory fake
 * and the concrete store (Upstash Redis over REST — no SDK) is swappable.
 */
import type { SyncEntry } from "@ummahlibrary/core";

/** A stored entry plus the server version at which it last changed. */
export type ServerEntry = SyncEntry & { v: number };

export interface SyncStore {
  get(accountId: string): Promise<ServerEntry[]>;
  set(accountId: string, entries: ServerEntry[]): Promise<void>;
}

const keyFor = (accountId: string): string => `sync:${accountId}`;

/** Process-memory store — for tests and local development only (not durable). */
export class InMemorySyncStore implements SyncStore {
  private readonly data = new Map<string, ServerEntry[]>();
  async get(accountId: string): Promise<ServerEntry[]> {
    return this.data.get(keyFor(accountId)) ?? [];
  }
  async set(accountId: string, entries: ServerEntry[]): Promise<void> {
    this.data.set(keyFor(accountId), entries);
  }
}

export interface UpstashConfig {
  url: string;
  token: string;
  /** Injected fetch — defaults to the global; tests pass a stub. */
  fetchImpl?: typeof fetch;
}

/**
 * Upstash Redis via its REST API: a `GET`/`SET` of one JSON string (the versioned
 * entries) per account.
 *
 * Note (ADR 0035): `get`-merge-`set` is not atomic, so two devices pushing in the
 * same instant could race; for one user with a few devices this is rare. The
 * planned hardening is a Redis transaction / Lua `EVAL` that does the merge +
 * version bump server-side; that path is verified only once Upstash is provisioned
 * (the in-memory store, used by the dev endpoint, is fully covered by tests).
 */
export class UpstashSyncStore implements SyncStore {
  constructor(private readonly cfg: UpstashConfig) {}

  private get fetchImpl(): typeof fetch {
    return this.cfg.fetchImpl ?? fetch;
  }

  async get(accountId: string): Promise<ServerEntry[]> {
    const res = await this.fetchImpl(
      `${this.cfg.url}/get/${encodeURIComponent(keyFor(accountId))}`,
      {
        headers: { authorization: `Bearer ${this.cfg.token}` },
      },
    );
    if (!res.ok) throw new Error(`upstash get failed (${res.status})`);
    const data = (await res.json()) as { result: string | null };
    return data.result ? (JSON.parse(data.result) as ServerEntry[]) : [];
  }

  async set(accountId: string, entries: ServerEntry[]): Promise<void> {
    const res = await this.fetchImpl(
      `${this.cfg.url}/set/${encodeURIComponent(keyFor(accountId))}`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${this.cfg.token}` },
        body: JSON.stringify(entries),
      },
    );
    if (!res.ok) throw new Error(`upstash set failed (${res.status})`);
  }
}

/** The configured store from env, or `null` when sync isn't provisioned. */
export function syncStoreFromEnv(env: Record<string, string | undefined>): SyncStore | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new UpstashSyncStore({ url, token });
}
