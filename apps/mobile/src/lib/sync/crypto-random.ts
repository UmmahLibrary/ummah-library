/**
 * The secure-randomness seam for mobile sync (#25, ADR 0033). React Native has no
 * global WebCrypto, so the bytes that `@noble` needs (the AES-GCM nonce, the
 * recovery code) and the per-device node id come from `expo-crypto`, which is
 * CSPRNG-backed on both Android and iOS. Isolated in one tiny module so the cipher
 * stays free of platform APIs and tests can stub randomness deterministically.
 */
import * as Crypto from "expo-crypto";

declare const __DEV__: boolean;

/**
 * `expo-crypto`'s synchronous `getRandomBytes` silently falls back to
 * `Math.random()` (NOT a CSPRNG) under the legacy remote-JS debugger — guarded
 * internally by `__DEV__ && (!nativeCallSyncHook || __REMOTEDEV__)`. A predictable
 * AES-GCM nonce or a weak recovery code is unacceptable, so we mirror that exact
 * condition and fail loudly instead. The check is `__DEV__`-only (so it can never
 * fire on a release build, including the new architecture where `nativeCallSyncHook`
 * is legitimately absent), and matches expo-crypto so it triggers iff it would degrade.
 */
function assertSecureRng(): void {
  const g = globalThis as { nativeCallSyncHook?: unknown; __REMOTEDEV__?: unknown };
  if (typeof __DEV__ !== "undefined" && __DEV__ && (!g.nativeCallSyncHook || g.__REMOTEDEV__)) {
    throw new Error(
      "Secure randomness is unavailable under remote JS debugging — turn off “Debug Remote JS”. Sync requires a CSPRNG.",
    );
  }
}

/** `n` cryptographically-random bytes. */
export function randomBytes(n: number): Uint8Array {
  assertSecureRng();
  return Crypto.getRandomBytes(n);
}

/** A random v4 UUID for this device's stable sync node id. */
export function randomId(): string {
  return Crypto.randomUUID();
}
