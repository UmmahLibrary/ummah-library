# Provisioning cross-device sync (`/api/sync`)

The sync server (#25, ADR 0033/0035) is **off until you provision a datastore**.
With no store configured, `POST /api/sync` returns **501** and the apps stay fully
local-first — nothing breaks. This runbook flips it on. It's the one hands-on step;
all the code (versioned store, incremental cursor, per-account lock, rate limiter)
is already shipped behind these two env vars.

## What you need

A serverless Redis with an **HTTP/REST** API. The app talks to it over REST with
**no SDK dependency** (ADR 0033), so any of these works:

- **Vercel Marketplace → Upstash Redis** (simplest — auto-injects the env vars), or
- **Upstash console** directly (create a Redis database, copy its REST creds).

## Steps

1. **Create the Redis database.**
   - Vercel: Project → *Storage* → *Marketplace* → **Upstash Redis** → create. It
     adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the project.
   - Or Upstash console: create a database → *REST API* → copy the URL + token.

2. **Set the env vars** (Production, and Preview if you want it there) — skip if the
   Marketplace integration already added them:

   ```
   UPSTASH_REDIS_REST_URL   = https://<your-db>.upstash.io
   UPSTASH_REDIS_REST_TOKEN = <token>
   SYNC_RATE_LIMIT          = 120   # optional; requests per IP per minute (default 120)
   ```

   `syncStoreFromEnv` (`apps/web/src/app/api/sync/sync-store.ts`) turns sync on as
   soon as both `UPSTASH_*` vars are present; the same two vars also switch the lock
   and rate limiter from their in-process dev versions to the Upstash-backed ones.

3. **Redeploy** so the functions pick up the env. (The route is `runtime = "nodejs"`,
   `dynamic = "force-dynamic"` — no datasets, no build inclusion needed.)

4. **Verify.**
   - `curl -i https://app.ummahlibrary.org/api/sync -X POST -H 'content-type: application/json' -d '{"entries":[]}'`
     → was `501`; should now be `401` ("missing account id" — i.e. the store is live
     and it's asking for a Bearer accountId).
   - End-to-end: enable sync in **Settings → Sync** on one device, copy the recovery
     phrase, enter it on a second device, confirm bookmarks/last-read/etc. converge.
   - Watch the Upstash dashboard for keys: `sync:<accountId>` (the per-account
     ciphertext blob), `sync:rl:*` (rate-limit windows), `sync:lock:*` (transient
     write locks).

## What's guarding it

- **Rate limiting** — fixed window per client IP (`SYNC_RATE_LIMIT`/min, default
  120), `429 + Retry-After` over the cap. Fails **open** if Redis is unreachable, so
  a limiter blip never takes sync down. (`rate-limit.ts`)
- **Atomic merge** — a per-account `SET NX PX` lock serializes the read→merge→write
  so two devices pushing at once can't lose an update; best-effort (proceeds if the
  lock can't be acquired within the wait budget). (`lock.ts`)
- **Abuse caps** — `MAX_ENTRIES` per request, `MAX_CIPHERTEXT`/nonce/node size caps,
  strict clock validation, and re-validation of the stored set on read. (`handler.ts`)
- **Zero-knowledge** — the server only ever holds opaque ciphertext under an
  unguessable HMAC `accountId`; it can read neither the data nor which features a
  user has (ADR 0033). Keep the endpoint HTTPS-only.

## Operating notes

- **Cost/limits:** one small Redis. Each account is a few KB (scalars + element
  entries); `ul.hifz` (Phase 3) is the only large key and is gated until enabled.
- **Tombstones** accumulate until the Phase-3 pruning lands; the per-request
  `MAX_ENTRIES` cap is the backstop. Watch blob sizes if usage is heavy.
- **Turning it off:** remove the `UPSTASH_*` vars and redeploy — back to `501`,
  local-first, no data loss on devices (their local copies are untouched).
- **Rotating creds:** rotate the Upstash token, update the env var, redeploy. The
  data is keyed by `accountId`, independent of the token.
