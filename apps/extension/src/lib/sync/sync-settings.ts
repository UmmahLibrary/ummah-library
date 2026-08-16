/**
 * Sync enablement and the recovery secret (#25, ADR 0033), kept device-locally in
 * `chrome.storage.local` (key `sync.secret`/`sync.enabled`) — NOT `chrome.storage.sync`,
 * so the master key never rides the browser's own profile sync. The device is the
 * trust boundary (the extension's prefs are plaintext on it); the E2EE protects
 * data in transit and on the server.
 */
import { getCache, removeCache, setCache } from "../storage";

const SECRET_KEY = "sync.secret";
const ENABLED_KEY = "sync.enabled";

/** The stored recovery secret on this device, or `null` if sync was never set up. */
export async function readSyncSecret(): Promise<string | null> {
  const s = await getCache<string>(SECRET_KEY, "");
  return s ? s : null;
}

/** Whether sync is on AND a secret is present to drive it. */
export async function isSyncEnabled(): Promise<boolean> {
  const [enabled, secret] = await Promise.all([
    getCache<boolean>(ENABLED_KEY, false),
    getCache<string>(SECRET_KEY, ""),
  ]);
  return enabled === true && secret !== "";
}

/** Turn sync on with a recovery secret (kept on this device). */
export async function enableSync(secret: string): Promise<void> {
  await setCache(SECRET_KEY, secret);
  await setCache(ENABLED_KEY, true);
}

/** Turn sync off and forget the secret on this device. */
export async function disableSync(): Promise<void> {
  await removeCache(SECRET_KEY);
  await setCache(ENABLED_KEY, false);
}
