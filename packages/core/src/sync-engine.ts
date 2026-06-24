/**
 * Sync orchestration (#25, ADR 0033) — the platform-neutral glue that runs one
 * sync round: encrypt the local state, exchange it with the server, then apply
 * whatever won. Mirrors `reminders.ts`: every external concern (the {@link Cipher},
 * the {@link SyncBackend}, the {@link SyncStateStore}) is an injected port, so web,
 * mobile, and the extension share this one engine behind their own adapters.
 *
 * The server never sees plaintext or key names: values are encrypted and keys are
 * replaced by `cipher.entryId(...)` before anything leaves the device. The engine
 * itself never mints clocks — new write timestamps come from the store-write path
 * (`hlcTick`); here we only read, exchange, and apply.
 */
import type { Cipher, SyncBackend, SyncStateStore } from "./ports";
import { type SyncEntry, mergeEntries } from "./sync";

/** What one {@link runSync} round did — for the status UI and tests. */
export interface SyncOutcome {
  /** Entries pushed — the keys this device has actually set (never-set keys are skipped). */
  pushed: number;
  /** Entries the server returned. */
  pulled: number;
  /** Entries actually applied to local state (remote writes that won). */
  applied: number;
}

/** Everything {@link runSync} needs, each an injected port. */
export interface SyncDeps {
  cipher: Cipher;
  backend: SyncBackend;
  state: SyncStateStore;
}

/**
 * Run one sync round. Reads every managed key, encrypts the set, exchanges it
 * with the server, and applies each entry the remote side won — skipping entries
 * this build doesn't manage and any that fail to decrypt (foreign or corrupt), so
 * a bad record can never clobber good local data.
 */
export async function runSync(deps: SyncDeps): Promise<SyncOutcome> {
  const { cipher, backend, state } = deps;

  const records = await state.all();
  const keyById = new Map<string, string>();
  const local: SyncEntry[] = [];
  for (const r of records) {
    const id = await cipher.entryId(r.key);
    keyById.set(id, r.key); // map every managed key so incoming ids resolve…
    // …but a key this device never set — absent at the zero clock — carries no
    // information. Skipping it stops a fresh device flooding the exchange with
    // meaningless tombstones (which, with distinct node ids, the other side would
    // otherwise "apply" as no-op deletes and miscount).
    if (r.value === null && r.hlc.millis === 0 && r.hlc.counter === 0) continue;
    if (r.value === null) {
      local.push({ id, hlc: r.hlc, ciphertext: null, nonce: "" });
    } else {
      const { ciphertext, nonce } = await cipher.encrypt(r.value);
      local.push({ id, hlc: r.hlc, ciphertext, nonce });
    }
  }

  const accountId = await cipher.accountId();
  const server = await backend.exchange(accountId, local);
  const { incoming } = mergeEntries(local, server);

  let applied = 0;
  for (const entry of incoming) {
    const key = keyById.get(entry.id);
    if (key === undefined) continue; // a key this build doesn't manage
    if (entry.ciphertext === null) {
      await state.apply(key, null, entry.hlc);
      applied++;
      continue;
    }
    const plaintext = await cipher.decrypt(entry.ciphertext, entry.nonce);
    if (plaintext === null) continue; // foreign or corrupt — never clobber local
    await state.apply(key, plaintext, entry.hlc);
    applied++;
  }

  return { pushed: local.length, pulled: server.length, applied };
}
