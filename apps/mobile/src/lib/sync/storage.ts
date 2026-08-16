/**
 * Raw AsyncStorage access for the mobile sync module (ADR 0024/0028) — the one
 * file here permitted to import AsyncStorage directly, so the rest of the sync
 * code stays storage-agnostic (mirrors `apps/web/src/lib/sync/storage.ts`). Every
 * accessor swallows storage errors and degrades to null / a no-op rather than
 * throwing. Async throughout: mobile has no synchronous storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/** Read many keys in one round trip; missing keys come back as `null`. */
export async function multiGet(keys: readonly string[]): Promise<Map<string, string | null>> {
  try {
    const pairs = await AsyncStorage.multiGet([...keys]);
    return new Map(pairs.map(([k, v]) => [k, v ?? null]));
  } catch {
    return new Map(keys.map((k) => [k, null]));
  }
}
