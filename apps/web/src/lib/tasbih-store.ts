/**
 * Web `TasbihStore` adapter (ADR 0024): the tasbih counter in `localStorage`
 * under `ul.tasbih2`. Persistence only — the counter maths is `tasbihState` in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors mobile.
 */
import type { TasbihRecord, TasbihStore } from "@ummahlibrary/core";

const KEY = "ul.tasbih2";

/** The pre-per-phrase-progress shape (a single shared total/target). */
interface LegacyRecord {
  phraseId: string;
  total: number;
  target: number;
}

function isLegacyRecord(r: unknown): r is LegacyRecord {
  return (
    typeof r === "object" &&
    r !== null &&
    typeof (r as LegacyRecord).phraseId === "string" &&
    typeof (r as LegacyRecord).total === "number" &&
    typeof (r as LegacyRecord).target === "number"
  );
}

function isRecord(r: unknown): r is TasbihRecord {
  return (
    typeof r === "object" &&
    r !== null &&
    typeof (r as TasbihRecord).phraseId === "string" &&
    typeof (r as TasbihRecord).phrases === "object" &&
    (r as TasbihRecord).phrases !== null
  );
}

export const webTasbihStore: TasbihStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed)) return parsed;
      // Migrate the old single-total shape: the phrase being counted when this
      // was last saved keeps its progress, filed under its own entry.
      if (isLegacyRecord(parsed)) {
        const migrated: TasbihRecord = {
          phraseId: parsed.phraseId,
          phrases: { [parsed.phraseId]: { total: parsed.total, target: parsed.target } },
        };
        localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
      }
      return null;
    } catch {
      return null;
    }
  },
  write: async (record) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(record));
    } catch {
      /* storage unavailable */
    }
  },
};
