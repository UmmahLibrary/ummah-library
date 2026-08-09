/**
 * Pure logic for the mobile content read-through cache (issue #223): cache-key
 * derivation, the on-disk manifest shape, and the eviction/bound decision.
 *
 * Deliberately has **no** `expo-file-system` (or any Expo/RN) import — this
 * file is plain, deterministic TypeScript so it's unit-testable without
 * mocking the filesystem. `offlineCache.ts` is the thin I/O layer that reads
 * and writes this shape via `expo-file-system`.
 */

/** One cached response: where its body lives on disk, its size, and when it was written. */
export interface CacheEntry {
  /** File name (not a full path) of the cached body under the cache directory. */
  file: string;
  sizeBytes: number;
  /** ms since epoch, from the caller's clock at write time. */
  timestamp: number;
}

export interface CacheManifest {
  entries: Record<string, CacheEntry>;
}

export function emptyManifest(): CacheManifest {
  return { entries: {} };
}

// ---- Cache keys -------------------------------------------------------------
// One builder per distinct request shape in api.ts (surah text, a translation
// edition for a surah, tafsir entries, hadith, ...). Keep these stable —
// changing the scheme just orphans previously-cached files, which is harmless
// since they age out via the size/age bound below and are never looked up
// again under the old key.
export const CACHE_KEYS = {
  surahs: (): string => "surahs",
  surah: (n: number): string => `surah:${n}`,
  timings: (reciterId: string, n: number): string => `timings:${reciterId}:${n}`,
  translation: (edition: string, n: number): string => `translation:${edition}:${n}`,
  editions: (): string => "editions",
  translationCatalog: (): string => "translationCatalog",
  catalogTranslation: (edition: string, n: number): string => `catalogTranslation:${edition}:${n}`,
  tafsirs: (): string => "tafsirs",
  tafsir: (edition: string, n: number): string => `tafsir:${edition}:${n}`,
  hadithSection: (collection: string, section: number): string => `hadith:${collection}:${section}`,
  names: (): string => "names",
  adhkar: (): string => "adhkar",
  searchCorpus: (): string => "searchCorpus",
} as const;

/**
 * Deterministic FNV-1a 32-bit hash, hex-encoded — turns a logical cache key
 * (which may contain characters that are awkward in a file name, e.g. a
 * runtime-catalog translation edition id) into a short, filesystem-safe,
 * collision-resistant file name.
 */
export function hashKey(key: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function fileNameFor(key: string): string {
  return `${hashKey(key)}.json`;
}

// ---- Bound policy -------------------------------------------------------------
// 50MB total, 30-day max age. Judgment call (issue #223 suggests either):
// Qur'an text plus a handful of translation/tafsir editions for the surahs a
// reader actually opens runs a few hundred KB each, so 50MB comfortably covers
// a heavy reader's recently-opened surahs — including the ~1-2MB search corpus
// — without turning into an unbounded offline mirror of the whole app. 30 days
// reclaims space from content a reader hasn't revisited in a month even if
// they never come close to the size cap, so a superseded dataset revision
// doesn't linger forever.
export const MAX_CACHE_BYTES = 50 * 1024 * 1024;
export const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function totalSize(manifest: CacheManifest): number {
  let total = 0;
  for (const key of Object.keys(manifest.entries)) total += manifest.entries[key].sizeBytes;
  return total;
}

/**
 * Given the current manifest and clock, decides which keys to evict: first
 * anything older than `maxAgeMs`, then — if the remaining entries still add
 * up to more than `maxBytes` — the oldest remaining entries (by timestamp)
 * until back under budget. Pure: takes `now` instead of reading `Date.now()`
 * so it's exercised deterministically in tests.
 */
export function planEviction(
  manifest: CacheManifest,
  now: number,
  maxBytes: number = MAX_CACHE_BYTES,
  maxAgeMs: number = MAX_CACHE_AGE_MS,
): string[] {
  const keys = Object.keys(manifest.entries);
  const toEvict = new Set<string>();

  for (const key of keys) {
    if (now - manifest.entries[key].timestamp > maxAgeMs) toEvict.add(key);
  }

  const remaining = keys
    .filter((key) => !toEvict.has(key))
    .sort((a, b) => manifest.entries[a].timestamp - manifest.entries[b].timestamp);

  let remainingBytes = remaining.reduce((sum, key) => sum + manifest.entries[key].sizeBytes, 0);
  for (const key of remaining) {
    if (remainingBytes <= maxBytes) break;
    toEvict.add(key);
    remainingBytes -= manifest.entries[key].sizeBytes;
  }

  return [...toEvict];
}
