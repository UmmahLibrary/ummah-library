# ADR 0033 — Cross-device sync: opt-in, end-to-end-encrypted, zero-PII

- **Status:** Accepted
- **Date:** 2026-06-23
- **Amends:** [ADR 0003](0003-static-first-delivery.md), [ADR 0006](0006-local-first-persistence.md)

## Context

User state is local-first ([0006](0006-local-first-persistence.md)): bookmarks,
hifz progress, reading plans/goals, the prayer tracker, qaḍāʾ and ḥayḍ logs,
tasbih, preferences — all under `ul.*` keys on one device, with no account and no
backend. The deliberate substitute for cross-device has been manual file
export/import ([0018](0018-local-data-backup.md)).

The recurring, unmet ask is real cross-device continuity: the app now ships on
**web, Android, and a browser extension**, and progress on one device is
invisible on another. A second device (or a reinstall) starts blank. This is the
Phase 4 item tracked as **#25**.

Every store was deliberately put behind a typed port for exactly this
([0024](0024-local-storage-ports.md)), lint-enforced
([0028](0028-persistence-enforcement.md)): "when sync lands (#25), swap the
storage primitive, not the feature code." So the question this ADR settles is
**not** "how do we refactor for sync" — it is the **trust, identity, and hosting**
model, the one thing 0024 explicitly deferred.

The data is unusually sensitive: memorization, prayer adherence, and a
**menstruation log**. The project's stance is to hold as little user data, and as
little PII, as possible. Three forces therefore dominate the decision:
**keep local-first the default** (no account required, fully offline), **the
server must never see plaintext**, and **store no identifiers**.

## Decision

**Add opt-in, end-to-end-encrypted, zero-PII sync as an adapter under the
existing store ports. Off by default; the app is unchanged for anyone who never
enables it.**

**1. Identity is a recovery phrase, not an account.** Enabling sync generates a
high-entropy secret (a recovery code; BIP39 words are a later polish). A KDF
derives two independent values from it:

- `accountId = HKDF(secret, "account-id")` — the opaque key the server stores
  under. It identifies a blob, not a person; no email, no login, no PII.
- `dataKey = HKDF(secret, "data-key")` — an AES-256-GCM key that **never leaves
  the device**.

A second device enables sync by entering the same phrase. There is no password
reset by design: lose the phrase and the ciphertext is unrecoverable — but the
local copy on each device is untouched, and file backup ([0018](0018-local-data-backup.md))
remains the offline escape hatch (it was always the "seed/migration path" for #25).

**2. End-to-end encrypted; the server is a dumb ciphertext box.** Each `ul.*` key
syncs as `{ id = HMAC(dataKey, keyName), hlc, ciphertext, nonce }`. The entry id
is a keyed hash of the key name, so the server cannot even learn **which**
features a user uses (e.g. that a ḥayḍ log exists), let alone their contents. The
server stores `accountId → entries` and merges by the supplied clock; it holds
nothing it can read.

**3. Conflict resolution is pure `core`.** Sync is one user across a few devices,
rarely editing concurrently — the easy case. Per-key **last-writer-wins** keyed
by a **Hybrid Logical Clock** converges. The HLC and the merge are pure and
unit-tested in `core/sync.ts`; the orchestration (`core/sync-engine.ts`) follows
the `reminders.ts` idiom — every external concern (`Cipher`, `SyncBackend`, the
local state store) is an injected port and the clock is a parameter, so web,
mobile, and extension share one engine behind their own adapters. **Element-level
merge** for set/map keys (bookmarks, hifz, the logs) is a later refinement;
whole-key LWW ships first.

**4. Crypto and transport are adapters.** `core` defines `Cipher` (derive keys,
encrypt/decrypt, entry-id) and `SyncBackend` (exchange entries) as ports and
stays free of any crypto or I/O. The web/extension implement `Cipher` with
WebCrypto; mobile gets a native one. The server endpoint
(`/api/sync`) persists ciphertext to **Upstash Redis** over its REST API (no SDK
dependency) behind a small injectable store, reusing the same pure `mergeEntries`.

**5. The secret rests on the device; sync runs in the background.** Once enabled,
the recovery phrase is stored in `localStorage` (under `ul.sync.*`, which sync never
syncs) so sync survives reloads without re-entry. This matches the local-first trust
model: the device is already the trust boundary — every `ul.*` value is plaintext on
it — so the secret resting beside that data adds no on-device exposure the data
didn't already have. The E2EE protects data **in transit and on the server**, not
against someone holding the unlocked device. (Hardening the at-rest secret — e.g. a
non-extractable WebCrypto key in IndexedDB — is a later option.) The Settings section
(`SyncSettings`) generates, reveals, and tears down the phrase; an app-wide
`SyncBootstrap` syncs on load and when the tab regains focus.

## Consequences

- **Good:** true multi-device continuity while keeping the local-first promise —
  no account, fully offline, opt-in. Because of 0024/0028 it is an **adapter, not
  a rewrite**: the feature logic and UI are untouched. The privacy posture is as
  strong as it was with no backend at all: the server holds opaque, unlabelled
  ciphertext under identifiers that name no one.
- **Cost — this is the architectural change.** It ends the "no runtime user
  state" property of [0003](0003-static-first-delivery.md) and the "no backend" of
  [0006](0006-local-first-persistence.md): a stateful endpoint plus a datastore
  now exist (small, but real ops, cost, and an abuse surface — rate-limit per
  `accountId`/IP and cap entry size). The reader/static pages are unaffected.
- **`accountId` is a bearer capability.** Anyone holding it can read or overwrite
  that account's (encrypted) blob, so it travels only over HTTPS and is never
  logged. It cannot decrypt anything.
- **Recovery is the user's.** E2EE means the maintainer **cannot** help a user who
  loses their phrase — the explicit trade for zero-knowledge. The backup file is
  the net.
- **Landed since:** the pure engine + web crypto/transport/server seams, wiring over
  the live `ul.*` stores, the managed-key fan-out (reader/prayer settings, last-read
  position), the recovery-phrase Settings UI with background sync, and the **mobile
  adapter** — a pure-JS (`@noble/hashes`+`@noble/ciphers`) `Cipher` that is byte-for-byte
  compatible with the web WebCrypto one (PBKDF2→HKDF→AES-256-GCM/HMAC, including the
  64-byte HMAC key WebCrypto derives by default; a cross-platform interop test pins it),
  an AsyncStorage `SyncStateStore` + clock sidecar, and a "Sync across devices" Settings
  screen that syncs on launch and on foreground (`AppState`). The managed-key set now
  lives in `core` (`sync-keys.ts`) as the single shared contract across platforms.
  The **browser extension** also syncs now: it reuses the web WebCrypto `Cipher`
  scheme, bridges the two prefs it shares with the contract (`ul.theme`,
  `ul.hijriAdjust`) to its own `chrome.storage` layout + value formats, keeps the
  recovery secret device-local in `chrome.storage.local`, and a compact popup panel
  drives it; `/api/sync` answers a CORS preflight so the `chrome-extension://` popup's
  authenticated POST can reach it.
- **Deferred:** Upstash provisioning + deploy; a **live in-app/in-tab refresh** after a
  synced value is applied (today a pulled change surfaces on the next read/navigation
  or app relaunch — the in-memory React contexts re-read on mount, not on a sync event;
  true on web, mobile, and the extension alike); and the v2 refinements (element-level
  merge for set/map keys, atomic server merge under concurrent push, an incremental
  pull cursor).
