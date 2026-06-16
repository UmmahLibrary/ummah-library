/**
 * Web `TasbihStore` adapter (ADR 0024): the tasbih counter in `localStorage`
 * under `ul.tasbih2`. Persistence only — the counter maths is `tasbihState` in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors mobile.
 */
import type { TasbihRecord, TasbihStore } from "@ummahlibrary/core";

const KEY = "ul.tasbih2";

export const webTasbihStore: TasbihStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const r = JSON.parse(raw) as Partial<TasbihRecord>;
      return typeof r.total === "number" && typeof r.target === "number" && typeof r.phraseId === "string"
        ? { phraseId: r.phraseId, total: r.total, target: r.target }
        : null;
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
