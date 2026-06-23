/**
 * The `localStorage` keys sync manages (#25, ADR 0033). Deliberately starts with
 * just bookmarks — the first verifiable slice — and fans out across the `ul.*`
 * namespace as each key's merge semantics are proven. Collection-shaped keys
 * (`ul.collections`, `ul.ayahNotes`) wait for element-level merge (v2); scalar
 * keys (settings, theme, reader prefs, reading position, hifz state) are safe to
 * add here once the round-trip is demonstrated.
 */
export const MANAGED_KEYS: readonly string[] = ["ul.bookmarks"];
