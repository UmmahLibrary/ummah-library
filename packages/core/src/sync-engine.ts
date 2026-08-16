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

/** Max entries pushed per exchange — keeps each request under the server's cap (ADR 0035). */
const PUSH_CHUNK = 500;

/** What one {@link runSync} round did — for the status UI and tests. */
export interface SyncOutcome {
  /** Entries pushed across all pages this round. */
  pushed: number;
  /** Entries the server returned (the delta, summed across pages). */
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
 * Run one sync round (ADR 0033/0034/0035). Reads every managed key, encrypts it,
 * then pushes the **dirty** entries in pages and pulls only the server delta newer
 * than this device's **cursor** — so a round is O(changed), not O(total), and a set
 * larger than the server cap still syncs (paged). Applies each entry the remote
 * side won — skipping ids this build doesn't manage and anything that fails to
 * decrypt (foreign/corrupt) — so a bad record can never clobber good local data.
 *
 * Backward-compatible: a store that implements neither `getCursor` nor `dirty`
 * pushes everything against cursor 0, i.e. the v2 whole-set behaviour.
 */
export async function runSync(deps: SyncDeps): Promise<SyncOutcome> {
  const { cipher, backend, state } = deps;

  const records = await state.all();
  const keyById = new Map<string, string>();
  const localById = new Map<string, SyncEntry>(); // every real local entry — drives merge
  const toPush: SyncEntry[] = []; // only the dirty ones — what we actually upload
  const pushedKeys: string[] = [];
  for (const r of records) {
    const id = await cipher.entryId(r.key);
    keyById.set(id, r.key); // map every managed key so incoming ids resolve…
    // …but a key this device never set — absent at the zero clock — carries no
    // information; skipping it stops a fresh device flooding the exchange with
    // meaningless tombstones.
    if (r.value === null && r.hlc.millis === 0 && r.hlc.counter === 0) continue;
    const entry: SyncEntry =
      r.value === null
        ? { id, hlc: r.hlc, ciphertext: null, nonce: "" }
        : { id, hlc: r.hlc, ...(await cipher.encrypt(r.value)) };
    localById.set(id, entry);
    if (r.dirty ?? true) {
      toPush.push(entry);
      pushedKeys.push(r.key);
    }
  }

  const accountId = await cipher.accountId();
  let cursor = (await state.getCursor?.()) ?? 0;

  const apply = async (entry: SyncEntry): Promise<boolean> => {
    let key = keyById.get(entry.id);
    if (entry.ciphertext === null) {
      if (key === undefined) return false; // unknown tombstone — nothing we ever had
      await state.apply(key, null, entry.hlc);
      return true;
    }
    const plaintext = await cipher.decrypt(entry.ciphertext, entry.nonce);
    if (plaintext === null) return false; // foreign or corrupt — never clobber local
    if (key === undefined) {
      // An element first created on another device — resolve it from its
      // self-describing payload (ADR 0034) so discovery completes this round.
      key = state.identify?.(plaintext) ?? undefined;
      if (key === undefined) return false;
    }
    await state.apply(key, plaintext, entry.hlc);
    return true;
  };

  let pushed = 0;
  let pulled = 0;
  let applied = 0;
  let offset = 0;
  // Push dirty entries in pages and pull the delta until everything is sent and the
  // server has no further pages. Always runs once (a caught-up device still pulls).
  for (;;) {
    const page = toPush.slice(offset, offset + PUSH_CHUNK);
    offset += page.length;
    const result = await backend.exchange(accountId, page, cursor);
    pushed += page.length;
    pulled += result.entries.length;
    if (result.cursor !== undefined) cursor = result.cursor;
    const { incoming } = mergeEntries([...localById.values()], result.entries);
    for (const entry of incoming) {
      if (await apply(entry)) {
        applied++;
        localById.set(entry.id, entry); // reflect the winner for later pages
      }
    }
    if (offset >= toPush.length && !result.more) break;
  }

  await state.setCursor?.(cursor);
  if (pushedKeys.length > 0) await state.markPushed?.(pushedKeys);

  return { pushed, pulled, applied };
}
