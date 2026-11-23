/**
 * At-rest hardening for the recovery secret (#25, ADR 0033 §5's "later option").
 * Identical scheme to the web app's `secret-vault-store.ts` (apps can't import each
 * other): the secret is wrapped with a non-extractable AES-256-GCM key kept in
 * IndexedDB — available in the popup's page context, just like `crypto.subtle` —
 * so the value that lands in `chrome.storage.local` is ciphertext, not the
 * secret itself, and the unwrapping key can never be exported or copied out.
 *
 * This does **not** protect against script already running in this origin (an
 * XSS attacker could call `unwrapSecret` itself, same as it could read the
 * secret off a live `Cipher`) — the device is still the trust boundary (ADR
 * 0033 §5). What it raises the bar against is casual/offline exposure: reading
 * the extension's storage files directly, without code execution, no longer
 * yields the secret.
 */
const DB_NAME = "ul-sync-vault";
const STORE_NAME = "keys";
const KEY_RECORD = "wrap-key";
/** Marks a wrapped blob so a legacy (pre-hardening) plaintext secret is never mistaken for one. */
const BLOB_PREFIX = "v1:";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error as Error);
  });
}

function loadWrapKey(db: IDBDatabase): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(KEY_RECORD);
    req.onsuccess = () => resolve((req.result as CryptoKey | undefined) ?? null);
    req.onerror = () => reject(req.error as Error);
  });
}

function saveWrapKey(db: IDBDatabase, key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(key, KEY_RECORD);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error as Error);
  });
}

let cachedKey: Promise<CryptoKey> | null = null;

async function getWrapKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = (async () => {
      const db = await openDb();
      const existing = await loadWrapKey(db);
      if (existing) return existing;
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
        "encrypt",
        "decrypt",
      ]);
      await saveWrapKey(db, key);
      return key;
    })().catch((err: unknown) => {
      cachedKey = null; // don't pin a failure — a later call (or a fixed environment) can retry
      throw err;
    });
  }
  return cachedKey;
}

/** True for a value this module produced — anything else is a legacy plaintext secret. */
export function isWrappedSecret(value: string): boolean {
  return value.startsWith(BLOB_PREFIX) && value.split(":").length === 3;
}

/**
 * Wrap a secret for storage. Falls back to returning it unchanged if IndexedDB
 * or WebCrypto is unavailable — best-effort hardening, never a reason to break
 * sync setup.
 */
export async function wrapSecret(plaintext: string): Promise<string> {
  try {
    const key = await getWrapKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    );
    return `${BLOB_PREFIX}${toBase64(iv)}:${toBase64(new Uint8Array(ct))}`;
  } catch {
    return plaintext;
  }
}

/** Unwrap a blob from {@link wrapSecret}; `null` if it's corrupt, tampered, or the key is gone. */
export async function unwrapSecret(blob: string): Promise<string | null> {
  if (!isWrappedSecret(blob)) return null;
  const [, ivB64, ctB64] = blob.split(":") as [string, string, string];
  try {
    const key = await getWrapKey();
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivB64) },
      key,
      fromBase64(ctB64),
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
