import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter, rateLimiterFromEnv } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
  it("allows up to the limit, then blocks with a retry-after", async () => {
    const now = 1000;
    const rl = new InMemoryRateLimiter({ limit: 2, windowMs: 1000 }, () => now);
    expect((await rl.check("ip")).ok).toBe(true);
    expect((await rl.check("ip")).ok).toBe(true);
    const blocked = await rl.check("ip");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    let now = 1000;
    const rl = new InMemoryRateLimiter({ limit: 1, windowMs: 1000 }, () => now);
    expect((await rl.check("ip")).ok).toBe(true);
    expect((await rl.check("ip")).ok).toBe(false);
    now += 1001;
    expect((await rl.check("ip")).ok).toBe(true);
  });

  it("counts each client key independently", async () => {
    const rl = new InMemoryRateLimiter({ limit: 1, windowMs: 1000 });
    expect((await rl.check("a")).ok).toBe(true);
    expect((await rl.check("b")).ok).toBe(true); // a different IP isn't penalized
  });
});

describe("rateLimiterFromEnv", () => {
  it("falls back to an in-memory limiter when Upstash isn't configured", () => {
    expect(rateLimiterFromEnv({})).toBeInstanceOf(InMemoryRateLimiter);
  });
});
