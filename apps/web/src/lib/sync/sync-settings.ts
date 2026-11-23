/**
 * Sync enablement and the recovery secret, persisted on this device (#25, ADR
 * 0033/§5 at-rest hardening). The on/off flag is non-secret and stays a plain
 * `localStorage` string; the secret itself is wrapped with a non-extractable
 * IndexedDB-backed key (`secret-vault-store.ts`) before it touches `localStorage`, so
 * the stored value alone is ciphertext, not the master key. These keys live
 * under `ul.sync.*`, which sync itself never syncs.
 */
import { isWrappedSecret, unwrapSecret, wrapSecret } from "./secret-vault-store";
import { getItem, removeItem, setItem } from "./storage";

const SECRET_KEY = "ul.sync.secret";
const ENABLED_KEY = "ul.sync.enabled";

/**
 * The stored recovery secret on this device, or `null` if sync was never set up.
 * A pre-hardening install (or a wrap that degraded to plaintext, e.g. IndexedDB
 * blocked in private mode) leaves a plain value here; it's returned as-is and
 * opportunistically upgraded in place. A value that looks wrapped but fails to
 * unwrap (corrupted, or a coincidentally blob-shaped custom secret) is treated
 * the same way rather than surfacing as "sync is off" — silently discarding a
 * secret is worse than a redundant re-wrap.
 */
export async function readSyncSecret(): Promise<string | null> {
  const raw = getItem(SECRET_KEY);
  if (raw === null) return null;
  if (isWrappedSecret(raw)) {
    const unwrapped = await unwrapSecret(raw);
    if (unwrapped !== null) return unwrapped;
  }
  const wrapped = await wrapSecret(raw);
  if (wrapped !== raw) setItem(SECRET_KEY, wrapped);
  return raw;
}

/** Whether sync is on AND a secret is present to drive it. */
export async function isSyncEnabled(): Promise<boolean> {
  return getItem(ENABLED_KEY) === "1" && getItem(SECRET_KEY) !== null;
}

/** Turn sync on with a recovery secret (kept on this device, wrapped at rest). */
export async function enableSync(secret: string): Promise<void> {
  setItem(SECRET_KEY, await wrapSecret(secret));
  setItem(ENABLED_KEY, "1");
}

/** Turn sync off and forget the secret on this device. */
export function disableSync(): void {
  removeItem(SECRET_KEY);
  removeItem(ENABLED_KEY);
}
