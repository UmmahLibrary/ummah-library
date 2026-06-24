/**
 * Local data backup — the local-first answer to cross-device (no account, no
 * server; see ADR 0018). A backup is a versioned envelope around the app's
 * `localStorage` entries. Building, validating and merging are pure and tested;
 * the web layer only reads/writes `localStorage` and the file.
 */

export const BACKUP_VERSION = 1;
export const BACKUP_APP = "ummah-library";

/**
 * The shared namespace every local-first key lives under (`ul.readingPlan`,
 * `ul.editions`, …). It's the single mechanism the backup uses to discover the
 * data the typed stores persist (ADR 0024): every store adapter writes under
 * this prefix, and the backup collects exactly the keys that match it, so a new
 * store is captured automatically with no backup change.
 */
export const BACKUP_KEY_PREFIX = "ul.";

/**
 * The device-local sync sidecar. It is **never** part of a backup: `ul.sync.secret`
 * is the E2EE account root (exporting it would leak the key into a plaintext file),
 * and `ul.sync.node`/`ul.sync.meta` are per-device — restoring them onto another
 * device would clone the node id and collide the HLC tiebreaker.
 */
export const SYNC_KEY_PREFIX = "ul.sync.";

/** Whether a storage key belongs to the app's local-first data (and the backup). */
export function isBackupKey(key: string): boolean {
  return key.startsWith(BACKUP_KEY_PREFIX) && !key.startsWith(SYNC_KEY_PREFIX);
}

/** A portable snapshot of the user's local data (keys → their stored strings). */
export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  data: Record<string, string>;
}

/** How to apply an imported backup. */
export type MergeStrategy = "replace" | "keep-mine";

/** Wrap the current local data in a versioned envelope. */
export function buildBackup(data: Record<string, string>, now: Date): BackupFile {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

/** Validation errors for a parsed object claiming to be a backup ([] if valid). */
export function validateBackup(value: unknown): string[] {
  const errors: string[] = [];
  if (typeof value !== "object" || value === null) return ["Not a backup file."];
  const b = value as Partial<BackupFile>;
  if (b.app !== BACKUP_APP) errors.push("This file isn’t an Ummah Library backup.");
  if (typeof b.version !== "number") errors.push("Missing backup version.");
  else if (b.version > BACKUP_VERSION) errors.push("Backup is from a newer version of the app.");
  if (typeof b.data !== "object" || b.data === null || Array.isArray(b.data)) {
    errors.push("Backup has no data.");
  } else if (!Object.values(b.data).every((v) => typeof v === "string")) {
    errors.push("Backup data is malformed.");
  }
  return errors;
}

/**
 * Combine an incoming backup with the current data.
 * - `replace`: every key in the backup overwrites the current value.
 * - `keep-mine`: the backup only fills keys you don't already have (no clobber).
 */
export function mergeBackups(
  current: Record<string, string>,
  incoming: Record<string, string>,
  strategy: MergeStrategy,
): Record<string, string> {
  if (strategy === "replace") return { ...current, ...incoming };
  return { ...incoming, ...current };
}
