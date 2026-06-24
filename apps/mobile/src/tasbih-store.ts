/**
 * Mobile `TasbihStore` adapter (ADR 0024): the tasbih counter in AsyncStorage
 * under `ul.tasbih`. Persistence only — the counter maths is `tasbihState` in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors web.
 */
import type { TasbihRecord, TasbihStore } from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "./storage";

const isTasbihRecord = (v: unknown): boolean =>
  v === null ||
  (isObjectRecord(v) &&
    typeof (v as TasbihRecord).total === "number" &&
    typeof (v as TasbihRecord).target === "number" &&
    typeof (v as TasbihRecord).phraseId === "string");

export const mobileTasbihStore: TasbihStore = {
  read: () => getJSON<TasbihRecord | null>(KEYS.tasbih, null, isTasbihRecord),
  write: (record) => setJSON(KEYS.tasbih, record),
};
