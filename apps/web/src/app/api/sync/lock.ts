/**
 * Per-account serialization for the sync exchange (#25, ADR 0035). The handler's
 * read → merge → write is not atomic on its own, so two devices of the same account
 * pushing in the same instant could race and lose a write. A per-account lock
 * around that critical section serializes them.
 *
 * Two implementations behind one port: an in-process one (dev / a single serverless
 * instance, and the unit-tested path) and an Upstash one (a `SET NX PX` lock over
 * the REST API — written for when Upstash is provisioned; its live behaviour is
 * verified then). The Upstash lock is **best-effort**: if it can't be acquired
 * within the wait budget (contention or a lock-service blip) it proceeds anyway,
 * degrading to the pre-lock behaviour (a rare lost-update for one user's
 * simultaneous multi-device push) rather than ever blocking sync.
 */

export interface Lock {
  /** Run `fn` while holding the lock for `key`; releases on settle. */
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

/** In-process per-key serialization — correct on one instance (dev, tests). */
export class InMemoryLock implements Lock {
  private readonly tail = new Map<string, Promise<unknown>>();
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.tail.get(key) ?? Promise.resolve();
    const result = prev.then(fn, fn); // run after the prior holder settles (ok or error)
    const settled = result.then(
      () => {},
      () => {},
    );
    this.tail.set(key, settled);
    void settled.then(() => {
      if (this.tail.get(key) === settled) this.tail.delete(key); // GC when idle
    });
    return result;
  }
}

export interface UpstashLockConfig {
  url: string;
  token: string;
  /** How long the lock is held before auto-expiring (guards against a crashed holder). */
  ttlMs?: number;
  /** How long to wait to acquire before proceeding best-effort. */
  maxWaitMs?: number;
  fetchImpl?: typeof fetch;
}

/** Frees the lock only if we still hold it (token match), so we never delete another holder's lock. */
const RELEASE_SCRIPT =
  "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end";

/** A `SET key token NX PX ttl` distributed lock over the Upstash REST API (no SDK). */
export class UpstashLock implements Lock {
  private readonly ttlMs: number;
  private readonly maxWaitMs: number;
  constructor(private readonly cfg: UpstashLockConfig) {
    this.ttlMs = cfg.ttlMs ?? 5000;
    this.maxWaitMs = cfg.maxWaitMs ?? 3000;
  }

  private get fetchImpl(): typeof fetch {
    return this.cfg.fetchImpl ?? fetch;
  }

  /** Run one Redis command via the Upstash REST command endpoint; returns its `result`. */
  private async cmd(args: (string | number)[]): Promise<unknown> {
    const res = await this.fetchImpl(this.cfg.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.cfg.token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`upstash command failed (${res.status})`);
    return ((await res.json()) as { result?: unknown }).result;
  }

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `sync:lock:${key}`;
    const token = crypto.randomUUID();
    const deadline = Date.now() + this.maxWaitMs;
    let held = false;
    for (let delay = 25; ; delay = Math.min(delay * 2, 250)) {
      try {
        held = (await this.cmd(["SET", lockKey, token, "NX", "PX", this.ttlMs])) === "OK";
      } catch {
        break; // lock service unavailable — proceed best-effort
      }
      if (held || Date.now() >= deadline) break;
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      return await fn();
    } finally {
      if (held) {
        // Best-effort token-checked release; a failure just lets the TTL expire it.
        await this.cmd(["EVAL", RELEASE_SCRIPT, 1, lockKey, token]).catch(() => {});
      }
    }
  }
}

/** The configured lock from env — Upstash when provisioned, else an in-process lock. */
export function lockFromEnv(env: Record<string, string | undefined>): Lock {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new UpstashLock({ url, token }) : new InMemoryLock();
}
