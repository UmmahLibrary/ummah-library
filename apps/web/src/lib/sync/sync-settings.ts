/**
 * Sync enablement and the recovery secret, persisted on this device (#25, ADR 0033).
 * The secret is the user's master key; it lives in `localStorage` like the rest of
 * the local-first data — the device is already the trust boundary (on-device data
 * is plaintext anyway; the E2EE protects data in transit and at rest on the server).
 * These keys live under `ul.sync.*`, which sync itself never syncs.
 */
import { getItem, removeItem, setItem } from "./storage";

const SECRET_KEY = "ul.sync.secret";
const ENABLED_KEY = "ul.sync.enabled";

/** The stored recovery secret on this device, or `null` if sync was never set up. */
export function readSyncSecret(): string | null {
  return getItem(SECRET_KEY);
}

/** Whether sync is on AND a secret is present to drive it. */
export function isSyncEnabled(): boolean {
  return getItem(ENABLED_KEY) === "1" && getItem(SECRET_KEY) !== null;
}

/** Turn sync on with a recovery secret (kept on this device). */
export function enableSync(secret: string): void {
  setItem(SECRET_KEY, secret);
  setItem(ENABLED_KEY, "1");
}

/** Turn sync off and forget the secret on this device. */
export function disableSync(): void {
  removeItem(SECRET_KEY);
  removeItem(ENABLED_KEY);
}
