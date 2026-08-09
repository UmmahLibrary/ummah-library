/**
 * Mobile backup storage adapter (ADR 0024) — the **one** place that enumerates
 * the whole `ul.*` key-space in AsyncStorage so the backup feature can snapshot,
 * restore, and clear it. The envelope/validate/merge logic is pure in
 * `@ummahlibrary/core`; this file is the sanctioned raw-AsyncStorage home, the
 * async mirror of the web app's `lib/backup-store.ts`.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackupKey } from "@ummahlibrary/core";

/** Every local-first (`ul.*`) key in AsyncStorage, with its raw string value. */
export async function snapshot(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(isBackupKey);
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [key, value] of pairs) {
      if (value !== null) out[key] = value;
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}

/** Write the given entries; when `replace`, clear existing `ul.*` keys first. */
export async function restore(entries: Record<string, string>, replace: boolean): Promise<void> {
  if (replace) {
    const existing = Object.keys(await snapshot());
    if (existing.length) await AsyncStorage.multiRemove(existing);
  }
  // Symmetric with snapshot()/clearAll(): only ever write keys this module owns,
  // so a crafted/corrupt backup can't plant non-`ul.*` keys or the sync sidecar.
  const pairs = Object.entries(entries).filter(([key]) => isBackupKey(key));
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

/** Remove every local-first (`ul.*`) key. Returns how many were removed. */
export async function clearAll(): Promise<number> {
  const keys = Object.keys(await snapshot());
  try {
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    /* storage unavailable */
  }
  return keys.length;
}
