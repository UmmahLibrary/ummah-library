/**
 * Store adapter (ADR 0024) for the reader's tafsir **comparison set** — the
 * editions shown together in the per-āyah tafsir panel (#141), under
 * `ul.tafsirCompare`. An empty set means "just the single selected tafsir", i.e.
 * the original one-edition behaviour. Mirrors the web `tafsir-compare-store`.
 */
import { KEYS, getJSON, isStringArray, setJSON } from "./storage";

export function readTafsirCompare(): Promise<string[]> {
  return getJSON<string[]>(KEYS.tafsirCompare, [], isStringArray);
}

export function writeTafsirCompare(ids: string[]): Promise<void> {
  return setJSON(KEYS.tafsirCompare, ids);
}
