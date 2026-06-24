# ADR 0035 — Cross-device sync v3: incremental-pull cursor + bounded push

- **Status:** Accepted
- **Date:** 2026-06-24
- **Amends:** [ADR 0033](0033-account-sync.md), [ADR 0034](0034-sync-element-merge.md)

## Context

[ADR 0034](0034-sync-element-merge.md) flattened collection keys into one synced
entry per element, but deferred the **unbounded** key `ul.hifz` (the SRS card per
memorized ayah — up to 6,236) because the v1/v2 transport is O(total) in both
directions and the server caps a request at `MAX_ENTRIES`:

- **Pull:** every round the server returns the *entire* converged set, so a device
  re-downloads thousands of unchanged entries each sync.
- **Push:** every round the client uploads its *entire* local set; a set larger
  than `MAX_ENTRIES` is rejected outright (413, the whole batch).

This makes `ul.hifz` unshippable and every sync wasteful at scale. ADR 0034 named
the fix: an **incremental-pull cursor** + bounded push + atomic server merge.

## Decision

Add a **server version cursor** so a round transfers only what changed, and bound
the push. Backward-compatible: a client/store that doesn't opt in behaves exactly
as v2 (full set, no cursor).

**1. The server versions entries.** Each account has a monotonic `version`; every
entry the server writes is stamped with the version at which it last changed. The
store keeps `accountId → { version, entries: {entry, v}[] }`.

**2. Delta pull via a cursor.** The client sends its `cursor` (the highest server
version it has applied; `0`/absent = full sync). The server returns only entries
with `v > cursor`, plus the new top `version` as the next cursor — and a `more`
flag if it truncated the delta to a page. The client saves the cursor and, if
`more`, syncs again. A caught-up device pulls ~nothing.

**3. Bounded, dirty push.** The client pushes only entries that changed locally
since their last successful push (tracked by a `pushedHash` beside each key's clock
in the sidecar — dirty ⇔ `hash !== pushedHash`), in pages of ≤ a chunk size,
looping until drained. So the first push of a large set is paged under the cap, and
a steady-state round pushes ~nothing. Remote-applied entries are marked pushed
(the server already has them).

**4. Atomic server merge.** `get → merge → set` must not lose a concurrent push.
The in-memory store is sequential; the Upstash store does it under a Redis
transaction / Lua `EVAL` over the REST API. (The Upstash atomic+versioned path is
written but its production behaviour is verified only once Upstash is provisioned —
the in-memory store, which the dev endpoint uses, is fully covered by tests.)

**5. `ul.hifz` is enabled** once the above lands (recordShape, ayah→card). Tombstone
pruning (drop a tombstone once its version is below every device's cursor — i.e.
provably observed) and graceful overflow (filter oversized/excess entries rather
than rejecting the whole batch) ship here too.

## Status

- **Landed (verified against the in-memory store, which the dev endpoint uses):** the
  server versioning + delta query + paging (`handler.ts`, `sync-store.ts`); the
  engine's paged push + cursor-delta loop (`sync-engine.ts`); the `{entries, cursor,
  more}` wire on the web + mobile backends; and the **delta-pull cursor activated**
  on the web + mobile stores (`getCursor`/`setCursor`). Backward-compatible — a
  store without a cursor still whole-set syncs.
- **Landed since (provisioning readiness):** the **atomic merge** is now a
  per-account lock around the read→merge→write (`lock.ts`) — an in-process lock for
  dev/tests, a `SET NX PX` Upstash lock for production (written; live-verified on
  provisioning); **per-IP rate limiting** with `429 + Retry-After` (`rate-limit.ts`,
  in-process + Upstash, fails open); and a **provisioning runbook**
  (`docs/launch/sync-provisioning.md`). The in-process lock + limiter are unit-tested
  (incl. a two-push no-lost-update test).
- **Deferred (the remaining Phase-3 completion, gated on Upstash):** the
  **dirty/bounded push** (so a steady-state round uploads ~nothing and a large set
  pages under the cap), which is the prerequisite for **enabling `ul.hifz`**;
  **tombstone pruning**; and **graceful overflow**. These land once Upstash is
  provisioned and the above can be verified end to end.

## Consequences

- **Good:** sync is O(changed), not O(total), in both directions; `ul.hifz` and any
  future large key sync within the cap; steady-state rounds are tiny. The cursor is
  opt-in per store, so the change is backward-compatible and lands incrementally.
- **Cost:** the server is no longer a pure `accountId → blob` — it tracks a version
  and per-entry version stamps. Still opaque (no plaintext, no key names). The
  client sidecar gains a `pushedHash` per key and a single stored cursor.
- **Upstash gate:** the atomic, versioned Upstash store is the one piece that needs
  live Redis to verify; everything else is covered against the in-memory store.

## References

- [ADR 0034](0034-sync-element-merge.md) (element merge), [ADR 0033](0033-account-sync.md) (v1).
- `packages/core/src/sync-engine.ts` (paged cursor loop), `ports.ts` (`SyncBackend`,
  `SyncStateStore` cursor/dirty), `apps/web/src/app/api/sync/` (versioned store + handler).
