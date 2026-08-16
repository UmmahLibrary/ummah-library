/**
 * Rate limiting for `POST /api/sync` (#25, ADR 0033 — "rate-limit per accountId/IP
 * and cap entry size"). The endpoint accepts writes without a login (the bearer
 * accountId is a capability, not an account), so a fixed-window per-client cap
 * blunts a flood. Two implementations behind one port: in-process (dev / a single
 * instance, unit-tested) and Upstash (`INCR` + `PEXPIRE` over the REST API —
 * written for when Upstash is provisioned, verified then). A limiter that errors
 * fails OPEN (allows the request) so a limiter blip never takes sync down.
 */

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets, when blocked — for the `Retry-After` header. */
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/** Requests allowed per `windowMs` per key, before a 429. */
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

const DEFAULTS: RateLimitOptions = { limit: 120, windowMs: 60_000 };

/** Fixed-window counter in process memory — correct on one instance (dev, tests). */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private readonly opts: RateLimitOptions = DEFAULTS,
    private readonly now: () => number = Date.now,
  ) {}
  async check(key: string): Promise<RateLimitResult> {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || t >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: t + this.opts.windowMs });
      return { ok: true };
    }
    entry.count += 1;
    if (entry.count > this.opts.limit) {
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - t) / 1000)) };
    }
    return { ok: true };
  }
}

export interface UpstashRateLimiterConfig extends Partial<RateLimitOptions> {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
}

/** Fixed-window limiter via Upstash REST: `INCR` the window key, set its expiry on first hit. */
export class UpstashRateLimiter implements RateLimiter {
  private readonly opts: RateLimitOptions;
  constructor(private readonly cfg: UpstashRateLimiterConfig) {
    this.opts = { limit: cfg.limit ?? DEFAULTS.limit, windowMs: cfg.windowMs ?? DEFAULTS.windowMs };
  }
  private get fetchImpl(): typeof fetch {
    return this.cfg.fetchImpl ?? fetch;
  }
  private async cmd(args: (string | number)[]): Promise<unknown> {
    const res = await this.fetchImpl(this.cfg.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.cfg.token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`upstash command failed (${res.status})`);
    return ((await res.json()) as { result?: unknown }).result;
  }
  async check(key: string): Promise<RateLimitResult> {
    const rk = `sync:rl:${key}`;
    try {
      const count = Number(await this.cmd(["INCR", rk]));
      if (count === 1) await this.cmd(["PEXPIRE", rk, this.opts.windowMs]);
      if (count > this.opts.limit) {
        return { ok: false, retryAfterSeconds: Math.ceil(this.opts.windowMs / 1000) };
      }
      return { ok: true };
    } catch {
      return { ok: true }; // fail open — a limiter outage must not break sync
    }
  }
}

/** The configured limiter from env — Upstash when provisioned, else in-process. */
export function rateLimiterFromEnv(env: Record<string, string | undefined>): RateLimiter {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const limit = Number(env.SYNC_RATE_LIMIT);
  const opts: Partial<RateLimitOptions> = Number.isInteger(limit) && limit > 0 ? { limit } : {};
  return url && token ? new UpstashRateLimiter({ url, token, ...opts }) : new InMemoryRateLimiter();
}
