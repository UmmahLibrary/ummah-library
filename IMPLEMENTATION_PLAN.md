# Implementation plan — Account sync (#25)

Derived from the design locked in chat on 2026-06-23 (the plan template arrived
with unfilled `[placeholders]`; this captures the agreed design as the plan).

**Decisions (made by the user):** build a thin custom **E2EE** sync adapter (not
Evolu); **zero-PII recovery-phrase** identity; **Upstash Redis / Vercel KV** for
the ciphertext datastore.

**Architecture fit:** the seam already exists — ADR 0024/0028 put every feature
behind a `*-store.ts` port so sync = "swap the storage primitive." The pure
engine lives in `core` (mirrors the `reminders.ts` injected-port + injected-clock
idiom); crypto/transport/server are adapters. Off by default; app stays
local-first and fully offline.

## Crypto model

One secret (a generated recovery code; BIP39 words = later polish) derives, via a
KDF, two independent values:

- `accountId = HKDF(secret, "account-id")` — opaque key the server stores under; names no one.
- `dataKey   = HKDF(secret, "data-key")`   — AES-256-GCM key; never leaves the device.

Each `ul.*` key syncs as `{ id = HMAC(dataKey, keyName), hlc, ciphertext, nonce }`
— the server can't read or even label the data.

## Conflict model

Per-key last-writer-wins via an **injected** Hybrid Logical Clock (HLC). Merge =
max-HLC per entry id. Element-level merge for collection keys = v2.

## Steps

- **S1 — ADR 0033.** `docs/adr/0033-account-sync.md` (amends 0003 static-first +
  0006 no-backend; records phrase identity + Upstash) + README index row.
- **S2 — core ports.** Add `Cipher`, `SyncBackend`, `SyncEntry`, `SyncSecret`,
  `KeyMaterial`, `SyncStateStore` to `packages/core/src/ports.ts`.
- **S3 — core sync primitives.** `packages/core/src/sync.ts`: HLC
  (`hlcInit/hlcTick/hlcReceive/hlcCompare/hlcMax`, string encode/parse),
  `SyncEntry`, `mergeEntries(local, remote)` pure LWW. Export + thorough tests.
- **S4 — core sync engine.** `packages/core/src/sync-engine.ts`: pure
  orchestrator `runSync(deps)` taking injected `Cipher`, `SyncBackend`,
  `SyncStateStore`, `now` — encrypt local → exchange → decrypt+merge → apply.
  Export + tests with in-memory fakes.
- **S5 — web crypto adapter.** `apps/web/src/lib/sync/web-crypto-cipher.ts`:
  implements `Cipher` with browser WebCrypto (PBKDF2/HKDF + AES-256-GCM + HMAC
  entry ids + CSPRNG secret). Tests (Node global crypto).
- **S6 — web transport adapter.** `apps/web/src/lib/sync/http-sync-backend.ts`:
  implements `SyncBackend` via `fetch`. Tests with a mocked fetch.
- **S7 — server endpoint.** `apps/web/src/app/api/sync/route.ts` + an injectable
  `SyncStore` (Upstash REST via fetch) + in-memory fake. Reuses core
  `mergeEntries` server-side. Handler logic unit-tested against the fake.

## Deferred (logged as review-when-back — regression-risky, or needs creds/visual/deploy)

- **D1** Wire the engine over the 32 existing `ul.*` stores + emit change events
  so the UI reflects merges. (Most able to regress non-sync users; needs visual
  verification.)
- **D2** Recovery-phrase Settings UI (generate code, enter on new device, status).
- **D3** Mobile + extension cipher adapters and wiring.
- **D4** Provision `UPSTASH_REDIS_REST_URL` / `_TOKEN`, add to
  `outputFileTracingIncludes` if needed, deploy.
- **D5** v2: element-level merge for collection keys; atomic server merge for
  concurrent pushes; incremental pull cursor; BIP39 wordlist.

## VERIFY

`pnpm lint && pnpm typecheck && pnpm test` per commit (font-egress-free).
`pnpm test:coverage` after core/web steps (CI gates per-dir thresholds:
core 95/88/95/95, adapters 95/82/90/95, web/lib 55/73/95/55). `pnpm build`
attempted at the end (a Google-Fonts-egress failure is environmental, not a
code regression).
