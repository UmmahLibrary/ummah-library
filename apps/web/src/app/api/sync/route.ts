/**
 * `POST /api/sync` (#25, ADR 0033) — the one runtime endpoint sync adds. A thin
 * shell over {@link handleSync}: pick the configured store, parse the body, run
 * the exchange. Responses are never cached. Returns 501 when the server has no
 * sync store provisioned (the local-first app is unaffected). This route reads no
 * datasets, so it needs no `outputFileTracingIncludes` entry.
 */
import { handleSync } from "./handler";
import { syncStoreFromEnv } from "./sync-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request): Promise<Response> {
  const store = syncStoreFromEnv(process.env);
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
