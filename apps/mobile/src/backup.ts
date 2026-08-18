/**
 * Mobile glue for local data backup: collect the app's `ul.*` AsyncStorage
 * entries, write them to a shareable JSON file, and apply an imported backup.
 * The envelope/validation/merge logic is pure and shared in `@ummahlibrary/core`
 * (identical to the web app), so a backup file round-trips between platforms.
 */
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { type MergeStrategy, buildBackup, mergeBackups, validateBackup } from "@ummahlibrary/core";
import { clearAll, restore, snapshot } from "./backup-store";

export interface ActionResult {
  ok: boolean;
  /** User-facing message. Empty string = silent no-op (e.g. the user cancelled). */
  message: string;
  applied?: number;
}

/** How many local-first items are stored on this device. */
export async function itemCount(): Promise<number> {
  return Object.keys(await snapshot()).length;
}

/** Write a backup file to the cache dir and open the OS share sheet to save it. */
export async function exportBackup(): Promise<ActionResult> {
  try {
    const file = buildBackup(await snapshot(), new Date());
    const name = `ummah-library-backup-${file.exportedAt.slice(0, 10)}.json`;
    const out = new File(Paths.cache, name);
    out.create({ overwrite: true });
    out.write(JSON.stringify(file, null, 2));

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, message: "Sharing isn’t available on this device." };
    }
    await Sharing.shareAsync(out.uri, {
      mimeType: "application/json",
      dialogTitle: "Save your Ummah Library backup",
      UTI: "public.json",
    });
    return { ok: true, message: "Backup ready — choose where to save it." };
  } catch {
    return { ok: false, message: "Couldn’t create the backup." };
  }
}

/** Pick a backup file, validate it, and apply it with the given merge strategy. */
export async function importBackup(strategy: MergeStrategy): Promise<ActionResult> {
  let text: string;
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return { ok: false, message: "" };
    const asset = res.assets[0];
    if (!asset) return { ok: false, message: "" };
    text = await new File(asset.uri).text();
  } catch {
    return { ok: false, message: "Couldn’t read that file." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "That file isn’t valid JSON." };
  }
  const errors = validateBackup(parsed);
  if (errors.length) return { ok: false, message: errors.join(" ") };

  const incoming = (parsed as { data: Record<string, string> }).data;
  const current = await snapshot();
  const merged = mergeBackups(current, incoming, strategy);
  try {
    await restore(merged, strategy === "replace");
  } catch {
    return { ok: false, message: "Couldn’t write to storage." };
  }
  // "replace" always writes every incoming key; "keep-mine" only fills in keys
  // this device didn't already have (mergeBackups keeps the existing value for
  // any overlap) — count what was actually applied, not the backup's total
  // size, so a mostly-overlapping "keep mine" import doesn't overstate itself.
  const applied =
    strategy === "replace"
      ? Object.keys(incoming).length
      : Object.keys(incoming).filter((k) => !(k in current)).length;
  return { ok: true, applied, message: `Restored ${applied} item${applied === 1 ? "" : "s"}.` };
}

/** Erase every local-first (`ul.*`) key. Returns how many were removed. */
export async function clearAllData(): Promise<number> {
  return clearAll();
}
