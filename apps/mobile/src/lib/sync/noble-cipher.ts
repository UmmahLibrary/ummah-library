/**
 * Mobile implementation of the core {@link Cipher} port (#25, ADR 0033). React
 * Native has no WebCrypto, so the same scheme as the web adapter
 * (`web-crypto-cipher.ts`) is built on the pure-JS, audited `@noble` primitives:
 * PBKDF2 → HKDF for key derivation, AES-256-GCM to seal values, HMAC-SHA-256 for
 * the server-facing entry ids. Every parameter matches the web adapter byte for
 * byte — same salt, iterations, HKDF labels, and (crucially) a 64-byte HMAC key,
 * because WebCrypto derives an HMAC key at the hash's block size when no length is
 * given — so a phrase set up on the web decrypts here and the entry ids agree.
 * A cross-platform interop test pins this against vectors from the web cipher.
 *
 * The `dataKey` never leaves the device; `decrypt` returns `null` (never throws)
 * on foreign or tampered data so a bad record can't clobber good local state.
 */
import { gcm } from "@noble/ciphers/aes.js";
import { bytesToHex, bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { Cipher } from "@ummahlibrary/core";
import { randomBytes } from "./crypto-random";

// PBKDF2 stretches the (possibly low-entropy) secret; HKDF then splits the result
// into independent sub-keys by `info` label. The salt is a fixed app/version tag.
const PBKDF2_SALT = utf8ToBytes("ummah-library/sync/v1");
const PBKDF2_ITERATIONS = 210_000;
const HKDF_SALT = new Uint8Array(0);
// WebCrypto's `deriveKey({name:"HMAC", hash:"SHA-256"})` defaults the key to the
// hash's block size (64 bytes) when no length is given. Match it exactly or the
// entry ids — and therefore which server record a key maps to — would diverge.
const HMAC_KEY_BYTES = 64;
const NONCE_BYTES = 12;

// Crockford-style alphabet: no 0/O/1/I/L/U to keep a written code unambiguous.
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const RECOVERY_GROUPS = 5;
const RECOVERY_GROUP_LEN = 5;

// Standard base64 (matches the web adapter's `btoa`/`atob` and the server). Hand
// rolled so it never depends on `btoa`/`atob`, which Hermes does not guarantee.
const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_INV = /* @__PURE__ */ (() => {
  const inv = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64_CHARS.length; i++) inv[B64_CHARS.charCodeAt(i)] = i;
  return inv;
})();

function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1]! : 0;
    const b2 = has2 ? bytes[i + 2]! : 0;
    out += B64_CHARS[b0 >> 2]!;
    out += B64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)]!;
    out += has1 ? B64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)]! : "=";
    out += has2 ? B64_CHARS[b2 & 0x3f]! : "=";
  }
  return out;
}

function fromBase64(b64: string): Uint8Array {
  let valid = 0;
  for (let i = 0; i < b64.length; i++) {
    const c = b64.charCodeAt(i);
    if (c < 256 && B64_INV[c]! >= 0) valid++;
  }
  const out = new Uint8Array((valid * 6) >> 3);
  let bits = 0;
  let nbits = 0;
  let oi = 0;
  for (let i = 0; i < b64.length; i++) {
    const c = b64.charCodeAt(i);
    const v = c < 256 ? B64_INV[c]! : -1;
    if (v < 0) continue; // skip padding/whitespace/foreign chars
    bits = (bits << 6) | v;
    nbits += 6;
    if (nbits >= 8) {
      nbits -= 8;
      out[oi++] = (bits >> nbits) & 0xff;
    }
  }
  return out;
}

/**
 * Canonical form of a recovery secret used for key derivation: NFKC-normalized,
 * upper-cased, with every non-alphanumeric stripped — so the same logical code
 * typed with different case, spacing or hyphenation derives the SAME account
 * instead of silently forking a new, empty one. Identical to the web adapter.
 */
export function canonicalizeRecoverySecret(secret: string): string {
  return secret.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** A fresh, high-entropy recovery code (~120 bits), grouped for easy transcription. */
export function generateRecoveryPhrase(): string {
  const n = RECOVERY_GROUPS * RECOVERY_GROUP_LEN;
  const rnd = randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) {
    if (i > 0 && i % RECOVERY_GROUP_LEN === 0) out += "-";
    out += RECOVERY_ALPHABET[rnd[i]! % RECOVERY_ALPHABET.length]!;
  }
  return out;
}

/**
 * Build an unlocked {@link Cipher} from a recovery secret. Derivation is the slow
 * step (210k PBKDF2 rounds, by design). `pbkdf2Async` only yields to the microtask
 * queue (noble v2's `nextTick` is a no-op), so the derive still runs on the JS
 * thread and briefly monopolizes it; the native `ActivityIndicator` keeps spinning
 * (it animates on the UI thread) but JS-driven interactions jank for its duration.
 * It runs once when sync is enabled and the cipher is then reused for the session.
 */
export async function createNobleCipher(secret: string): Promise<Cipher> {
  const ikm = utf8ToBytes(canonicalizeRecoverySecret(secret));
  const root = await pbkdf2Async(sha256, ikm, PBKDF2_SALT, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });
  const dataKey = hkdf(sha256, root, HKDF_SALT, utf8ToBytes("data-key"), 32);
  const hmacKey = hkdf(sha256, root, HKDF_SALT, utf8ToBytes("entry-id"), HMAC_KEY_BYTES);
  const accountIdHex = bytesToHex(hkdf(sha256, root, HKDF_SALT, utf8ToBytes("account-id"), 32));

  return {
    accountId: async () => accountIdHex,
    entryId: async (keyName) => bytesToHex(hmac(sha256, hmacKey, utf8ToBytes(keyName))),
    encrypt: async (plaintext) => {
      const iv = randomBytes(NONCE_BYTES);
      const ct = gcm(dataKey, iv).encrypt(utf8ToBytes(plaintext));
      return { ciphertext: toBase64(ct), nonce: toBase64(iv) };
    },
    decrypt: async (ciphertext, nonce) => {
      try {
        const pt = gcm(dataKey, fromBase64(nonce)).decrypt(fromBase64(ciphertext));
        return bytesToUtf8(pt);
      } catch {
        return null; // tampered, foreign, or wrong key — never surface as a throw
      }
    },
  };
}
