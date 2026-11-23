/**
 * Recovery-phrase encoding (#25, ADR 0033 §1 — "BIP39 words are a later polish").
 * Pure, deterministic bytes-to-words/back logic shared by every platform's `Cipher`
 * adapter, so the wordlist and the canonicalization rule can't drift between web,
 * mobile, and the extension. Each adapter still owns its own CSPRNG (`core` never
 * touches randomness) and just hands the raw bytes here to render as words.
 */
import { BIP39_WORDLIST } from "./bip39-wordlist";

const BIP39_WORD_SET: ReadonlySet<string> = new Set(BIP39_WORDLIST);
const BITS_PER_WORD = 11; // log2(2048)

/** Word count of a generated phrase — chosen for >128 bits of entropy (12 × 11 = 132). */
export const RECOVERY_PHRASE_WORD_COUNT = 12;

/** Minimum random bytes {@link encodeRecoveryPhrase} needs (132 bits, rounded up). */
export const RECOVERY_PHRASE_ENTROPY_BYTES = Math.ceil(
  (RECOVERY_PHRASE_WORD_COUNT * BITS_PER_WORD) / 8,
);

function readBits(bytes: Uint8Array, bitOffset: number, bitCount: number): number {
  let value = 0;
  for (let i = 0; i < bitCount; i++) {
    const bitPos = bitOffset + i;
    const byte = bytes[bitPos >> 3]!;
    const bit = (byte >> (7 - (bitPos & 7))) & 1;
    value = (value << 1) | bit;
  }
  return value;
}

/**
 * Render raw entropy as a space-separated BIP39 phrase (no checksum word — this
 * isn't a wallet and a wrong phrase already derives a harmlessly different account,
 * same as the code it replaces; a checksum would only add complexity here). Needs
 * at least {@link RECOVERY_PHRASE_ENTROPY_BYTES} bytes from a CSPRNG.
 */
export function encodeRecoveryPhrase(entropy: Uint8Array): string {
  if (entropy.length < RECOVERY_PHRASE_ENTROPY_BYTES) {
    throw new Error(
      `encodeRecoveryPhrase needs at least ${RECOVERY_PHRASE_ENTROPY_BYTES} bytes, got ${entropy.length}`,
    );
  }
  const words: string[] = [];
  for (let w = 0; w < RECOVERY_PHRASE_WORD_COUNT; w++) {
    const index = readBits(entropy, w * BITS_PER_WORD, BITS_PER_WORD);
    words.push(BIP39_WORDLIST[index]!);
  }
  return words.join(" ");
}

/**
 * Canonical form of a recovery secret used for key derivation — the one choke
 * point every platform's `createXCipher` calls before deriving keys, so "generate"
 * and "enter existing" (on any device, in any case/spacing) always agree.
 *
 * Recognizes two formats so existing accounts never silently fork:
 * - **BIP39 phrase** (new): exactly {@link RECOVERY_PHRASE_WORD_COUNT} whitespace-
 *   separated real wordlist words → lower-cased, single-spaced.
 * - **Legacy code** (v1, e.g. `ABCDE-FGHJK-...`): anything else → NFKC, upper-cased,
 *   every non-alphanumeric stripped, exactly as before BIP39 shipped.
 */
export function canonicalizeRecoverySecret(secret: string): string {
  const normalized = secret.normalize("NFKC").trim();
  const tokens = normalized
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.toLowerCase());
  if (tokens.length === RECOVERY_PHRASE_WORD_COUNT && tokens.every((t) => BIP39_WORD_SET.has(t))) {
    return tokens.join(" ");
  }
  return normalized.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
