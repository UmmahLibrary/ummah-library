/**
 * The secure-randomness seam for mobile sync (#25, ADR 0033). React Native has no
 * global WebCrypto, so the bytes that `@noble` needs (the AES-GCM nonce, the
 * recovery code) and the per-device node id come from `expo-crypto`, which is
 * CSPRNG-backed on both Android and iOS. Isolated in one tiny module so the cipher
 * stays free of platform APIs and tests can stub randomness deterministically.
 *
 * Deliberately uses the async `getRandomBytesAsync`, not the sync `getRandomBytes`:
 * the sync variant silently falls back to `Math.random()` (NOT a CSPRNG) whenever
 * `global.nativeCallSyncHook` is absent — which describes the legacy remote-JS
 * debugger, but *also* every New Architecture dev build (that bridge global simply
 * doesn't exist there), so it degraded on every dev-client run of this app
 * regardless of debugging state. `getRandomBytesAsync` has no such fallback in
 * either expo-crypto version — always the real native CSPRNG, dev or release.
 */
import * as Crypto from "expo-crypto";

/** `n` cryptographically-random bytes. */
export function randomBytes(n: number): Promise<Uint8Array> {
  return Crypto.getRandomBytesAsync(n);
}

/** A random v4 UUID for this device's stable sync node id. */
export function randomId(): string {
  return Crypto.randomUUID();
}
