/**
 * Recovery-phrase encoding tests (#25, ADR 0033 §1). `encodeRecoveryPhrase` is
 * pure bit-packing, so it's pinned against hand-computed vectors (all-zero and
 * all-one entropy give the first/last wordlist entries) rather than just format
 * regexes. `canonicalizeRecoverySecret` must keep every pre-BIP39 recovery code
 * canonicalizing exactly as before — that's what stops a client upgrade from
 * silently forking an existing synced account onto a new one.
 */
import { describe, expect, it } from "vitest";
import { BIP39_WORDLIST } from "./bip39-wordlist";
import {
  canonicalizeRecoverySecret,
  encodeRecoveryPhrase,
  RECOVERY_PHRASE_ENTROPY_BYTES,
  RECOVERY_PHRASE_WORD_COUNT,
} from "./recovery-phrase";

describe("encodeRecoveryPhrase", () => {
  it("has exactly 2048 words, sorted, no duplicates", () => {
    expect(BIP39_WORDLIST).toHaveLength(2048);
    expect(new Set(BIP39_WORDLIST).size).toBe(2048);
    expect([...BIP39_WORDLIST]).toEqual([...BIP39_WORDLIST].sort());
  });

  it("maps all-zero entropy to the first word repeated", () => {
    const words = encodeRecoveryPhrase(new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES)).split(" ");
    expect(words).toHaveLength(RECOVERY_PHRASE_WORD_COUNT);
    expect(new Set(words)).toEqual(new Set([BIP39_WORDLIST[0]]));
  });

  it("maps all-one entropy to the last word repeated", () => {
    const entropy = new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES).fill(0xff);
    const words = encodeRecoveryPhrase(entropy).split(" ");
    expect(new Set(words)).toEqual(new Set([BIP39_WORDLIST[2047]]));
  });

  it("uses every bit of entropy — a one-bit change flips exactly one word on average", () => {
    const a = new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES);
    const b = new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES);
    b[0] = 0x80; // flips only the top bit of the first 11-bit word
    const wordsA = encodeRecoveryPhrase(a).split(" ");
    const wordsB = encodeRecoveryPhrase(b).split(" ");
    expect(wordsA[0]).not.toBe(wordsB[0]);
    expect(wordsA.slice(1)).toEqual(wordsB.slice(1));
  });

  it("throws when given less entropy than it needs", () => {
    expect(() => encodeRecoveryPhrase(new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES - 1))).toThrow();
  });

  it("only ever emits real wordlist words", () => {
    const rnd = new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES);
    for (let i = 0; i < rnd.length; i++) rnd[i] = (i * 37 + 11) % 256;
    for (const w of encodeRecoveryPhrase(rnd).split(" ")) {
      expect(BIP39_WORDLIST).toContain(w);
    }
  });
});

describe("canonicalizeRecoverySecret", () => {
  it("lower-cases and single-spaces a real 12-word BIP39 phrase", () => {
    const phrase = Array.from({ length: 12 }, (_, i) => BIP39_WORDLIST[i * 100]).join("   ");
    const expected = Array.from({ length: 12 }, (_, i) => BIP39_WORDLIST[i * 100]).join(" ");
    expect(canonicalizeRecoverySecret(phrase.toUpperCase())).toBe(expected);
  });

  it("keeps legacy alphanumeric-code canonicalization unchanged", () => {
    expect(canonicalizeRecoverySecret("ab-cd ef")).toBe("ABCDEF");
    expect(canonicalizeRecoverySecret("MBTQ7-K9XAR")).toBe("MBTQ7K9XAR");
    expect(canonicalizeRecoverySecret("mbtq7 k9xar 2p4wd nhj58 vyz36")).toBe(
      "MBTQ7K9XAR2P4WDNHJ58VYZ36",
    );
  });

  it("falls back to legacy canonicalization for 12 tokens that aren't real words", () => {
    const gibberish = Array.from({ length: 12 }, (_, i) => `zz${i}`).join(" ");
    expect(canonicalizeRecoverySecret(gibberish)).toBe(gibberish.toUpperCase().replace(/ /g, ""));
  });

  it("round-trips a generated phrase back to itself", () => {
    const phrase = encodeRecoveryPhrase(new Uint8Array(RECOVERY_PHRASE_ENTROPY_BYTES).fill(0x42));
    expect(canonicalizeRecoverySecret(phrase)).toBe(phrase);
    expect(canonicalizeRecoverySecret(phrase.toUpperCase())).toBe(phrase);
  });
});
