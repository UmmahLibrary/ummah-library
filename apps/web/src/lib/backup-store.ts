/**
 * Web backup storage adapter (ADR 0024) — the **one** place that enumerates the
 * whole `ul.*` key-space in `localStorage`, so the backup feature can snapshot,
 * restore, and clear it. The envelope/validate/merge logic is pure in
 * `@ummahlibrary/core`; this file is the sanctioned raw-`localStorage` home.
 */
import { isBackupKey } from "@ummahlibrary/core";

/** Every local-first (`ul.*`) key in localStorage, with its raw string value. */
export function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isBackupKey(key)) {
        const value = localStorage.getItem(key);
        if (value !== null) out[key] = value;
      }
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}

/** Write the given entries; when `replace`, clear existing `ul.*` keys first. */
export function restore(entries: Record<string, string>, replace: boolean): void {
  if (replace) for (const key of Object.keys(snapshot())) localStorage.removeItem(key);
  // Symmetric with snapshot()/clearAll(): only ever write keys this module owns,
  // so a crafted/corrupt backup can't plant non-`ul.*` keys or the sync sidecar.
  for (const [key, value] of Object.entries(entries)) {
    if (isBackupKey(key)) localStorage.setItem(key, value);
  }
}

/** Remove every local-first (`ul.*`) key. Returns how many were removed. */
export function clearAll(): number {
  const keys = Object.keys(snapshot());
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
  return keys.length;
}
