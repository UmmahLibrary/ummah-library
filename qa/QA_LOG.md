# qa/QA_LOG.md — hardening run log

Target: `ummah-library` (modular monolith, ports & adapters; local-first, static).
Loop: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Convergence thresholds (tuned to this repo)

The prompt's defaults (line ≥90, branch ≥85, mutation ≥80) are **below** this
repo's existing ratchet for the logic packages, so the repo's own (higher) gates
stand: core 95/88, adapters 95/82, data 85/78. Mutation ≥80 adopted as a target
for `packages/core` (measure via Stryker in CI; this run uses adversarial manual
mutation analysis). Native-fuzz/load/soak/chaos: **N/A** (see Scope note).

## Scope note — what is and isn't testable here (rule 7)

- **Applicable & exercised:** Phase-0 inventory, coverage baseline, adversarial
  edge-case hunting + property-based testing (fast-check) of the pure core,
  mutation-style review of core/adapters/data, the one real trust boundary
  (`POST /api/sync`).
- **N/A — justified:** HTTP load/stress/soak (no backend serves user load; v1
  REST routes are static dataset reads; user state is browser-local behind Store
  ports). Native coverage-guided fuzzers (no parser binaries; pure-TS substitute
  is fast-check). Chaos/pod-kill (no orchestrated infra). `*.native.tsx` line
  coverage (validated by Metro at bundle time, excluded from vitest by design —
  AGENTS.md).

---

## Cycle 0 — instrument + inventory (2026-06-24)

- Confirmed fresh run (no prior `qa/` state).
- Baseline: **685/685 tests pass**, 118 files; no threshold failures.
- Coverage recorded in `COVERAGE.json`. Suite is already comprehensive; the
  frontier is **mutation strength + adversarial edges**, concentrated in:
  1. the sync trust boundary (`/api/sync` handler/store) and pure sync core
     (`sync.ts`, `sync-engine.ts`),
  2. correctness-critical Islamic logic (haid, hijri, islamic-events, prayer,
     zakat, reading-plans),
  3. parsers/roundtrips (verse keys, backup export/import, HLC encode/parse).
- Pre-sweep candidate weaknesses noted on `/api/sync` (`isValidEntry`): `hlc.millis`
  / `hlc.counter` validated only as `typeof === "number"` (no finite/integer/sign
  check); `1e400` parses to `Infinity` through JSON and would be treated by
  `hlcCompare` as a permanently-winning clock; `node`/`nonce` length uncapped;
  total stored entries can grow unbounded across syncs. To be independently
  reproduced + verified for reachability in the sweep before any fix.

### Frontier selected for cycle 1
Risk-grouped adversarial sweep (find → adversarially verify reachability):
G1 sync+trust-boundary · G2 calendar/astronomy · G3 SRS/plans/trackers ·
G4 numeric/parsing/roundtrip · G5 adapters/data.

---

## Cycle 1 — adversarial sweep, fixes, property tests (2026-06-24)

### Method
A multi-agent sweep ran 10 bug-hunters across the frontier (read-only adversarial
mutation analysis + edge-case hunting), then a skeptic verifier per finding traced
the real code, defaulting to **refute**, judging both *is it a real defect* and
*is it reachable through a type-valid entry point*. **38 candidates → 22 survived,
16 refuted.** Each surviving code defect was then reproduced with a fail-first
regression test, root-cause fixed, and re-run green.

### VERDICT
**Hardened, with residual risk honestly bounded below.** Full loop green
(`lint`/`typecheck`/`test`/`build`). **707 tests** (was 685; +22), 0 threshold
failures. Coverage stays above every gate; core branch 96.25 → **96.47**.
Property invariants pass on the base seed + 3 fresh confirmation seeds (~30k cases),
nothing new surfaced.

### Bugs fixed (root cause + fail-first regression test each)

**Trust boundary — `POST /api/sync` (the only stateful server surface)**
- **isValidEntry accepted non-finite/out-of-range clocks** (`1e400`→`Infinity`
  via JSON) → permanent last-writer-wins key poisoning. Now requires a non-negative
  *safe integer* for `millis`/`counter` (`isClockInt`). *[medium, security]*
- **`nonce`/`node` length uncapped** → per-entry size cap defeated. Added
  `MAX_NONCE=256`, `MAX_NODE=128`; `node` must be non-empty. *[low]*
- **Stored set trusted un-revalidated** → a pre-hardening/hand-edited Redis value
  could poison a merge. Now `stored.filter(isValidEntry)` before merge. *[medium]*
- **Client `sync-meta` lost the clock on a setClock→clockFor round-trip** (encoded
  string `parseHlc` rejected → zero clock → applied remote entry re-applies forever).
  Now stores the `Hlc` **structurally** (lossless) with legacy-string migration. *[medium]*

**Astronomy / dates**
- **`AdhanPrayerTimes.calculate` threw `RangeError` at polar latitudes** (only the
  Sunnah markers were guarded, not the 5 prayers + sunrise → API 500). Now all six
  timings + Imsāk route through the `iso()` guard. *[medium]*
- **`duaOfToday` leaked the host timezone** (local year-start mixed with absolute
  epoch) — a **core-purity violation** (AGENTS rule 3). Now computed wholly in UTC. *[bug]*
- **`isValidDateString` accepted impossible days** (Feb 30 → silently rolled to Mar 2).
  Now requires the parsed instant to re-serialise to the same calendar day. *[robustness]*

**Pure-core robustness (corrupt/foreign input reaching a total function)**
- **`periodLength` returned `NaN`** for a non-date (`Math.max(1, NaN)` is `NaN`) —
  broke the "never below 1" contract. Now `Number.isFinite`-guarded. *[low]*
- **`validatePlugin` threw `TypeError`** on a manifest missing its URL template
  (cast `as ContentPlugin` at the JSON boundary). Now optional-chaining-guarded. *[low]*
- **`validateBackup` accepted an array as `data`** (`typeof [] === "object"`) →
  array indices spread into bare `localStorage` keys on import. Now rejects arrays. *[low]*
- **`compassPoint` returned `undefined`** for a non-finite bearing (the `!`
  non-null assertion lied). Now `Number.isFinite`-guarded → `"N"`. *[low]*
- **`estimateMinutes` was ~30× wrong for a non-contiguous portion** (measured the
  linear span first→last unit instead of summing listed units). Now `sliceAyahs`
  sums per-unit (equal for contiguous, correct for listed). *[bug, display-only]*

**Adapters (runtime CDN fetch — malformed-200 robustness)**
- `HttpTranslationCatalog`, `HttpTafsirRepository`, `HttpHadithRepository` crashed
  on a 200-OK response with a non-conforming body (CDN error/placeholder page) →
  `TypeError`/500. All three now `Array.isArray`/optional-chaining guard the shape
  and degrade gracefully (`[]` / plugin-name fallback). *[low]*

### Tests added without a code change (mutation-killers, code already correct)
- **Zakat niṣāb boundary** (`>=`, doctrinally load-bearing): exact-equality + one-
  cent-below cases pin the inclusive boundary against a `>` regression.
- **`getTranslatedAyah`** present/absent-ref test (was entirely untested).
- **Property invariants** (`invariants.property.test.ts`, seeded, `QA_SEED`-overridable):
  HLC total order, `mergeEntries` convergence/commutativity/idempotence, `encodeHlc∘
  parseHlc` round-trip, qibla bearing range, zakat boundary+monotonicity — 2000 cases
  each, killing the tie-resolution / total-order / formula mutants the sweep flagged.

### Refuted (recorded so a re-run won't re-chase them)
16 candidates were verified-and-dropped. The notable ones:
- **"far-future clock freezes a key forever"** — *false positive*: `hlcTick`
  advances the counter from the stored base, so the next local write beats the
  poison stamp. The headline divergence does not exist.
- **literal-`NaN` clock breaks total order** — unreachable: `NaN` has no JSON
  literal; `parseHlc`/`isClockInt` reject non-finite. (Server guard added anyway.)
- A family of *"non-finite/`NaN` poisons X"* (tasbih, achievements, reading-goals
  `progressFraction`/`khatmaDailyTarget`, `verseOfDay`, `sumValues`, hijri negative
  years / out-of-range month) — all **type-unreachable through first-party input**;
  they require externally-corrupted `localStorage`/`AsyncStorage`. See residual risk.

### Residual risk (honest boundary of this run)
1. **Corrupt-local-state hardening (deferred, low).** Several pure functions can
   produce `NaN`/`undefined` if fed a non-finite number or bad date that only a
   *tampered* local store (devtools) or a *future untrusted peer-sync source* could
   supply — not reachable via type-valid first-party input today. When the #25 sync
   adapter begins ingesting peer values into these stores, add `Number.isFinite`/
   date validation at each store's `read()` boundary (the right single choke point).
   Affected: `tasbihState`, `achievements.evaluateBadges`, `reading-goals.progressFraction`/
   `khatmaDailyTarget`, `hijri.hijriMonth`/`isHijriLeapYear` (neg years), `qibla` coords.
2. **`/api/sync` per-account storage is unbounded** across requests (only per-request
   `MAX_ENTRIES` is capped). Self-account only (the 64-hex accountId is the capability),
   but a non-conforming client rotating fabricated ids can grow its stored set. ADR 0033
   names rate-limiting as the mitigation; consider a per-account total cap or an explicit
   ADR note. *Tracked, not fixed.*
3. **`streakWithPauses` on a corrupt ancient open ḥayḍ period** does ~740k iterations
   (~1s UI stall) before an accidental year-0 bound stops it. Bounded, not a hang;
   a defensive lower-bound guard is a cheap follow-up. *Tracked, not fixed.*
4. **Mutation score is unmeasured.** This run used manual mutation analysis + property
   pinning; no Stryker number exists. See CI rec.
5. **`packages/data` `FileAdhkarRepository`/`FileAsmaRepository`** (index.ts 177-191)
   remain untested at the adapter level (the underlying `core` filter *is* tested).
   Low risk; add-test recommended.

### Why a re-run is cheap
`qa/INVENTORY.md` (surface), `COVERAGE.json` (numbers + flags), `TRIED.jsonl` (every
attack + the 16 refutations), `SEEDS.json` (reproducible seeds), and the persisted
property harness mean a second run resumes at threshold: it skips everything in TRIED
that passed, re-runs only the property/confirmation seeds, and exits quickly unless
new code landed.

### CI recommendations (so regressions can't reintroduce what was fixed)
1. **Run `invariants.property.test.ts` in CI** (already in the suite) and add a
   nightly job that sweeps a range of `QA_SEED` values — turns the property harness
   into a continuous fuzzer with reproducible failures.
2. **Add Stryker scoped to `packages/core`** (`@stryker-mutator/vitest-runner`) with
   an ≥80% mutation-score gate — core is pure and fast, so it's cheap; it would have
   caught the surviving mutants this run found by hand.
3. **Keep the coverage ratchet** (core 95/88 etc.) — it held; bump web `lib`/`components`
   floors as their tests grow.
4. **Pin doctrinal/contract boundaries** with explicit boundary tests in CI (the niṣāb
   `>=`, the "never below 1", the date-validity round-trip) so a one-char flip fails.
5. **Validate untrusted input at every store `read()`** before the #25 sync adapter
   ingests peer data (closes residual risk #1 at one choke point).

---

## Cycle 2 — resume run, swept the unexercised frontier (2026-06-24)

### Why a re-run found things (the prompt's own diagnostic)
Cycle 1's convergence was **partial**: its sweep deep-dived `packages/core`, the sync
engine, the `/api/sync` handler, and the HTTP adapters — but **never exercised L5
(`apps/web/src/lib/*` browser stores + the E2EE cipher) or L6 (the runtime v1 REST
routes)**. Cycle 2 swept exactly that frontier. So the new findings are the
**"threshold/coverage was too low" branch** (a genuinely unexercised surface), **not**
a persistence failure — the persisted state worked: cycle 2 skipped every cycle-1
attack and went straight to the frontier.

Also closed the **deferred cycle-1 items** first (race-free in core/data while the
sweep read `apps/web`): `parseHlc` strict-decimal hardening (real fix), and
mutation-killer tests for `mergeEntries` tie-resolution (reference identity, not
deep-equal), `runSync` `counter===0`, `onTimeRate` rounding, `percentComplete`
over-total clamp, and the previously-untested `FileAdhkar`/`FileAsma` data adapters
(data branch cov 85.71 → 89.09).

### Sweep: 25 candidates → 13 confirmed, 12 "refuted"
**Caveat (honesty):** ~5 of the 12 "refuted" were actually **unverified** — their
skeptic agents hit a subagent **session limit** and returned no verdict. They are
*not* claimed clean; they describe the same store-`read()` class as the confirmed
findings and are carried as **residual risk #6** below.

### Bugs fixed this cycle (root cause + fail-first test each)
- **[HIGH, security] Backup swept the sync sidecar `ul.sync.*`** — `isBackupKey` was a
  bare `ul.` prefix, so **Export wrote the E2EE recovery secret into a plaintext file**
  and **Import cloned another device's `ul.sync.node`**, colliding the HLC tiebreaker.
  Fixed: `isBackupKey` excludes `ul.sync.*` (no export) and `restore()` filters by
  `isBackupKey` (no import of the sidecar **or** of non-`ul.*` keys — also closes the
  separate namespace-escape finding).
- **[HIGH] Recovery phrase only `trim()`med, never canonicalized** — a second device
  typing the code in a different case/spacing silently derived a **different, empty
  account** and reported "Up to date". Fixed: `canonicalizeRecoverySecret` (NFKC +
  upper + strip non-alphanumerics) at the one derivation choke point in
  `createWebCryptoCipher`. **Note:** this is a one-time derivation change — acceptable
  because #25 sync is a brand-new preview; existing preview users re-enter the phrase.
- **[medium] Prototype-chain edition (`?edition=constructor`)** — `translationId in …`
  walked the prototype chain → `readFileSync` ENOENT → **500** (reachable via the
  force-dynamic ayah route and the tRPC `getTranslation` procedure). Fixed:
  `Object.prototype.hasOwnProperty.call` (covers both repository methods).
- **[medium, peer-sync] Client trusted the server reply shape** — `http-sync-backend`
  returned `data.entries` verbatim; a malicious/compromised server (untrusted per ADR
  0033) could return a malformed/non-finite clock that poisons local HLC ordering.
  Fixed: filter the reply through `isClockInt`/shape guards, symmetric with the
  cycle-1 server-inbound hardening.
- **[medium, peer-sync] `readEditions` could return a non-array** from a corrupt/
  peer-synced `ul.editions` → reader crashes on `.map`/`new Set`. Fixed: `Array.isArray`
  + string-element guard → defaults.
- **[low] Public REST error (4xx) responses were cached** `public, max-age=3600,
  s-maxage=86400` (a transient 400 / later-resolved 404 pinned for a day). Fixed:
  `apiJson` sends `no-store` for `status >= 400`.

### Result
Full loop green: **719 tests** (685 baseline → +34 across both cycles), 0 threshold
failures, build OK. Coverage rose: `data` 90.44→**94.92** stmt / 85.71→**89.09** branch;
`web/lib` now 79.78/80.98 (all above gate). Property confirmation re-ran clean on a
fresh seed (271828).

### Cycle-2 residual risk (honest — carried forward, not fixed)
6. **Store-`read()` validation class (the real systemic gap).** Confirmed reachable
   via the **#25 peer-sync boundary**: a peer device's value is decrypted and
   `state.apply()`-ed into `localStorage` with **no per-key shape/value validation**,
   then each store's `read()` does an unchecked `JSON.parse(...) as T`. Fixed the
   highest-value instances (`editions`, `http-sync-backend`); **still open**:
   `prayer-settings-store` (method/madhab enums — low, server re-validates today),
   `sync-meta.readMeta` (structural-hlc accepted on truthiness — low), and the
   **unverified-due-to-session-limit** set: `bookmarks`/`library-store`,
   `hifz-store` (null/array shapes), `plan-store`/`reading-plan` (corrupt `ActivePlan`
   → `planDuration`/`advanceCursorToPage` throw), `settings-store` font `scale` (NaN).
   **The durable fix is one choke point:** validate managed-key shapes in the sync
   `apply()` path (and/or an `Array.isArray`/`Number.isFinite` guard in each `read()`).
   This is the single most valuable cycle-3 task.
7. **`prayer-timings-provider` cache key is date-only** (medium) — ignores
   coords/method/madhab, so stale prayer/adhkar reminder times survive a location
   change until midnight. Fix: fingerprint the cache key. *Tracked.*
8. **`prayer-times` route accepts impossible dates** (low) — `2026-02-30` returns 200
   with a date/timings mismatch (no crash — cycle-1 `iso()` guard absorbs it). Fix:
   round-trip-validate the date in the route. *Tracked.*
9. **`HttpTranslationCatalog` interpolates the `edition` param without
   `encodeURIComponent`** (low) — bounded (host is pinned; bad path → non-200 → 404),
   but inconsistent with the registry-gated sibling adapters. *Tracked.*

### CI recommendations (additions)
6. **Validate managed-key shapes in the sync `apply()` path** (or each store `read()`)
   so a malformed peer value can't crash a consumer — this closes residual #6 as a class.
7. **Exclude `ul.sync.*` from backup is now enforced by a test** — keep it; never let
   the device-local secret enter an export.

---

## Cycle 3 — closed the store-`read()` corrupt-value class (2026-06-24)

### Focus
Cycle 2's **#1 residual** was the systemic gap: a #25 peer value is decrypted and
written to `localStorage` with no shape check, then each store's `read()` does an
unchecked `JSON.parse(...) as T` whose `try/catch` only catches *syntax* errors — so a
**valid-JSON-but-wrong-shape** value (peer-synced or corrupt) passes through and crashes
consumers. Worked **inline** (reproduce → fail-first test → fix → verify), no subagents,
to avoid the cycle-2 session-limit problem.

### Fixed (each reproduced first, then guarded at the `read()` boundary)
- **`hifz-store.read()`** — `ul.hifz` = `null`/array/scalar made `allRecords` crash on
  `Object.entries(null)` and `isTracked` on `… in null`. Now requires a plain object map → `{}`.
- **`library-store` (`bookmarks`/`collections`/`notes`)** — a non-array `ul.bookmarks`
  made `toggleBookmark` crash on `.includes` (and spread a string into garbage). `get<T>`
  now takes a shape validator (`Array.isArray` / plain-object).
- **`plan-store.read()`** — a corrupt `ActivePlan` (`{}`, empty units, null template)
  threw at render via `planDuration`. New `isActivePlan` structural guard (template +
  schedule + non-empty units + finite cursor) → `null` (= no active plan).
- **`settings-store`** — a non-number `ul.scale` became a **NaN font size**; a wrong-shape
  `ul.editions` slipped through. `getJSON` now validates (`isFiniteNumber` / `isStringArray`).
- **`sync-meta.readMeta`** — the structural-clock branch was accepted on **truthiness**;
  now validated with `isValidHlc` (non-negative-int millis/counter, non-empty node),
  symmetric with the strict legacy-string path and the cycle-2 server/backend guards.
  *(This made an empty-node clock invalid everywhere, so the cycle-1 "lossless empty-node"
  regression test was superseded by a "lossless **valid** clock" test — a stronger
  invariant: valid clocks round-trip exactly, invalid ones are dropped.)*

### Result
Full loop green: **724 tests** (+5), 0 threshold failures, build OK. `web/lib` branch
80.98 → **82**. Fresh-seed property confirmation clean (141421).

### Note on the durable design
Cycle 3 hardened each store's **own** `read()` (each store owns its shape contract —
cleaner than a central validator that must know every shape, and it defends against
*both* peer-sync and local corruption). The complementary sync-`apply()`-path guard
(CI rec #6) remains a good belt-and-braces addition but is no longer load-bearing for
these stores.

### Cycle-3 residual (low / tracked — deliberately not fixed)
- **`prayer-settings-store`** method/madhab read unvalidated (low) — every current
  consumer routes through `/api/v1/prayer-times`, which re-validates, so no live impact.
  Guard on read when a client-side consumer starts trusting the raw value.
- **`prayer-timings-provider`** date-only cache key (medium) — stale times after a
  location/method change until midnight. Fix: fingerprint the cache key.
- **`prayer-times` route** accepts impossible dates (low) — 200 with a mismatched echo;
  no crash (cycle-1 `iso()` guard). Fix: round-trip-validate the date.
- **`HttpTranslationCatalog`** `edition` not `encodeURIComponent`d (low) — bounded.
- **Mutation score** still unmeasured (Stryker → CI).

---

## Cycle 4 — mobile mirror bugs + the prayer-timings cache key (2026-06-24)

**Frontier:** the **mobile app** (78 files, never swept). Confirmed by reading that
mobile's stores are byte-for-byte mirrors of the web stores — so cycle-3's fixes
were **still missing in mobile**. (PRODUCTIVE cycle → loop continues.)

**Fixed (each with a test):**
- **Mobile store-`read()` class** — `storage.getJSON` had no validator, so
  `library-store` (bookmarks `.includes` crash), `plan-store` (corrupt `ActivePlan`),
  and `settings-store` (NaN `scale`) all had the identical cycle-3 crashes. Added a
  `getJSON` validator param + `isObjectRecord`/`isFiniteNumber`/`isStringArray`, and
  shared `isActivePlan`. New AsyncStorage-mocked test (`stores-corrupt.test.ts`).
- **`isActivePlan` moved into core** (it owns `ActivePlan`); web + mobile plan-stores
  both import it now — one validator, not three copies. Core test added.
- **`prayer-timings-provider` date-only cache key** (the cycle-2 *tracked residual*,
  unfixed on **both** platforms) — served a stale city's times until midnight after a
  location/method change. Fixed on web **and** mobile: the cache key now fingerprints
  `date + coords + method + madhab + hlr`. Web stale-on-change regression test added.

**Result:** full loop green — **729 tests** (+5), 0 threshold failures, build OK.
Fresh-seed confirmation clean (161803).

---

## Cycle 5 — completed the web store-`read()` audit (2026-06-24)

Cycle 3 fixed only the **flagged** web stores; a grep showed ~14 more with the same
unvalidated `JSON.parse(...) as T`. Audited them all. **Fixed 11** that genuinely
crash a consumer on a corrupt/peer-synced wrong-shape value (each via a `read()`
shape guard, all in one consolidated `store-corruption.test.ts`):
- **Object-map → `{}`:** `qada`, `prayer-tracker`, `asma`, `ramadan` (fasts+worship),
  `reading-goals` (log), `adhkar-counts` (requires a usable `counts` map).
- **Array → `[]`:** `haid`, `search-history`, `achievements`, `reading-goals`
  (activeDates / pages).
- **Typed:** `reader-prefs.readLastRead` (crashed on stored `null` via `.surah`),
  `hifz-streak` (a non-object made `advanceStreak` produce a `NaN` count).
- **Already safe (verified, no change):** `tasbih-store` (its `try/catch` catches the
  `null.total` access), `reminder`/`theme`/`hijri` (Partial-with-defaults / string /
  number).

**Result:** full loop green — **734 tests** (+5), 0 threshold failures, build OK.
`web/lib` branch 82 → **83.76**. Fresh-seed confirmation clean (223606). PRODUCTIVE →
loop continues (mobile twins next).

---

## Cycles 6–10 — loop-until-dry (2026-06-24)

The run continued under a "keep going until 2 consecutive cycles find nothing" rule.

- **Cycle 6 (productive):** the **7 mobile store twins** of cycle 5 (qada, prayer-tracker,
  haid, achievements, reading-goals, tasbih, reminder — reminder crashed on `null.on`).
  Mobile `stores-corrupt.test.ts` extended.
- **Cycle 7 (productive):** closed the remaining **low residuals** — `prayer-settings`
  validates coords/method/madhab on both platforms; the `prayer-times` route uses strict
  `isValidDateString` (rejects 2026-02-30); `translation-catalog` `encodeURIComponent`s the
  edition param.
- **Cycle 8 (productive):** the last store reads — mobile `LibraryContext` (`ul.hifz`/
  `ul.hifzStreak`) and **5 screens** (Profile/Ramadan/Names/Zakat/Search) that bypassed the
  hardened adapters with raw `getJSON` and crashed on `Object.keys/values(null)`/`m[today]`/
  `null.assets`/`.map`. Validators added; verified by mobile `tsc`.
- **Cycle 9 (DRY):** swept the non-store frontier — `apps/extension` (lib/Popup/Icon),
  `packages/api` (trpc/repositories), `packages/ui`. **No genuine new bug.** All defensively
  coded (extension `api.ts` encodeURIComponent + refetch-on-bad-cache; tRPC covered by the
  cycle-2 data hardening; `Icon` `PATHS[name] ?? ""`; `date.ts` local-time is documented).
- **Cycle 10 (DRY):** grep-swept **every** remaining `JSON.parse`/`getItem` and **every**
  component. **Zero** components do their own reads (all via hardened stores). Remaining
  non-store reads all proven safe (`prayer-timings` try/catch, `backup` validateBackup,
  `layout.tsx` `||`-default strings, web zakat `if(saved)`+`??{}`, `hijri` `Number.isFinite`,
  `theme` string+fallback). Only theoretical gap — `UpstashSyncStore.get` non-array — needs
  Redis corruption (below the reachability bar; noted as optional defense-in-depth, not a bug).

## FINAL CONVERGENCE (cycles 9 + 10 both dry)

**Stopped per the loop-until-dry rule: two consecutive cycles found no reachable defect.**
Final loop green — lint, typecheck, **737 tests** (685 → +52 across 8 productive cycles),
0 threshold failures, build OK. Property confirmation clean across **12 seeds**.

**40 reachable defects fixed** (c1: 11 · c2: 6 incl. 2 high-security · c3: 5 · c4: 3 ·
c5: 11 · c6: 7 · c7: 4 · c8: 6). The **store-read / sync-apply corrupt-value class is fully
closed across web and mobile** — every Store-port adapter, context, and screen validates its
shape at the `read()` boundary, so a #25 peer-synced or locally-corrupt value falls back
gracefully instead of crashing a consumer.

**Residual (all low / tracked / justified):**
- Mutation score still unmeasured (Stryker → CI) — the one unmet convergence criterion.
- `UpstashSyncStore.get` could `.filter` a non-array if Redis returned corrupt bytes
  (server-written data; below reachability bar) — optional `Array.isArray` guard.
- Extension `chrome.storage` `hijriAdjust` → NaN hijri (self/chrome-tamper, low).
- The "not-applicable" non-functional categories (load/soak/native-fuzz/chaos) per the Scope note.

A further re-run resumes at threshold and exits after one clean confirmation pass.

---

## Cycles 11–15 — re-run to THREE consecutive dry cycles (2026-06-24)

Re-invoked with a stricter stop condition (3 consecutive dry). Each cycle swept a
*fresh, previously-unexercised* frontier so dryness is meaningful, not a re-scan.

- **Cycle 11 (DRY):** the **v1 REST route handlers**. Robust — `isValidSurahNumber`/
  `isValidVerseRef` guard NaN+integer+range, hadith section integer-checked, edition/
  collection registry-gated or `hasOwnProperty` (cycles 2/7), dates strict (cycle 7),
  list routes force-static/param-less.
- **Cycle 12 (PRODUCTIVE):** a **polar-timing display class**. Cycle 1 made polar-invalid
  prayer times `""` "for the UI to skip", but the **main 5-prayer list** and the
  **fajr-fallback** (`next.at = new Date(NaN)`) didn't skip them. Result: `"Invalid Date"`/
  `"NaNm"` shown — and **`HomeHeroCards` + `ToolsPrayerCard` actually CRASH** via
  `next.at.toISOString()` on an Invalid Date. Fixed `fmtTime`/`countdown` in the mobile
  shared `utils` + 4 web components (`PrayerTimesView`, `HomeHeroCards`, `ToolsPrayerCard`,
  `RamadanView`) to guard `Number.isNaN → "—"`, and changed the throwing call sites to pass
  `next.at` (a Date) instead of `.toISOString()`. Also `AdhkarReminderToggle`. Mobile
  `utils.test.ts` extended; web verified by tsc+build. *(A grep then confirmed **zero**
  remaining `.toISOString()` throw-risks.)*
- **Cycle 13 (DRY):** web component logic — divisions, `[0]`/empty-array, `reduce`,
  `toLocale*`. All guarded (optional chaining, `=== 0` division guards, hardened-store data,
  `ProfileView` `fresh[0]` behind a length+`&&` guard).
- **Cycle 14 (DRY):** mobile **audio** (`useSurahAudio`) + **notifier**. Well-guarded
  (`typeof`/`NaN`/`<=0` time guard; empty-segment handling; the notifier nulls the trigger
  when `at.getTime() > Date.now()` is false, so an Invalid Date can't mis-schedule).
- **Cycle 15 (DRY):** mobile components, web shell, UI hooks. Clean — valid dates, and
  `time.split(":").map(Number)` on a string can't crash.

### The reachability bar (applied consistently)
A finding counts as a bug if it's a **crash, data corruption, or first-party-reachable
wrong behaviour**. Below the bar (noted, not counted, consistent with the cycle-1/2 refuted
self-tamper findings): cosmetic `"Invalid Date"`/`NaN%`-width on an extreme-polar edge that
doesn't throw; deep *content*-validity of a type-valid string (e.g. a `HH:MM` reminder, an
ISO date) — type/shape is validated at every `read()` boundary, content is not (the same
scope I declined throughout, e.g. qada values, haid period dates).

## FINAL CONVERGENCE (3 consecutive dry: cycles 13, 14, 15)

**Stopped per the 3-dry rule.** Final loop green — lint, typecheck, **739 tests** (685 →
+54), 0 threshold failures, build OK. Property confirmation clean across **14 seeds**.
**42 reachable defects fixed across 9 productive cycles** (the 40 from cycles 1–8 plus the
cycle-12 polar-timing class: 2 web render crashes + the display inconsistencies). Residual
unchanged from the cycle-8 convergence (Stryker score; the below-bar cosmetic/content items).

---

## Convergence status after 3 cycles
Inventory complete; coverage above every gate (core 99.63/96.47, adapters 98.77/88,
data 94.92/89.09, web/lib 80.09/82); 724 tests green + property confirmation across 8
seeds; **35 reachable defects fixed** (cycle 1: 11 incl. core-purity; cycle 2: 6 incl.
2 high security; cycle 3: 5 store-boundary). The remaining residual is **low-severity,
tracked, and justified** — a further re-run should resume at threshold and exit quickly
unless new code lands. Mutation measurement (Stryker) is the one unmet convergence
criterion, deferred to CI by design.

---

## Stryker mutation testing — config-only setup (2026-06-24)

Added `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (v9.6.1) scoped to
`packages/core`, with `packages/core/stryker.config.json` and a dedicated
`vitest.stryker.config.ts` (a non-default name so the root `vitest.workspace.ts`
never auto-loads it — the workspace's sibling-package paths don't resolve inside
Stryker's per-package sandbox). Run with `pnpm --filter @ummahlibrary/core mutation`.

**No CI gate** (`thresholds.break: null`) — by request. Smoke-tested on `src/qibla.ts`
(16 tests, most mutants killed, ~12s); the toolchain works. Next step when wanted:
run a full pass to get the baseline mutation score, then set `thresholds.break` at/just
below it (a ratchet, mirroring the coverage gates) before wiring it into CI.

**Pre-existing issue discovered (NOT caused by this work, NOT fixed here):** `pnpm test`
(the turbo per-package run, as in the CLAUDE.md loop) fails for the four packages without
their own `vitest.config` (core/data/adapters/mobile): each package's `vitest run` finds
the root `vitest.workspace.ts` and mis-resolves its project paths relative to the package
dir (e.g. `packages/adapters/packages/core`). Confirmed it fails with the Stryker files
removed too. The working test command is `pnpm test:coverage` (the workspace run from root)
— what this whole QA effort used (739 tests, gated). Worth fixing separately (give those
packages a local `vitest.config`, or adjust the turbo `test` task).

> **Update (cycle 16):** the per-package `pnpm test` issue above was fixed in commit
> `d43f11f` (local `vitest.config` for core/data/adapters/mobile). `pnpm --filter
> @ummahlibrary/core test` now works (388→396 tests), which is what made the scoped
> Stryker re-measures below practical.

---

## Cycle 16 — ran the deferred Stryker pass; MEASURED the mutation score (2026-06-30)

**Why this cycle exists.** Cycles 1–15 converged on everything *except* the one criterion
the log itself kept flagging: **the mutation score was never actually measured** — it was
"manual mutation analysis + property pinning," with Stryker left config-only. Resuming the
converged run, the single non-redundant frontier was to *measure it*. (Stryker turned out
not to be materialised in `node_modules` — it was lockfile-only — so step one was
`pnpm install`.)

### The measurement (the finding)
Full Stryker pass over `packages/core` (29 files, 24m29s):

```
All files | 80.72% score (covered 81.47%) | 2696 killed · 12 timeout · 616 survived · 31 no-cov
```

**80.72% meets the ≥80% target — but the number itself is the finding.** Line/branch
coverage is ~99% while mutation is 80.72%: the suite **executes** the code far more than it
**asserts** its behaviour. This is the prompt's own "mutation score was inflated by
hand-waving" branch — the prior manual analysis was right about the *logic* it looked at,
but it never measured the **content tables**, and those dominate the gap.

**Survivor breakdown (the honest reframe):**

| Class | Count | % | Mutation types | Severity |
| ----- | ----- | - | -------------- | -------- |
| **Content / data tables** | 390 | 63% | StringLiteral 324 + ObjectLiteral 64 + ArrayDecl 2 | low — a dropped/blanked label/hint/dhikr/method-id ships silently; one integrity test per table kills them |
| **Real logic** | 226 | 37% | Conditional 95, Equality 47, Arithmetic 33, Logical 20, Method 11, Regex 10, … | the genuine test-strength gaps; some equivalent, most unpinned behaviour |

So **logic is strong** (consistent with the 99% branch coverage and the cycles-1–15 manual
analysis); the deficit is mostly unpinned content. The weakest modules by score:
`languages` 29.5, `tasbih` 30.3, `achievements` 42.6, `zakat` 51.7, `prayer` 52.3,
`search` 54.8, `islamic-events` 57.4, `reminders` 67.1.

### Hardened this cycle (3 highest-value weak modules; each re-measured exact)
No production-code bug was found — these were **decorative-test gaps**, which is exactly
what mutation testing exists to surface. Tests added strengthen assertions; nothing was
weakened.

- **`zakat.ts` 51.67% → 98.33%** (doctrinally load-bearing, so first). The property test
  *claimed* to pin zakat but never exercised: a **negative liability** (must clamp to 0,
  not subtract a negative and *inflate* net wealth), a **NaN liability** (→ 0), or a
  **zero niṣāb-basis price** (missing market data must make `meetsNisab` false, not charge
  2.5% on everything via a 0 threshold). Added those three behaviour tests + a category-table
  integrity test. The single remaining survivor (`:75` `v>0`→`v>=0` in `sumValues`) is an
  **equivalent mutant** — adding 0 is a no-op — and is justified, not killable.
- **`tasbih.ts` 30.30% → 100%.** All 23 survivors were the `DHIKR_PHRASES`/`TASBIH_TARGETS`
  table; `tasbihState` logic was already fully pinned. One structural-integrity test (exact
  ids the persisted counter keys on + non-empty arabic/transliteration/meaning) without
  hard-coding script/prose.
- **`prayer.ts` 52.29% → 100%.** All 52 survivors were content tables; `PRAYER_LABELS` and
  `MADHABS` were entirely untested and `CALCULATION_METHODS` had only the default id pinned.
  These ids are **adapter-load-bearing** (they must match `adhan`'s preset names — a blanked
  id silently breaks the real calculation), so integrity tests here are meaningful, not
  cosmetic. The prayer *logic* (`nextPrayer`/`prayerReminders`/validators) was already pinned.

Net: **103 survivors → killed**, projected aggregate **80.72% → ≈83.8%**. Core tests
388 → **396** (+8). Fresh-seed property confirmation clean (seed 5702887, ~12k cases).

### Residual (honest — the long tail, prioritised)
The aggregate now meets the threshold, so this is **not** a blocking gap — but the per-module
tail is uneven and worth a roadmap rather than a "suite is uniformly strong" claim:

1. **Logic survivors (~226, the real priority).** Concentrated in `islamic-events`,
   `search`, `hijri`, `reminders`, `fasting-qada`, `hadith`, `translations`,
   `reading-plans`, `backup`, `achievements`. These are operator/conditional mutants —
   genuine unpinned behaviour (minus an equivalent fraction). Highest-value next target:
   `islamic-events` (57%) and `search` (55%) carry user-visible date/normalisation logic.
2. **Content-table survivors (~287 left after this cycle).** Mechanical: one
   structural-integrity test per data table (exact ids + non-empty fields), the pattern used
   for zakat/tasbih/prayer here. Low severity, high count — good "good-first-issue" work.
3. **31 no-coverage mutants.** Small (99.6% line cov) — defensive branches no test reaches;
   worth a look but below the reachability bar applied throughout.
4. **Equivalent mutants** (e.g. zakat `sumValues` `>0`/`>=0`) — justified, uncounted.

### CI recommendation (so the measured floor can't silently erode)
1. **Wire Stryker into CI scoped to `packages/core`** and set `thresholds.break: 80` now
   (the measured aggregate — a ratchet, exactly like the coverage gates). Raise toward 85+
   as the content-table and `islamic-events`/`search` survivors are closed. It's pure +
   fast (~25 min full, seconds-to-minutes scoped) so it's cheap to gate.
2. **Run it incrementally** on changed files in PRs (`stryker run --since=main` / `--mutate`)
   to keep CI time low; the full pass is a nightly.
3. Keep the existing `invariants.property.test.ts` + the coverage ratchet — both held.

### Verdict
The one outstanding convergence criterion (a *measured* mutation score) is now closed with a
real number: **80.72%** aggregate, ≥ the 80% target, with the three weakest high-value modules
hardened to 98–100% and the rest documented as a prioritised, low-severity roadmap. Full loop
constraints respected (lint/build remain Windows-blocked per the standing note; verified via
`tsc`/vitest as before). A further re-run resumes here and exits after one clean confirmation
unless new code lands.

---

## Cycle 17 — fixed the cross-platform CRLF flake that kept the suite red (2026-06-30)

**Why this cycle exists (the prompt's own diagnostic).** Cycle 16 closed the mutation
criterion but left **criterion #6 (full suite green, deterministic) UNMET**: the full
workspace run had **2 red tests** — `packages/ui` `theme-css.test.ts` drift — which cycle 16
flagged as "pre-existing, out-of-scope" and deliberately did not fix. This re-run's prompt
makes "full suite green" a hard criterion and rule #1 says *strengthen the code, not the test*,
so the red suite was the single genuine frontier. This is the prompt's **"a new code change
introduced it since last run"** branch: the IndoPak/translation commits added the drift tests,
and the repo's missing line-ending config made them platform-flaky.

**Root cause (and a correction to cycle 16).** Cycle 16 *guessed* the drift was prettier
trailing-whitespace. **That guess was wrong.** Reproduced and traced properly this time:

- `git ls-files --eol` → `i/lf  w/crlf  attr/` for both CSS files: **LF in the repo index,
  CRLF in the Windows working tree, no attribute**.
- `core.autocrlf=true` (Windows default) + **no `.gitattributes`** ⇒ git rewrites the
  LF-committed `noor-themes.css`/`noor-tokens.css` to **CRLF on checkout**.
- The drift test does a byte-exact `expect(read(css)).toBe(renderThemesCss())`; the generator
  emits **LF** ⇒ CRLF (file) ≠ LF (generator) ⇒ fail. **Green in CI (Linux/LF), red only on
  Windows** = a cross-platform determinism flake, exactly what criterion #6 forbids.

**Fix (root cause, no test weakened).** Added a repo-root **`.gitattributes`**:

```
* text=auto eol=lf      # + explicit binary markers for png/jpg/woff/ttf/mp3/…
```

then re-checked-out the two CSS files so the working tree is LF. The drift test now compares
LF-to-LF and passes. **Not** fixed by normalising line endings inside the test (which would
blind it to a genuine CRLF mistake) and **not** by hand-editing the generated CSS (ADR 0027
forbids it) — the generator and committed files were always correct; the repo just lacked the
line-ending policy every cross-platform JS/TS repo needs.

**Safety / blast radius checked.** No `.bat`/`.cmd`/`.ps1` files exist (nothing wants CRLF);
prettier already defaults to LF; the index is already all-LF so there is **no renormalisation
diff**. After the fix `git status` shows only the new `.gitattributes` — **not** a mass-modify
of the 670 other CRLF working-tree files (git normalises them against the LF index, so they
stay clean). The only committed change is `.gitattributes`.

**Result.** Full workspace **804/804 green, exit 0**, all coverage gates met (was 802/2 in
cycle 16). `packages/ui` 9/9. Fresh-seed property confirmation clean (seed 9227465). Criterion
#6 is now genuinely satisfied on a Windows checkout, not just in CI.

### CI recommendation (addition)
- **Keep the `.gitattributes`** and consider a CI check that asserts tracked text files are LF
  (e.g. `git ls-files --eol | grep -v 'w/lf' | grep -v binary` is empty) so a CRLF file can't
  be committed and re-introduce this class.

### Residual after cycle 17
Unchanged from cycle 16 (all low-severity, tracked): the ~226 mutation **logic survivors**
(priority: `islamic-events` 57%, `search` 55%) and the ~287 **content-table survivors** (one
integrity test per table), plus the justified equivalent mutants. The CRLF class is now closed
repo-wide. A further re-run resumes here and exits after one clean confirmation unless new code
lands.

---

## Cycle 18 — drove the two priority logic-survivor modules to ~95–97% (2026-06-30)

**Frontier.** With criteria #1–2 and #4–6 met and #3 at 80.72% aggregate, the legitimate
non-redundant frontier (per THE LOOP: "pick the items with the lowest surviving mutants; keep
attacking while the score is still rising") was the two cycle-17-documented priority modules
with **real logic survivors** — not content tables. Used the persisted cycle-16 Stryker log to
target their exact survivors, so no re-scan.

### `search.ts` — 54.79% → **97.26%** (31 survivors killed; +5 tests)
The verse-ranking algorithm was executed but barely asserted. Pinned, with exact scores:

- **Arabic normalization rules** (`normalizeForSearch`) — each substitution pinned: tatweel is
  dropped (not replaced with junk), `ى→ي`, `ة→ه`. (Kills the `.replace(...)` StringLiteral mutants.)
- **Word-boundary bonus** (`:43`) — a boundary hit ("light") scores **2**, a mid-word substring
  ("light" inside "delight") scores **1**. Kills the `if(true)`/`if(false)`/empty-regex mutants
  that the old "finds by token" tests left unconstrained.
- **Whole-phrase bonus + multi-token guard** (`:45`) — a contiguous "patience light" scores **6**,
  scattered tokens **4**, and a *single*-token query gets **no** bonus (2, not 3). Kills the
  `&&`/`||`, `>1`→`>=1`/`<=1`, `if(true/false)`, and `+=`→`-=` mutants.
- **Sort + tie-break comparators** (`:72`, `:94`–`:95`) — `searchText` sorts score-desc and
  honours the limit; `searchVerses` breaks ties by sura→aya→source (a golden ordering of
  same-score rows). Kills the no-sort / `()=>undefined` / `+`-instead-of-`-` / `||`→`&&` mutants.

**2 survivors remain, both justified:** `:51` `/\s+/`→`/\s/` is **equivalent** (the following
`filter(Boolean)` collapses the empty tokens either way); `:101` `escapeRegExp` replacement→`""`
only changes the word-boundary bonus for a token containing a regex metacharacter, which must
already pass the `indexOf` literal-substring gate to matter — a low-value edge.

### `islamic-events.ts` — 57.41% → **95.37%** (41 survivors killed; +3 tests)
The 13 arithmetic survivors were all in the Gregorian→**Julian-Day-Number** `dayNumber()`
helper. Root insight: `dayNumber` is consumed **only as a difference** (`daysUntil =
dn(event) − dn(today)`), and **every existing `daysUntil` assertion compared two dates in the
same Gregorian month/year**, so all the month/year terms cancelled and the operator flips
survived. Fixes:

- **Event-roster integrity** — exact id list + non-empty `name`/`note` kills the 33 content
  StringLiteral survivors.
- **Two golden full-year resolutions** — `upcomingIslamicEvents` pinned to exact Gregorian dates
  **and** `daysUntil` for all 14 events, from a **June** `today` (events span Jun 2026→Jun 2027)
  *and* from a **December** `today` (a different Julian-day month-term parity). The June anchor
  kills the `a`/`y`/`m`-dependent flips; the December anchor additionally kills the
  `floor((153m±2)/5)` flip the June anchor left cancelling. Golden values were generated from the
  real `hijri.ts` conversion and are regenerable from the two fixed `today`s.

**5 survivors remain, all justified as constant-offset equivalents of a difference-only function:**
`:75` `+4800`→`−4800` shifts `y` by exactly **−9600**, which is divisible by 4, 100 **and** 400,
so every `365*y`/`floor(y/…)` term shifts by a constant and the difference is unchanged; the
`−32045` constant flip is a pure offset; and the `floor(y/4|100|400)` flips are constant across
any span shorter than 4/100/400 Gregorian years, while `upcomingIslamicEvents` only ever resolves
≤13 months ahead. These are genuine equivalents for every reachable input, not hand-waving.

### Result
Full workspace **812/812 green, exit 0** (804→812), all coverage gates met. Fresh-seed property
confirmation clean (seed 14930352). Two of the lowest-mutation modules are now ~95–97%, lifting
the **projected core aggregate ≈80.72% → ≈85.9%**.

### Residual after cycle 18 (prioritised)
- **Logic survivors** still open in `achievements` (42.6%), `hijri` (78.4%), `reminders` (67.1%),
  `fasting-qada` (75.4%), `hadith` (73.5%), `translations` (76.5%), `reading-plans` (81.9%),
  `backup` (79.4%) — the same pattern (pin exact behaviour, not just execute). `achievements` (70
  survivors) is the next-highest-value target.
- **Content-table survivors** in `languages` (29.5%) and the remaining tables — mechanical
  integrity tests.
- All justified equivalents recorded above. A re-run resumes here; the remaining survivors need
  test additions, not bug fixes.

---

## Cycle 19 — three more low-mutation modules to 93–100% (2026-06-30)

**Frontier.** Continued THE LOOP on the lowest-surviving-mutant modules named in the cycle-18
residual. Triaged each by survivor type from the persisted cycle-16 log before writing a line:
`achievements` (70 survivors, **all StringLiteral** → content), `languages` (55, **near-all
content**), `fasting-qada` (14, **all logic**).

- **`achievements.ts` 42.62% → 100%** (70 killed; +3 tests). The badge-unlock *logic* was already
  pinned; the gap was the `BADGES` data table. Pinned the exact `[id, metric, target, category]`
  tuple for all 13 badges — `metric` indexes `stats[badge.metric]`, so a blanked metric silently
  makes a badge **never unlock** (behaviourally load-bearing, not just copy) — plus non-empty
  glyph/name/description and "every metric is a real `BadgeStats` key". **0 survivors.**
- **`languages.ts` 29.49% → 98.72%** (54 killed; +4 tests). Pinned the ISO-639 code set, non-empty
  English+endonym per entry, representative mappings, and the title-case fallback. **1 survivor,
  equivalent:** `titleCase`'s `if (!code) return code` — `"".charAt(0).toUpperCase()` is already
  `""`, so removing the empty-guard yields the same output.
- **`fasting-qada.ts` 75.44% → 92.98%** (10 killed; +5 tests). Pinned: `EMPTY === {madeUp:0}`; a
  4-part string with a valid Ramaḍān prefix is rejected (the `parts.length` guard); fractional
  year/month/day rejected; a single-day pause (`span === 0`) is **counted** (pins `span < 0` vs a
  `<= 0` regression that would silently drop every one-day pause); an absurd >1000-day range is
  skipped. **4 survivors, all justified** — defensive-guard equivalents at the `:52` span check:
  the bounded loop `for (i=0; i<=span; i++)` already produces the correct empty result for
  NaN/negative spans, so removing or weakening the pre-check changes only performance/safety on
  pathological corrupt input, not output; the `>`-vs-`>=` bound differs only at an exact 1000-day span.

### Result
Full workspace **824/824 green, exit 0** (812→824), all coverage gates met. Fresh-seed property
confirmation clean (seed 24157817). The **eight** lowest-scoring core modules
(zakat/tasbih/prayer/search/islamic-events/achievements/languages/fasting-qada) are now all
**93–100%**, lifting the **projected core aggregate ≈85.9% → ≈89.9%** (≈80.72% at the cycle-16
baseline → ~90% now).

### Residual after cycle 19 (prioritised)
- **Logic survivors** still open in `hijri` (78.4%), `reminders` (67.1% — 12 content + 11 logic),
  `hadith` (73.5%), `translations` (76.5%), `reading-plans` (81.9%), `backup` (79.4%). Each is the
  same exercise (pin behaviour). `reminders` is the next-lowest.
- Justified equivalents recorded above (languages titleCase guard; fasting-qada span guards;
  islamic-events JDN; zakat sumValues; search `/\s+/`).
- A re-run resumes here; the remaining survivors need test additions, not bug fixes. The aggregate
  is now ~90% — comfortably above the 80% target with a clear, shrinking tail.

---

## Cycle 20 — reminders + hadith to ~91–96% (2026-06-30)

**Frontier.** The two next-lowest modules from the cycle-19 residual, triaged by survivor type.

- **`reminders.ts` 67.14% → 91.43%** (+6 tests). A notifier-orchestration module; the existing
  tests asserted only `scheduled.has(id)`, never the **payload** or the **enabled-but-permission-
  denied** path. Added (mocking the `Notifier` port): adhkar + prayer schedule **nothing** when
  enabled but permission is denied, and prayer schedules nothing without a location; **exact
  payloads** (title/body/tag/at) for morning *and* evening adhkar and a prayer — which pins the
  `ADHKAR_LABEL`/`ADHKAR_EMOJI` tables (the evening-only test had left the **morning** row
  unexercised, a clean missed kill caught by re-measuring) and the inline copy; pinned the
  exported constants/id-helpers. **6 survivors, justified:** 5 in `localDateStr` (local-time
  `getFullYear`/`getMonth()+1`/`getDate`/`padStart`) — deliberately **not** pinned, because its
  only observable is the **timezone-dependent** plan title, and a TZ-coupled assertion would
  reintroduce the exact cross-platform flake fixed in cycle 17; plus 1 `if (!next)` edge.
- **`hadith.ts` 73.47% → 95.92%** (+5 tests). Grade-string parsing + label table. Added: the
  optional-hyphen al-Albānī regex (`Alalbani` with no hyphen still wins over a daif first grade); a
  bare grade with no `Grader: ` prefix; a grader **name** containing a grade word (`Daifullah:
  Sahih` → `sahih`, not `daif`) pinning that only the part after `": "` is classified; an
  unrecognised word → `unknown` (reaches the final `return`, killing `if (true)`/`return ""`); and
  the exact `HADITH_GRADE_LABEL`. **2 survivors, justified:** the `:31` slice-offset flips
  (`indexOf("")→0`, `slice +2→-2`) are near-equivalent — the final
  `.toLowerCase().replace(/[^a-z]/g,"").includes(keyword)` is robust to a few extra leading chars.

### Result
Full workspace **835/835 green, exit 0** (824→835), all coverage gates met. Fresh-seed property
confirmation clean (seed 39088169). **Ten** formerly-weak modules are now **88–100%**, lifting the
**projected core aggregate ≈89.9% → ≈90.8%** (crossed 90%).

### Residual after cycle 20 (prioritised)
- Remaining tail: `translations` (76.5%), `hijri` (78.4%), `backup` (79.4%), `reading-plans`
  (81.9%) — all already near/above 80%; same pin-the-behaviour exercise.
- Justified equivalents accumulated across cycles (reminders `localDateStr` TZ-display; hadith
  slice-offsets; languages titleCase; fasting-qada span guards; islamic-events JDN; zakat
  `sumValues`; search `/\s+/`). All are local-display, defensive-guard, or constant-offset
  equivalents — none affects a reachable first-party output.
- A re-run resumes here; the remaining survivors need test additions, not bug fixes.

---

## E2E pass — Playwright browser suite (2026-06-30, prompted by the qaskills.sh review)

Exercised the **browser-level** QA dimension that cycles 0–20 did not (they were unit/mutation/
property at the `core` level). Ran the repo's own Playwright suite (`pnpm test:e2e`) — its own
config + dev server, **no third-party tooling** (the qaskills.sh `npx @qaskills/cli` installer was
**declined**: it executes an unknown third-party package, and the skills it adds are tools this
repo either already has — Vitest/Playwright/coverage — or doesn't use).

**Result: 14/14 specs passed, exit 0, 3.2 min (Chromium).** Coverage: adhkar, bookmarks, hijri
calendar, geolocation→prayer-times + qibla, hadith, hifz (add→due→rate), home-nav, reader display
modes, reader/reciters, save-collection, search, settings backup export+import, tasbih. The dev
server cold-started with a few `ECONNRESET`/timeout retries (Playwright polling while Next.js
booted) then recovered — no flakes this run. Logged in `TRIED.jsonl` (`E2E-PLAYWRIGHT-RUN`).

## Lighthouse audit — web perf/a11y/SEO (2026-06-30)

Ran the **Lighthouse** skill (the directory's #11) properly: `pnpm --filter @ummahlibrary/web build`
(the working single-package build) → `next start` → official Google `lighthouse@12` (via `npx`,
**not** `@qaskills/cli`) driving the Playwright Chromium, desktop preset, home page.

**Scores: Performance 98 · Accessibility 96 · Best-Practices 100 · SEO 91.** Metrics: FCP 0.5 s,
LCP 0.9 s, TBT 0 ms, CLS 0.072, Speed Index 0.5 s — strong across the board.

**Two actionable findings (reported, NOT auto-fixed — both are design/content calls):**

1. **[a11y, systemic] Colour-contrast fails WCAG AA on 17 nodes.** The `--noor-faint` token
   (`#5c6273`) on the dark-theme backgrounds (`#0a0b0f`/`#0e1017`/`#14171f`) yields ~**2.94–3.23:1**
   for the small (11–12.5 px) uppercase section labels — below the **4.5:1** AA needs for text that
   size. It's a **single-source fix** in `packages/ui` themes (`themes.ts`, ADR 0023/0027), but
   changing a palette token alters the visual design app-wide, so it's the maintainer's call (the
   design-parity process is deliberate) — flagged, not changed.
2. **[SEO/a11y] Non-descriptive link text.** The `/settings` link reads just "More" — give it an
   `aria-label`/clearer text. Minor; left as a content decision.

Logged in `TRIED.jsonl` (`LIGHTHOUSE-WEB-AUDIT`). The HTML report was handed to the maintainer.
This audit covers the web perf/a11y/SEO dimension that the core-focused cycles 0–20 did not.

**All-routes follow-up (29 distinct route types, desktop):** averages **Perf 98 · A11y 90 ·
Best-Practices 100 · SEO 92**; Best-Practices is **100 on every route**. Lowest perf: `/hadith`
82, `/` and `/surah/2` 89 (large DOM / long lists). The audit confirmed the a11y issues are
**systemic (shared components), not page-specific** — five distinct findings:

| Finding | Routes hit | What |
| --- | --- | --- |
| `color-contrast` | **29/29** | the `--noor-faint` token (above) |
| `link-text` | 27/29 | non-descriptive links (e.g. "More") — shared nav |
| `button-name` | 23/29 | icon-only buttons missing an accessible name |
| `label-content-name-mismatch` | 5/29 | visible label ≠ accessible name |
| `select-name` | 2/29 | `<select>` without an associated label |

Because these live in shared nav/header/button components (`packages/ui` + the web shell), a
handful of component fixes would lift accessibility across **all** routes. Reported, not
auto-fixed (a11y-label + design-token changes are the maintainer's call). Logged in `TRIED.jsonl`
(`LIGHTHOUSE-ALL-ROUTES`).
