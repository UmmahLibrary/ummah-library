/**
 * Mobile `TasbihStore` adapter (ADR 0024): the tasbih counter in AsyncStorage
 * under `ul.tasbih`. Persistence only — the counter maths is `tasbihState` in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors web.
 */
import type { TasbihRecord, TasbihStore } from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "./storage";

/** The pre-per-phrase-progress shape (a single shared total/target). */
interface LegacyRecord {
  phraseId: string;
  total: number;
  target: number;
}

const isLegacyRecord = (v: unknown): v is LegacyRecord =>
  isObjectRecord(v) &&
  typeof (v as LegacyRecord).phraseId === "string" &&
  typeof (v as LegacyRecord).total === "number" &&
  typeof (v as LegacyRecord).target === "number";

const isTasbihRecord = (v: unknown): v is TasbihRecord =>
  isObjectRecord(v) &&
  typeof (v as TasbihRecord).phraseId === "string" &&
  isObjectRecord((v as TasbihRecord).phrases);

export const mobileTasbihStore: TasbihStore = {
  read: async () => {
    const raw = await getJSON<unknown>(KEYS.tasbih, null);
    if (isTasbihRecord(raw)) return raw;
    // Migrate the old single-total shape: the phrase being counted when this
    // was last saved keeps its progress, filed under its own entry.
    if (isLegacyRecord(raw)) {
      const migrated: TasbihRecord = {
        phraseId: raw.phraseId,
        phrases: { [raw.phraseId]: { total: raw.total, target: raw.target } },
      };
      await setJSON(KEYS.tasbih, migrated);
      return migrated;
    }
    return null;
  },
  write: (record) => setJSON(KEYS.tasbih, record),
};
