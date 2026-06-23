# Implementation log — Account sync (#25)

## ✅ FINAL SUMMARY (unattended run complete — 2026-06-23)

Landed the **foundation of cross-device sync (#25)** — the ADR plus the entire
pure engine, the web crypto + transport adapters, and the server endpoint — all
behind the existing store ports per ADR 0033. **Off by default; nothing changes
for users who never enable sync.** The full loop passes:
**`pnpm lint` ✓ · `pnpm typecheck` ✓ (8/8) · `pnpm test:coverage` ✓ (639 tests,
exit 0) · `pnpm build` ✓ (`/api/sync` registered as a dynamic function).**

### Completed (branch `feat/account-sync`, 6 commits off `main`)

| Commit    | Step    | What                                                              |
| --------- | ------- | ---------------------------------------------------------------- |
| `05fe28f` | setup   | scaffold: plan + log, green baseline                             |
| `4f9efbc` | S1      | ADR 0033 (E2EE, zero-PII, Upstash; amends 0003 + 0006) + index   |
| `7e2769e` | S2–S4   | core: HLC + `mergeEntries` + `runSync` + ports (100% cov, 20 tests) |
| `1a87fc5` | S5      | web `WebCryptoCipher` (PBKDF2→HKDF, AES-256-GCM, HMAC ids; 7 tests) |
| `3e71bb8` | S6      | web `HttpSyncBackend` (Bearer accountId, ciphertext body; 4 tests) |
| `c96549e` | S7      | `/api/sync` endpoint: `SyncStore`/Upstash REST + `handleSync` (14 tests) |

19 files, +1406/−34. 45 new tests; the core engine is at 100% coverage.

### NOT done — needs your input / review (concrete next actions)

1. **Provision Upstash + deploy (needs credentials I don't have).** Create an
   Upstash Redis DB; set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
   in Vercel. Until then `/api/sync` returns **501** by design (app unaffected).
   The endpoint reads no datasets, so no `outputFileTracingIncludes` change.
2. **D1 — wire the engine over the live `ul.*` stores (regression-risky; deferred
   deliberately).** Build a `SyncStateStore` web adapter that enumerates the full
   `ul.*` namespace (see `apps/mobile/src/storage.ts` `KEYS`) with per-key HLC
   meta (a `ul.sync.meta` sidecar, using `hlcTick`/`encodeHlc`), and have store
   writes emit a change event so the UI re-reads after a merge. This is the step
   that touches existing non-sync behaviour, so it wants manual verification — I
   did not attempt it unattended.
3. **D2 — recovery-phrase Settings UI** (generate via `generateRecoveryPhrase`,
   enter-on-new-device, sync status/toggle). Needs visual verification.
4. **D3 — mobile + extension**: a native `Cipher` (Expo crypto) and the same
   `SyncStateStore`/UI; extension scoped to its keys + CORS on `/api/sync`.
5. **D5 — v2 hardening**: element-level merge for collection keys; atomic server
   merge (Redis tx/Lua) for concurrent pushes; incremental pull cursor; BIP39
   wordlist for the recovery phrase.

### Notes for review

- **Identity is zero-PII by design**, so a lost recovery phrase is unrecoverable
  — the file backup (ADR 0018) is the safety net; D2's UI must say so plainly.
- `accountId` is a Bearer capability (can read/overwrite a blob, cannot decrypt);
  rate-limiting `/api/sync` per accountId/IP is recommended before launch.
- **Do not open a PR / merge** — left for you. Branch builds green.

---

> Per-step running log follows.

## Run parameters (inferred — the template arrived with unfilled placeholders)

- **PLAN:** `./IMPLEMENTATION_PLAN.md` — the #25 sync design locked in chat
  2026-06-23 (the only reasonable interpretation: this run was fired in answer to
  "want me to draft ADR 0033 and the core engine?").
- **VERIFY:** `pnpm lint && pnpm typecheck && pnpm test` each commit; plus
  `pnpm test:coverage` after core/web steps (CI gates coverage). `pnpm build`
  attempted at end — a Google-Fonts-egress failure is environmental, not a
  regression (see local-verification notes).
- **BRANCH:** `feat/account-sync` (from `665a986`, the `main` HEAD at start).

## Scope decision

Unattended work is scoped to what is **verifiable without secrets or a deploy**:
the ADR, the pure `core` engine, the web crypto + transport adapters, and the
server handler logic (unit-tested against a fake store). The store-rewiring (D1),
recovery-phrase UI (D2), mobile/extension (D3), Upstash provisioning + deploy
(D4), and v2 refinements (D5) are implemented-where-safe and otherwise **logged
as next actions** — D1/D2 because they can regress non-sync users or need visual
verification; D4 because it needs credentials I wasn't given.

## Environmental note — `pnpm test` (turbo) is broken locally

`pnpm test` (= `turbo run test` → per-package `vitest run`) fails at **startup**
in this environment: with no per-package vitest config, vitest walks up to the
root `vitest.workspace.ts` and resolves its project globs relative to the package
CWD (`packages/core/packages/core` → "non-existing directory"). This is a
config-resolution quirk, **pre-exists on `main`** (same tree), and is unrelated
to any code here. The **root-level** run resolves correctly.

**VERIFY adaptation (faithful):** test step uses `pnpm exec vitest run` (full,
correct CWD) or `--project <name>` (scoped); the CI coverage gate uses
`pnpm test:coverage`. `pnpm lint` and `pnpm typecheck` (turbo) are unaffected.

Baseline before any code: lint ✓, typecheck ✓ (8/8), `pnpm exec vitest run` ✓
**594 tests / 101 files**.

## Progress

- SETUP — branch `feat/account-sync` created from `665a986`; plan + log written;
  green baseline established. PASS.

- S1 — ADR 0033 (`docs/adr/0033-account-sync.md`) + README index row; amends
  0003 + 0006; records the E2EE/zero-PII/Upstash model. Docs only (lint/typecheck/
  test unaffected); prettier ✓. PASS.

- S2 — core ports: `Cipher`, `SyncBackend`, `SyncStateStore` added to
  `ports.ts` (+ `Hlc`/`SyncEntry`/`SyncRecord` import). Type-only, coverage-excluded.
- S3 — core sync primitives: `sync.ts` (HLC `hlcInit`/`hlcTick`/`hlcCompare`,
  `encodeHlc`/`parseHlc`, `SyncEntry`, `mergeEntries` LWW) + `sync.test.ts`
  (15 tests). 100% coverage.
- S4 — core sync engine: `sync-engine.ts` (`runSync` orchestrator, mirrors
  `reminders.ts`; no minted clocks; skips unknown-key + undecryptable entries) +
  `sync-engine.test.ts` (5 tests, fakes incl. a `mergeEntries`-based fake server).
  100% coverage. Exported from `index.ts`.
  VERIFY: lint ✓, typecheck 8/8 ✓, `pnpm test:coverage` ✓ (exit 0, **614 tests**,
  core aggregate 99.63/96.22/100/99.63 ≥ 95/88/95/95). PASS.

- S5 — web crypto adapter: `apps/web/src/lib/sync/web-crypto-cipher.ts`
  implements the core `Cipher` (PBKDF2→HKDF key derivation, AES-256-GCM seal,
  HMAC entry ids, `generateRecoveryPhrase`) + 7 tests (run under jsdom — Node
  WebCrypto is present; verified cross-device decrypt + wrong-key→null). Fixed a
  TS 5.7 `Uint8Array<ArrayBufferLike>` vs `<ArrayBuffer>` typing on the AES-GCM
  iv. VERIFY: web typecheck ✓, cipher test ✓ (7), lint ✓. PASS.

- S6 — web transport adapter: `apps/web/src/lib/sync/http-sync-backend.ts`
  implements the core `SyncBackend` (one POST to `/api/sync`, `accountId` as a
  Bearer header, ciphertext-only body) + 4 tests (injected fetch). VERIFY: web
  typecheck ✓, `pnpm test:coverage` ✓ (exit 0, **625 tests**, web/lib functions
  96.65 ≥ 95). PASS.

- S7 — server endpoint: `apps/web/src/app/api/sync/` — `sync-store.ts`
  (`SyncStore` + `InMemorySyncStore` + fetch-based `UpstashSyncStore`, no SDK +
  `syncStoreFromEnv`), `handler.ts` (`handleSync`: Bearer auth, entry
  validation/size caps, converge via core `mergeEntries`, persist), thin
  `route.ts` (`POST`, `no-store`, 501 when unprovisioned). 14 tests (handler +
  store via stubbed fetch). VERIFY: web typecheck ✓, lint ✓, `pnpm test:coverage`
  ✓ (exit 0, **639 tests**). PASS.

<!-- entries appended below, one line per step -->
