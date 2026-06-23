/**
 * Server-side ciphertext store for sync (#25, ADR 0033). The server is a dumb
 * box: it persists `accountId → SyncEntry[]` and can read none of it (entries are
 * opaque — id, clock, ciphertext). Kept behind a small interface so the route is
 * testable with an in-memory fake and the concrete store (Upstash Redis over its
 * REST API — no SDK dependency) is swappable.
 */
import type { SyncEntry } from "@ummahlibrary/core";

export interface SyncStore {
  get(accountId: string): Promise<SyncEntry[]>;
  set(accountId: string, entries: SyncEntry[]): Promise<void>;
}

const keyFor = (accountId: string): string => `sync:${accountId}`;

/** Process-memory store — for tests and local development only (not durable). */
export class InMemorySyncStore implements SyncStore {
  private readonly data = new Map<string, SyncEntry[]>();
  async get(accountId: string): Promise<SyncEntry[]> {
    return this.data.get(keyFor(accountId)) ?? [];
  }
  async set(accountId: string, entries: SyncEntry[]): Promise<void> {
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
 * Upstash Redis via its REST API: a `GET`/`SET` of one JSON string per account.
 * Note (v2): `get`-merge-`set` is not atomic, so two devices pushing in the same
 * instant could race; for one user with a few devices this is rare, and a Redis
 * transaction/Lua script is the planned hardening.
 */
export class UpstashSyncStore implements SyncStore {
  constructor(private readonly cfg: UpstashConfig) {}

  private get fetchImpl(): typeof fetch {
    return this.cfg.fetchImpl ?? fetch;
  }

  async get(accountId: string): Promise<SyncEntry[]> {
    const res = await this.fetchImpl(
      `${this.cfg.url}/get/${encodeURIComponent(keyFor(accountId))}`,
      {
        headers: { authorization: `Bearer ${this.cfg.token}` },
      },
    );
    if (!res.ok) throw new Error(`upstash get failed (${res.status})`);
    const data = (await res.json()) as { result: string | null };
    return data.result ? (JSON.parse(data.result) as SyncEntry[]) : [];
  }

  async set(accountId: string, entries: SyncEntry[]): Promise<void> {
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
