/**
 * Sync enablement and the recovery secret, persisted on this device (#25, ADR
 * 0033/§5 at-rest hardening). The secret is the user's master key, so — unlike
 * the rest of the local-first data — it's kept in `expo-secure-store`
 * (iOS Keychain / Android Keystore-backed) rather than plain AsyncStorage; the
 * on/off flag is a non-secret boolean and stays in regular storage. These keys
 * live under `ul.sync.*`, which sync itself never syncs.
 */
import * as SecureStore from "expo-secure-store";
import { getItem, removeItem, setItem } from "./storage";

const SECRET_KEY = "ul.sync.secret";
const ENABLED_KEY = "ul.sync.enabled";

async function readSecureSecret(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECRET_KEY);
  } catch {
    return null; // SecureStore unavailable — fall through to the legacy check below
  }
}

async function writeSecureSecret(secret: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECRET_KEY, secret);
  } catch {
    /* SecureStore unavailable on this device */
  }
}

/**
 * The stored recovery secret on this device, or `null` if sync was never set up.
 * A pre-hardening install kept the secret in plain AsyncStorage; if it's still
 * there (and the Keychain/Keystore doesn't have it yet), migrate it in place so
 * an app update never looks like sync silently turned off.
 */
export async function readSyncSecret(): Promise<string | null> {
  const secure = await readSecureSecret();
  if (secure !== null) return secure;
  const legacy = await getItem(SECRET_KEY);
  if (legacy === null) return null;
  await writeSecureSecret(legacy);
  await removeItem(SECRET_KEY);
  return legacy;
}

/** Whether sync is on AND a secret is present to drive it. */
export async function isSyncEnabled(): Promise<boolean> {
  const [enabled, secret] = await Promise.all([getItem(ENABLED_KEY), readSyncSecret()]);
  return enabled === "1" && secret !== null;
}

/** Turn sync on with a recovery secret (kept on this device). */
export async function enableSync(secret: string): Promise<void> {
  await writeSecureSecret(secret);
  await setItem(ENABLED_KEY, "1");
}

/** Turn sync off and forget the secret on this device. */
export async function disableSync(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECRET_KEY);
  } catch {
    /* nothing to remove */
  }
  await removeItem(SECRET_KEY); // in case a legacy plaintext copy was never migrated
  await removeItem(ENABLED_KEY);
}
