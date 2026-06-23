/**
 * `POST /api/sync` (#25, ADR 0033) — the one runtime endpoint sync adds. A thin
 * shell over {@link handleSync}: pick the store, parse the body, run the exchange.
 * Responses are never cached. In production it returns 501 until a sync store is
 * provisioned (the local-first app is unaffected); in development it falls back to
 * a process-memory store so two local profiles can sync against `pnpm dev` with no
 * credentials. This route reads no datasets, so it needs no
 * `outputFileTracingIncludes` entry.
 */
import { handleSync } from "./handler";
import { InMemorySyncStore, type SyncStore, syncStoreFromEnv } from "./sync-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reused across requests in one dev-server process so two profiles converge; never
// constructed in production, where an unprovisioned endpoint stays 501.
let devStore: SyncStore | null = null;

function resolveStore(): SyncStore | null {
  const configured = syncStoreFromEnv(process.env);
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  devStore ??= new InMemorySyncStore();
  return devStore;
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request): Promise<Response> {
  const store = resolveStore();
  if (!store) return json({ error: "sync is not configured on this server" }, 501);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const result = await handleSync({ authorization: req.headers.get("authorization"), body }, store);
  return json(result.body, result.status);
}
