/**
 * Extension cipher tests (#25, ADR 0033). Same cross-platform interop vectors the
 * web and mobile ciphers are pinned against: if the extension derives the same
 * accountId/entryId and decrypts the web-produced ciphertext, a phrase set up on
 * the web (or mobile) links to the same account and reads the same data in the
 * extension. Runs under jsdom with Node's WebCrypto (`crypto.subtle`).
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { Cipher } from "@ummahlibrary/core";
import {
  canonicalizeRecoverySecret,
  createWebCryptoCipher,
  generateRecoveryPhrase,
} from "./web-crypto-cipher";

const PHRASE = "MBTQ7-K9XAR-2P4WD-NHJ58-VYZ36";
const KEY = "ul.lastRead";
const PLAINTEXT = '{"surah":18,"ayah":10}';
const ACCOUNT_ID = "2a18292b6de6a845428ce9ffbf5478993b4fd5f3f468cf647890c09efe49be8c";
const ENTRY_ID = "47fb92d7ccf64b6ad6b530daeec67a4e77b9033de692008946f5b704443c057f";
const NONCE_B64 = "CzBVep/E6Q4zWH2i";
const CIPHERTEXT = "NMPO+7NqiblvNSnSsYMFsEFM5eWMZeJXeo5MimMBdmY6UVnUxqo=";

describe("extension cipher — cross-platform interop", () => {
  let cipher: Cipher;
  beforeAll(async () => {
    cipher = await createWebCryptoCipher(PHRASE);
  });

  it("derives the same accountId as web/mobile", async () => {
    expect(await cipher.accountId()).toBe(ACCOUNT_ID);
  });

  it("derives the same entryId as web/mobile", async () => {
    expect(await cipher.entryId(KEY)).toBe(ENTRY_ID);
  });

  it("decrypts ciphertext produced by the web cipher", async () => {
    expect(await cipher.decrypt(CIPHERTEXT, NONCE_B64)).toBe(PLAINTEXT);
  });

  it("round-trips encrypt → decrypt with a fresh nonce each time", async () => {
    const a = await cipher.encrypt("obsidian");
    const b = await cipher.encrypt("obsidian");
    expect(a.nonce).not.toBe(b.nonce);
    expect(await cipher.decrypt(a.ciphertext, a.nonce)).toBe("obsidian");
  });

  it("returns null on tampered/foreign ciphertext", async () => {
    expect(await cipher.decrypt("not-valid", NONCE_B64)).toBeNull();
  });
});

describe("recovery secret helpers", () => {
  it("canonicalizes to the same account regardless of case/spacing", async () => {
    const a = await createWebCryptoCipher("mbtq7 k9xar 2p4wd nhj58 vyz36");
    expect(await a.accountId()).toBe(ACCOUNT_ID);
    expect(canonicalizeRecoverySecret("ab-cd ef")).toBe("ABCDEF");
  });

  it("generates five hyphen-separated groups of five from the safe alphabet", () => {
    expect(generateRecoveryPhrase()).toMatch(
      /^[ABCDEFGHJKMNPQRSTVWXYZ23456789]{5}(-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{5}){4}$/,
    );
  });
});
