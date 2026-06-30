# qa/INVENTORY.md — exhaustive testable surface

Derived mechanically from the code (not improvised). Each item has a stable ID,
the entry points it covers, and the attack **categories** that must be exercised
against it before it is "done". Status is filled by the loop and cross-checked
against `TRIED.jsonl` + `COVERAGE.json`.

## Attack categories (this stack)

| Code | Category | Meaning |
| ---- | -------- | ------- |
| BV   | Boundary values | numeric/string/array bounds, off-by-one, empty/huge |
| INV  | Invariant / property | algebraic laws — idempotence, commutativity, total order, encode∘decode roundtrip, monotonicity |
| MUT  | Mutation resistance | a deliberate code mutation must fail a test (tests pin behavior, not just execute it) |
| ADV  | Hostile / malformed input | injection, oversized, `NaN`/`Infinity` via JSON, fractional/negative, prototype keys, unicode |
| STATE| State / transition | lifecycle, ordering, replay, partial state |
| DEP  | Dependency failure | injected port returns `null` / `[]` / throws / out-of-range |
| AUTH | Trust boundary / authz | identity, capability tokens, request validation |
| DET  | Determinism | injected clock, no `Date.now()` / `Math.random()` in logic, stable output |

## Scope reality (rule 7 — honest)

This is a **local-first, statically-generated** app (ADR 0006). There is **no
backend serving user load**: the `apps/web/src/app/api/v1/*` REST routes are
static reads of bundled datasets, and everything user-stateful lives in the
browser behind Store ports. The **only** stateful runtime trust boundary is
`POST /api/sync` (Upstash-backed, E2E-encrypted, capability-token auth).

Therefore the prompt's **load / stress / soak / 1M-exec native-fuzz / chaos**
thresholds are **largely Not Applicable** and are recorded as such in QA_LOG
with justification, rather than faked. Substitutes that *do* fit a pure-TS
domain core: **property-based testing with shrinking (fast-check)** in place of
coverage-guided native fuzzing, and **mutation testing (Stryker)** for the
domain logic.

> **Cycle 16 update:** the Stryker pass is no longer deferred — it was run.
> Measured **80.72%** mutation score on `packages/core` (≥ the 80% target);
> 63% of survivors are content-data tables, 37% real logic. Three weakest
> high-value modules (`zakat`/`tasbih`/`prayer`) hardened to 98–100%. See
> `COVERAGE.json` `mutation` + QA_LOG cycle 16 for the number, breakdown, and
> the CI-gate recommendation.

---

## L1 — `packages/core` (pure, deterministic domain logic) — PRIME FRONTIER

Baseline coverage 99.63% stmt / 96.25% branch / 100% func. Frontier = mutation
strength + adversarial edges, **not** raw coverage.

| ID | Module | Key entry points | Categories | Status |
| -- | ------ | ---------------- | ---------- | ------ |
| C-SYNC | `sync.ts` | `hlcTick`, `hlcCompare`, `encodeHlc`, `parseHlc`, `mergeEntries` | INV, BV, ADV, MUT, DET | open |
| C-SYNCE| `sync-engine.ts` | `runSync` | STATE, DEP, ADV, MUT | open |
| C-QURAN| `quran-structure.ts` | verse-key parse/format, juz/hizb/page/ruku lookups, range iteration | BV, ADV, INV, MUT | open |
| C-PLANS| `reading-plans.ts` | template expansion, schedule rules, progress, date math | BV, STATE, DET, MUT | open |
| C-PRAYER| `prayer.ts` | method/madhab/high-lat resolution, timing shape | BV, DEP, MUT | open |
| C-HIJRI| `hijri.ts` | Gregorian↔Hijri conversion, month lengths | BV, INV, DET, MUT | open |
| C-EVENTS| `islamic-events.ts` | event date computation for a year | BV, DET, MUT | open |
| C-HAID | `haid.ts` | menstruation/nifas period rules, fasting/prayer pause | BV, STATE, ADV, MUT | open |
| C-HIFZ | `hifz.ts` | SRS scheduling (inject clock), grade transitions | STATE, BV, DET, MUT | open |
| C-PTRACK| `prayer-tracker.ts` | log/streak, ḥayḍ pause interaction | STATE, BV, MUT | open |
| C-QADA | `qada.ts` | missed/made-up counters, non-negative invariant | BV, STATE, MUT | open |
| C-ZAKAT| `zakat.ts` | nisab thresholds, rate, currency math | BV, INV, ADV, MUT | open |
| C-ACH  | `achievements.ts` | badge unlock predicates | BV, STATE, MUT | open |
| C-REM  | `reminders.ts` | scheduling windows (inject clock) | BV, DET, MUT | open |
| C-SEARCH| `search.ts` | tokenize/normalize/match, diacritics | ADV, BV, MUT | open |
| C-TRANS| `translations.ts` | edition selection/listing | BV, DEP, MUT | open |
| C-ADHKAR| `adhkar.ts` | occasion lookup, counts | BV, MUT | open |
| C-DUAS | `duas.ts` | category/lookup | BV, MUT | open |
| C-COLL | `collections.ts` | add/remove/dedupe | STATE, MUT | open |
| C-RGOAL| `reading-goals.ts` | khatma pacing math | BV, INV, MUT | open |
| C-TASBIH| `tasbih.ts` | count/target/reset | BV, STATE, MUT | open |
| C-HADITH| `hadith.ts` | collection/section lookup | BV, DEP, MUT | open |
| C-QIBLA| `qibla.ts` | great-circle bearing | BV, INV, DET, MUT | open |
| C-LANG | `languages.ts` | language/dir resolution | BV, MUT | open |
| C-PLUG | `plugins.ts` | manifest validation/merge | ADV, BV, MUT | open |
| C-BACKUP| `backup.ts` | export/import roundtrip, version/shape guard | INV, ADV, MUT | open |

## L2 — `packages/adapters` (implement core ports)

Baseline 98.77% stmt / 88% branch.

| ID | Module | Categories | Status |
| -- | ------ | ---------- | ------ |
| A-HADITH | `hadith.ts` | DEP, BV, MUT | open |
| A-HIFZ | `hifz.ts` / `sqlite-hifz.ts` | STATE, DEP, MUT | open |
| A-PRAYER | `prayer-times.ts` (adhan wrapper) | BV, DEP, MUT | open |
| A-TAFSIR | `tafsir.ts` | DEP, BV, MUT | open |
| A-TCAT | `translation-catalog.ts` (93.61/75 — weakest) | DEP, BV, MUT | open |

## L3 — `packages/data` (Quran text/structure access)

Baseline 90.44% stmt / 85.71% branch (at floor). Uncovered: 181-182, 190-191.

| ID | Module | Categories | Status |
| -- | ------ | ---------- | ------ |
| D-IDX | `index.ts` lookups over generated datasets | BV, DEP, MUT | open |

## L4 — `apps/web/src/app/api/sync` (THE runtime trust boundary)

| ID | Item | Entry | Categories | Status |
| -- | ---- | ----- | ---------- | ------ |
| S-AUTH | `parseAccountId` | bearer 64-hex | AUTH, ADV, BV | open |
| S-VALID| `isValidEntry` / `handleSync` | request body validation, caps | AUTH, ADV, BV, DEP | open |
| S-STORE| `sync-store.ts` | Upstash get/set, env config, error paths | DEP, ADV | open |

## L5 — `apps/web/src/lib/*` (browser local-first logic + sync client)

Baseline lib 55/73 floor (growing). Highest-value: `lib/sync/*` (crypto cipher,
managed keys, runtime, state-store), `backup`, `bookmarks`, the `*-store.ts`
Store-port adapters. Categories: INV, ADV, STATE, DET, MUT. Status: open
(secondary frontier — exercised after L1/L4).

## L6 — `packages/api` (tRPC/REST wiring) & v1 REST routes

Thin wiring over repositories; `repositories.ts`, `trpc.ts`. Static dataset
reads. Categories: DEP, BV. Status: low-priority (no runtime user state).

---

### Definition of done (per item)
An item is **done** when every applicable category has a recorded attack in
`TRIED.jsonl` AND the module sits inside its measured coverage/mutation floor.

---

## Cycle 1 outcome (2026-06-24) — strongest attack survived per item

| ID | Outcome | Strongest attack survived (post-fix) |
| -- | ------- | ------------------------------------ |
| C-SYNC | ✅ hardened | property: HLC total order + merge convergence (2000×4 seeds); strict `parseHlc` |
| C-SYNCE | ✅ | tombstone/skip paths covered; merge property |
| C-PLANS | ✅ fixed | non-contiguous estimate; Feb-30 rejection; date math |
| C-PRAYER | ✅ | method/madhab/high-lat (adapter polar crash fixed) |
| C-HIJRI | ⚠️ residual | valid range pinned; neg-year/oob-month = deferred (unreachable) |
| C-EVENTS | ☑️ test-gap | `dayNumber` JDN absolute value still a surviving mutant (low) |
| C-HAID | ✅ fixed | `periodLength` NaN guard; streak ancient-period = deferred |
| C-HIFZ/C-PTRACK/C-ACH | ☑️ | `onTimeRate` rounding + badge `?? 0` = low test-gaps |
| C-ZAKAT | ✅ pinned | niṣāb `>=` boundary + monotonicity property |
| C-QIBLA | ✅ fixed | non-finite guard + bearing-range property |
| C-PLUG | ✅ fixed | missing-template `TypeError` guard |
| C-BACKUP | ✅ fixed | array-as-data rejection |
| C-DUAS (in G4) | ✅ fixed | TZ-independence (core purity) |
| A-PRAYER | ✅ fixed | polar `RangeError` → graceful empty strings |
| A-TCAT/A-TAFSIR/A-HADITH | ✅ fixed | malformed-200 guards + `getTranslatedAyah` test |
| S-AUTH/S-VALID/S-STORE | ✅ hardened | non-finite/oversized/empty-node rejection + stored re-validation |
| D-IDX (Adhkar/Asma adapters) | ☑️ test-gap | uncovered 177-191 — add-test recommended |

Legend: ✅ defect fixed + regression test · ☑️ code correct, test-gap noted · ⚠️ partly
deferred (unreachable today) · see `QA_LOG.md` residual risk for ⚠️/☑️ follow-ups.
