/**
 * Extension implementation of the core {@link Cipher} port (#25, ADR 0033). The
 * extension popup runs in a browser context with WebCrypto, so this is the same
 * scheme as the web app's `web-crypto-cipher.ts` — PBKDF2 → HKDF → AES-256-GCM,
 * with keyed-hash account/entry ids — kept identical so a recovery phrase set up on
 * the web (or mobile) derives the same account here and the ciphertext interops.
 * (Apps can't import each other, so the implementation is duplicated; the shared
 * cross-platform interop vectors in the test pin it against the web/mobile output.)
 * The `dataKey` never leaves the device.
 */
import type { Cipher } from "@ummahlibrary/core";

const ENC = new TextEncoder();
const DEC = new TextDecoder();

const PBKDF2_SALT = ENC.encode("ummah-library/sync/v1");
const PBKDF2_ITERATIONS = 210_000;

const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const RECOVERY_GROUPS = 5;
const RECOVERY_GROUP_LEN = 5;

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

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

/**
 * Canonical form of a recovery secret used for key derivation: NFKC-normalized,
 * upper-cased, with every non-alphanumeric stripped — so the same logical code
 * typed with different case, spacing or hyphenation derives the SAME account.
 */
export function canonicalizeRecoverySecret(secret: string): string {
  return secret.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** A fresh, high-entropy recovery code (~120 bits), grouped for easy transcription. */
export function generateRecoveryPhrase(): string {
  const n = RECOVERY_GROUPS * RECOVERY_GROUP_LEN;
  const rnd = crypto.getRandomValues(new Uint8Array(n));
  let out = "";
  for (let i = 0; i < n; i++) {
    if (i > 0 && i % RECOVERY_GROUP_LEN === 0) out += "-";
    out += RECOVERY_ALPHABET[rnd[i]! % RECOVERY_ALPHABET.length]!;
  }
  return out;
}

async function deriveRoot(secret: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ENC.encode(secret), "PBKDF2", false, [
    "deriveBits",
  ]);
  const rootBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: PBKDF2_SALT, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    256,
  );
  return crypto.subtle.importKey("raw", rootBits, "HKDF", false, ["deriveBits", "deriveKey"]);
}

function hkdf(info: string): HkdfParams {
  return { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: ENC.encode(info) };
}

/**
 * Build an unlocked {@link Cipher} from a recovery secret. Derivation is the slow
 * step (PBKDF2 by design); do it once when sync is enabled and reuse the instance.
 */
export async function createWebCryptoCipher(secret: string): Promise<Cipher> {
  const root = await deriveRoot(canonicalizeRecoverySecret(secret));
  const dataKey = await crypto.subtle.deriveKey(
    hkdf("data-key"),
    root,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const hmacKey = await crypto.subtle.deriveKey(
    hkdf("entry-id"),
    root,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const accountIdHex = toHex(
    new Uint8Array(await crypto.subtle.deriveBits(hkdf("account-id"), root, 256)),
  );

  return {
    accountId: async () => accountIdHex,
    entryId: async (keyName) =>
      toHex(new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, ENC.encode(keyName)))),
    encrypt: async (plaintext) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        dataKey,
        ENC.encode(plaintext),
      );
      return { ciphertext: toBase64(new Uint8Array(ct)), nonce: toBase64(iv) };
    },
    decrypt: async (ciphertext, nonce) => {
      try {
        const pt = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: fromBase64(nonce) },
          dataKey,
          fromBase64(ciphertext),
        );
        return DEC.decode(pt);
      } catch {
        return null; // tampered, foreign, or wrong key — never surface as a throw
      }
    },
  };
}
