/**
 * Web glue for local data backup: collect the app's `ul.*` localStorage entries,
 * download them as a file, and apply an imported backup. The envelope/validation/
 * merge logic is pure in `@ummahlibrary/core`.
 */

import { type MergeStrategy, buildBackup, mergeBackups, validateBackup } from "@ummahlibrary/core";
import { clearAll, restore, snapshot } from "./backup-store";

/** Every local-first (`ul.*`) key in localStorage, with its raw string value. */
export function collectLocalData(): Record<string, string> {
  return snapshot();
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
  const merged = mergeBackups(snapshot(), incoming, strategy);
  try {
    restore(merged, strategy === "replace");
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
  return clearAll();
}
