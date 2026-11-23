/**
 * Sync enablement and the recovery secret (#25, ADR 0033), kept device-locally in
 * `chrome.storage.local` (key `sync.secret`/`sync.enabled`) — NOT `chrome.storage.sync`,
 * so the master key never rides the browser's own profile sync. The secret itself is
 * wrapped with a non-extractable IndexedDB-backed key (`secret-vault-store.ts`, ADR 0033
 * §5 at-rest hardening) before it touches `chrome.storage.local`.
 */
import { isWrappedSecret, unwrapSecret, wrapSecret } from "./secret-vault-store";
import { getCache, removeCache, setCache } from "../storage";

const SECRET_KEY = "sync.secret";
const ENABLED_KEY = "sync.enabled";

/**
 * The stored recovery secret on this device, or `null` if sync was never set up.
 * A pre-hardening install (or a wrap that degraded to plaintext) leaves a plain
 * value here; it's returned as-is and opportunistically upgraded in place. A
 * value that looks wrapped but fails to unwrap is treated the same way rather
 * than surfacing as "sync is off" — silently discarding a secret is worse than
 * a redundant re-wrap.
 */
export async function readSyncSecret(): Promise<string | null> {
  const raw = await getCache<string>(SECRET_KEY, "");
  if (!raw) return null;
  if (isWrappedSecret(raw)) {
    const unwrapped = await unwrapSecret(raw);
    if (unwrapped !== null) return unwrapped;
  }
  const wrapped = await wrapSecret(raw);
  if (wrapped !== raw) await setCache(SECRET_KEY, wrapped);
  return raw;
}

/** Whether sync is on AND a secret is present to drive it. */
export async function isSyncEnabled(): Promise<boolean> {
  const [enabled, secret] = await Promise.all([
    getCache<boolean>(ENABLED_KEY, false),
    getCache<string>(SECRET_KEY, ""),
  ]);
  return enabled === true && secret !== "";
}

/** Turn sync on with a recovery secret (kept on this device, wrapped at rest). */
export async function enableSync(secret: string): Promise<void> {
  await setCache(SECRET_KEY, await wrapSecret(secret));
  await setCache(ENABLED_KEY, true);
}

/** Turn sync off and forget the secret on this device. */
export async function disableSync(): Promise<void> {
  await removeCache(SECRET_KEY);
  await setCache(ENABLED_KEY, false);
}
