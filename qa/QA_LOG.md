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
