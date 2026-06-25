/**
 * Raw-storage home (ADR 0024) for the reader's tafsir **comparison set** — the
 * tafsir editions shown side by side in the per-āyah panel (#141), under
 * `ul.tafsirCompare`. Kept synchronous (read during render of the open panel),
 * so callers import these helpers instead of touching `localStorage` directly.
 * An empty set means "just the single selected tafsir" — i.e. today's behaviour.
 */
const KEY = "ul.tafsirCompare";

/** The selected comparison editions (ids), or `[]` when none chosen. */
export function readTafsirCompare(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    // A corrupt / peer-synced non-array (or non-string members) must not crash the
    // panel — fall back to "no comparison set".
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function writeTafsirCompare(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}
