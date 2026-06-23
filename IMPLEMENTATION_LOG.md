# Implementation log — Account sync (#25)

> Updated as the unattended run proceeds. Final summary will be written at the
> top when the run ends.

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

<!-- entries appended below, one line per step -->
