import { describe, expect, it } from "vitest";
import { createWebCryptoCipher, generateRecoveryPhrase } from "./web-crypto-cipher";

describe("generateRecoveryPhrase", () => {
  it("formats as grouped, unambiguous codes and is unique each time", () => {
    const p = generateRecoveryPhrase();
    expect(p).toMatch(/^[A-HJ-NP-TV-Z2-9]{5}(-[A-HJ-NP-TV-Z2-9]{5}){4}$/);
    expect(generateRecoveryPhrase()).not.toBe(p);
  });
});

describe("createWebCryptoCipher", () => {
  it("derives a stable account id from the secret, distinct per secret", async () => {
    const c1 = await createWebCryptoCipher("correct horse battery");
    const c2 = await createWebCryptoCipher("correct horse battery");
    const c3 = await createWebCryptoCipher("different secret");
    expect(await c1.accountId()).toBe(await c2.accountId());
    expect(await c1.accountId()).not.toBe(await c3.accountId());
    expect(await c1.accountId()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes key names to stable, distinct ids that hide the name", async () => {
    const c = await createWebCryptoCipher("s");
    const idBookmarks = await c.entryId("ul.bookmarks");
    expect(await c.entryId("ul.bookmarks")).toBe(idBookmarks);
    expect(await c.entryId("ul.haid")).not.toBe(idBookmarks);
    expect(idBookmarks).not.toContain("bookmarks");
    expect(idBookmarks).toMatch(/^[0-9a-f]{64}$/);
  });

  it("round-trips a value, with the plaintext absent from the ciphertext", async () => {
    const c = await createWebCryptoCipher("s");
    const { ciphertext, nonce } = await c.encrypt("سلام 🌙 secret-note");
    expect(ciphertext).not.toContain("secret");
    expect(await c.decrypt(ciphertext, nonce)).toBe("سلام 🌙 secret-note");
  });

  it("uses a fresh nonce each time (same plaintext → different ciphertext)", async () => {
    const c = await createWebCryptoCipher("s");
    const a = await c.encrypt("x");
    const b = await c.encrypt("x");
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("returns null (never throws) on tampered or wrong-key ciphertext", async () => {
    const c = await createWebCryptoCipher("s");
    const other = await createWebCryptoCipher("other-secret");
    const a = await c.encrypt("hello");
    const b = await c.encrypt("world");
    expect(await c.decrypt(a.ciphertext, b.nonce)).toBeNull(); // mismatched nonce → auth fail
    expect(await other.decrypt(a.ciphertext, a.nonce)).toBeNull(); // wrong key (E2EE property)
  });

  it("links case/spacing/hyphen variants of the same recovery code to one account", async () => {
    // A second device transcribing the phrase differently must derive the SAME
    // account, not a silent empty fork.
    const canonical = await createWebCryptoCipher("ABCDE-FGHJK-MNPQR-STVWX-YZ234");
    const lower = await createWebCryptoCipher("abcde-fghjk-mnpqr-stvwx-yz234");
    const spaced = await createWebCryptoCipher("ABCDE FGHJK MNPQR STVWX YZ234");
    expect(await lower.accountId()).toBe(await canonical.accountId());
    expect(await spaced.accountId()).toBe(await canonical.accountId());
    expect(await lower.entryId("ul.x")).toBe(await canonical.entryId("ul.x"));
    // A genuinely different code still derives a different account.
    const other = await createWebCryptoCipher("ZZZZZ-FGHJK-MNPQR-STVWX-YZ234");
    expect(await other.accountId()).not.toBe(await canonical.accountId());
  });

  it("lets a second device with the same secret read the first's data", async () => {
    const deviceA = await createWebCryptoCipher("shared-phrase");
    const deviceB = await createWebCryptoCipher("shared-phrase");
    const sealed = await deviceA.encrypt("cross-device");
    expect(await deviceB.decrypt(sealed.ciphertext, sealed.nonce)).toBe("cross-device");
    expect(await deviceB.entryId("ul.x")).toBe(await deviceA.entryId("ul.x"));
  });
});
