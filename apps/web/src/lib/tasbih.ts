/**
 * Tasbih counter glue (ADR 0006): persistence through the `TasbihStore` port
 * (web adapter `webTasbihStore`, ADR 0024). The counter maths (`tasbihState`)
 * lives in `@ummahlibrary/core`; this layer only resolves the stored record or a
 * sensible default.
 */
import { DHIKR_PHRASES, type TasbihRecord } from "@ummahlibrary/core";
import { webTasbihStore as store } from "./tasbih-store";

export const DEFAULT_TASBIH: TasbihRecord = {
  phraseId: DHIKR_PHRASES[0]!.id,
  phrases: {},
};

export async function readTasbih(): Promise<TasbihRecord> {
  return (await store.read()) ?? { ...DEFAULT_TASBIH };
}

export function writeTasbih(record: TasbihRecord): Promise<void> {
  return store.write(record);
}
