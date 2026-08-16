/**
 * `POST /api/sync` (#25, ADR 0033/0035) — the one runtime endpoint sync adds. A thin
 * shell over {@link handleSync}: rate-limit, pick the store + lock, parse the body,
 * run the exchange. Responses are never cached. In production it returns 501 until a
 * sync store is provisioned (the local-first app is unaffected); in development it
 * falls back to a process-memory store so two local profiles can sync against
 * `pnpm dev` with no credentials. This route reads no datasets, so it needs no
 * `outputFileTracingIncludes` entry.
 *
 * CORS is open (like the public REST API): the browser extension calls this from a
 * `chrome-extension://` origin, and its `Authorization` header makes the POST a
 * non-simple request, so a preflight (`OPTIONS`) must be answered. `*` is safe here
 * because the request carries no credentials (the `accountId` is a bearer token in
 * the header, not a cookie), and the server only ever holds opaque ciphertext.
 */
import { handleSync } from "./handler";
import { type Lock, lockFromEnv } from "./lock";
import { type RateLimiter, rateLimiterFromEnv } from "./rate-limit";
import { InMemorySyncStore, type SyncStore, syncStoreFromEnv } from "./sync-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "86400",
};

/** Answer the CORS preflight the extension's authenticated POST triggers. */
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Reused across requests in one dev-server process so two profiles converge; never
// constructed in production, where an unprovisioned endpoint stays 501.
let devStore: SyncStore | null = null;
// The lock + limiter are likewise reused so their in-process state persists per instance.
let lock: Lock | null = null;
let limiter: RateLimiter | null = null;

function resolveStore(): SyncStore | null {
  const configured = syncStoreFromEnv(process.env);
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  devStore ??= new InMemorySyncStore();
  return devStore;
}

function json(body: unknown, status: number, headers?: Record<string, string>): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "access-control-allow-origin": "*", ...headers },
  });
}

/** The client IP for rate-limiting, from the proxy headers Vercel sets (spoof-safe at the edge). */
function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

export async function POST(req: Request): Promise<Response> {
  limiter ??= rateLimiterFromEnv(process.env);
  const rl = await limiter.check(clientKey(req));
  if (!rl.ok) {
    return json({ error: "rate limited" }, 429, {
      "retry-after": String(rl.retryAfterSeconds ?? 60),
    });
  }

  const store = resolveStore();
  if (!store) return json({ error: "sync is not configured on this server" }, 501);
  lock ??= lockFromEnv(process.env);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const result = await handleSync(
    { authorization: req.headers.get("authorization"), body },
    store,
    lock,
  );
  return json(result.body, result.status);
}
