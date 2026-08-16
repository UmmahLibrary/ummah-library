# ADR 0034 — Cross-device sync v2: element-level merge

- **Status:** Accepted
- **Date:** 2026-06-24
- **Amends:** [ADR 0033](0033-account-sync.md)

## Context

[ADR 0033](0033-account-sync.md) shipped opt-in, end-to-end-encrypted, zero-PII
sync with **whole-value last-writer-wins (LWW)** per `ul.*` key. That is correct
only for **scalar** keys — a single setting, the last-read position, a theme — where
"the most recent write on any device wins" is what the user wants.

It is wrong for **collection** keys. `ul.hifz`, `ul.ayahNotes`, the prayer/qaḍāʾ/
ḥayḍ logs, bookmark collections, the reading logs — these are maps and sets of many
independent entries. Whole-value LWW would let a device that edited *one* entry
overwrite *every* entry another device changed. So 0033 deliberately **excluded**
those keys ("element-level merge … is a later refinement") and v1 syncs only scalars.

This ADR settles how those collection keys sync without clobbering: **v2
element-level merge**. It does not change v1's scalar path.

## What the excluded keys actually are

A survey of every excluded key found one dominant shape — **a map keyed by a stable
id** — plus a few sets and a few counters:

| Shape | Keys | Element identity |
| --- | --- | --- |
| Map `Record<id, V>` | `ul.hifz` (ayah→SM-2 card), `ul.ayahNotes` (ayah→text), `ul.prayerLog` (date→statuses), `ul.readingLog` (date→pages), `ul.qada` (prayer→count), `ul.ramadanFasts`/`ul.ramadanWorship`, `ul.asmaLearned` | the record key |
| Array keyed by a field | `ul.collections` (`{id,name,ayahs}[]`, by `id`), `ul.haid` (`{start,end?}[]`, by `start`) | the keyed field |
| Set (`string[]` / `Record<id,true>`) | `ul.badges`, `ul.readingActive`, `ul.bookmarks` | the member |
| Counter / structured scalar | `ul.tasbih`, `ul.hifz.streak`, `ul.adhkar`, `ul.readingGoal`, `ul.readingPlan`, `ul.readingPages` | — none — |

## Decision

**Sync each element of a collection key as its own entry, reusing the existing pure
HLC/LWW engine unchanged. Merge then happens per element automatically.**

### 1. Element-flattening with synthetic keys

A managed key declares a **sync shape** (pure `core` knowledge): `scalar` (v1) or
`map`. For a map key the state store **explodes** the value into one logical record
per element, under a **synthetic key** `mapKey + NUL + elementId`. The cipher's
`entryId(syntheticKey) = HMAC(dataKey, syntheticKey)` keys it on the wire, so the
**same element on two devices gets the same opaque id and merges**, while the server
still sees only `{ id, hlc, ciphertext, nonce }`. A deleted element is a tombstone
(null at a non-zero clock), exactly as in v1. Recompose on apply.

`mergeEntries`, `hlcCompare`, the wire format, and the server are **unchanged** — the
merge is per-element purely because each element is its own id. The new logic is a
shared shape registry in `core` plus the explode/recompose in each platform's state
store; the per-key clock sidecar already keys on arbitrary strings, so synthetic
element keys flow through it with no structural change.

### 2. Self-describing element payloads + a one-round discovery hook

The one place flattening breaks: an element **born on another device** has an opaque
`entryId` this device never generated, so it isn't in the local `id → key` map and
can't be resolved. Two ways were considered: a separate per-map "directory" record
(needs its own union-merge — circular) and self-describing payloads. We chose the
latter.

Each **map element's plaintext is `{ mk: mapKey, k: elementId, v: value }`** — the
element carries its own identity *inside the ciphertext* (the server still can't read
it). The engine gains one small, **optional, additive** hook: on an `id → key` miss
it decrypts the entry and asks `state.identify(plaintext)` for the synthetic key,
which the store returns iff `mk` is a managed map. Discovery is **one round** and
deterministic. Scalar entries keep their bare-value payload, so v1 and v2 clients
interoperate. (The entry id remains the HMAC of the synthetic key — deterministic
across devices — so identity drives *merge*; the payload only drives *first-contact
resolution*.)

### 3. Counters stay scalar — no CRDT counters

`ul.tasbih`, `ul.hifz.streak`, and `ul.adhkar`'s tallies are counters; LWW loses
concurrent increments. A convergent counter (PN-counter with per-node sub-counts)
needs a *second* merge algorithm and per-node state, which would break the
"engine-unchanged" property that makes this design cheap. The conflict is rare
(single user, rarely concurrent) and the loss is cosmetic (a streak off by one).
So counters are **not** element-merged: they stay excluded, or become plain
scalar-LWW. The same goes for the structured scalars (`readingGoal`/`Plan`/`Pages`)
— a single coherent value, correctly handled by whole-value LWW.

### 4. Collections merge at the collection level first

A `Collection` is one element (id = its UUID, value = the whole collection incl. its
`ayahs`). Concurrent edits to **different** collections merge cleanly; concurrent
edits to the **same** collection still LWW-clobber (one device's ayah list wins) —
an accepted residual, mirroring v1's accepted bookmark-add loss. True nested
(collection × ayah) merge is a later refinement.

### 5. Phasing (element-flattening multiplies entry count)

Flattening turns ~16 entries into one per element across all map keys, against the
server's `MAX_ENTRIES` cap and an "every round resends all elements" cost. So roll
out by cardinality:

- **Phase 1 (this change): bounded keys** — `ul.ayahNotes`, `ul.collections`,
  `ul.qada`, `ul.haid`, `ul.badges`, `ul.readingActive`, `ul.asmaLearned`,
  `ul.ramadanFasts`. Combined worst case is a few hundred entries for years of use.
  Raise `MAX_ENTRIES` (500 → 2000) as headroom; per-entry size + rate-limiting stay
  the real abuse guards.
- **Phase 2: slow-growing date logs** — `ul.prayerLog`, `ul.readingLog`,
  `ul.ramadanWorship` (≈1 element/day; fine under the raised cap for years).
- **Phase 3: `ul.hifz`** — the only key that can be thousands of elements at once.
  Gated on the **incremental-pull cursor** (deferred in 0033) so a round is
  O(changed), not O(total), plus an **atomic server merge** under concurrent push.

Existing v1 scalar keys (notably `ul.bookmarks`) are **not** re-represented in this
change: every Phase-1 key is a *previously-excluded* key, so each is a pure addition
of brand-new ids — a v1 client simply never sees them (the engine skips ids it
doesn't manage), so mixed-version devices can't corrupt each other.

## Consequences

- **Good:** the high-value collection data (notes, collections, qaḍāʾ, ḥayḍ, …) now
  syncs without clobbering, with **no change to the engine's merge, the wire, or the
  server** — the same property that made 0033 cheap. Backward-compatible: a v1 client
  ignores element ids it doesn't manage.
- **Cost — metadata footprint grows.** The server now holds hundreds (Phase 1) and
  eventually thousands (hifz) of opaque entries per account instead of ~16. It still
  cannot read key names, element ids, or plaintext (ids are HMACs; identity rides
  *inside* the ciphertext). But the **entry count and per-entry sizes/timestamps** —
  already accepted as residual metadata in 0033 — now also weakly fingerprint usage
  intensity (e.g. a large hifz set implies a heavy memorizer). This is a conscious
  acceptance, consistent with 0033 (never content or identity); ciphertext-size
  bucketing/padding is a possible future mitigation, out of scope here.
- **Sidecar grows.** `ul.sync.meta` gains a clock+hash per element (~100 bytes each)
  — single-digit KB for Phase-1 bounded keys; tens–hundreds of KB once hifz lands
  (tombstone pruning becomes worthwhile then, alongside the cursor).
- **Determinism.** Array shapes (`collections`, `haid`, sets) must `rebuild` with a
  deterministic order (sorted) so the recomposed value is stable.
- **Known Phase-1 limitations (resolved by the Phase-3 cursor).** These follow from
  flattening + the v1 server's all-or-nothing batch and are accepted for now:
  - **Tombstones are never pruned.** A deleted element keeps its meta entry and is
    re-pushed every round, so the client entry count is `live + ever-deleted`,
    growing monotonically. The `MAX_ENTRIES` cap (now 2000) gives years of headroom
    for the bounded Phase-1 keys, but pruning provably-converged tombstones is a
    Phase-3 task (it pairs naturally with the cursor).
  - **The cap is a hard cliff.** Exceeding `MAX_ENTRIES` makes the server reject the
    *whole* round (413), and a single element over `MAX_CIPHERTEXT` rejects the whole
    push (400) — so one fat/excess element can stall sync of everything else
    (including scalar settings). This all-or-nothing behavior is inherited from v1;
    flattening makes it more reachable. The fix (graceful per-key/partial-push +
    prioritising scalar keys, or filtering rather than rejecting) ships with the cursor.
- **Future hardening — LWW-on-apply guard.** The runtimes now coalesce concurrent
  rounds (web matched to mobile), which removes the only first-party way two rounds
  interleave. As defense-in-depth against any future caller that bypasses the
  runtime, `apply()` could additionally skip a write whose clock is not newer than
  the stored one (`hlcCompare(incoming, stored) <= 0`), making it idempotent under
  reordering. Deferred (it interacts with the diff-at-sync clock stamping and is
  unnecessary given coalescing).

## References

- [ADR 0033](0033-account-sync.md) — the v1 sync decision this refines (its "element-
  level merge is a later refinement" clause is settled here).
- Engine/ports: `packages/core/src/sync.ts`, `sync-engine.ts`, `ports.ts`; the shared
  key contract `packages/core/src/sync-keys.ts`; the new registry
  `packages/core/src/sync-shapes.ts`.
