/**
 * Web glue for local data backup: collect the app's `ul.*` localStorage entries,
 * download them as a file, and apply an imported backup. The envelope/validation/
 * merge logic is pure in `@ummahlibrary/core`.
 */

import { type MergeStrategy, buildBackup, mergeBackups, validateBackup } from "@ummahlibrary/core";

const PREFIX = "ul.";

/** Every `ul.*` key currently in localStorage, with its raw string value. */
export function collectLocalData(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const value = localStorage.getItem(key);
        if (value !== null) out[key] = value;
      }
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}

export function exportBackup(): void {
  const file = buildBackup(collectLocalData(), new Date());
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ummah-library-backup-${file.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  message: string;
  applied?: number;
}

/** Parse, validate and apply a backup file's text. Returns a user-facing result. */
export function importBackup(text: string, strategy: MergeStrategy): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "That file isn’t valid JSON." };
  }
  const errors = validateBackup(parsed);
  if (errors.length) return { ok: false, message: errors.join(" ") };

  const incoming = (parsed as { data: Record<string, string> }).data;
  const merged = mergeBackups(collectLocalData(), incoming, strategy);
  try {
    if (strategy === "replace") {
      // Clear existing ul.* keys so a replace is a true restore.
      for (const key of Object.keys(collectLocalData())) localStorage.removeItem(key);
    }
    for (const [key, value] of Object.entries(merged)) localStorage.setItem(key, value);
  } catch {
    return { ok: false, message: "Couldn’t write to local storage." };
  }
  return {
    ok: true,
    applied: Object.keys(incoming).length,
    message: `Restored ${Object.keys(incoming).length} items. Reload to see everything.`,
  };
}

export function clearAllData(): number {
  const keys = Object.keys(collectLocalData());
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  return keys.length;
}
