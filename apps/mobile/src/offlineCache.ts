/**
 * Read-through content cache for the mobile API client (issue #223). Mirrors
 * the web service worker's "any surah you've opened stays readable" offline
 * behaviour: `readThrough` always tries the network first — a fresh response
 * always replaces the cached one, so the cache is a fallback, never a freeze
 * — and only serves a previously-cached response when the live fetch throws
 * (no connection, timeout, non-2xx). If neither the network nor the cache has
 * an answer, the original error propagates unchanged, same as before this
 * layer existed.
 *
 * Storage: `expo-file-system`, not AsyncStorage — surah/translation/tafsir
 * JSON is too large a payload for AsyncStorage's key-value store (AGENTS.md /
 * issue #223). Each response is written as its own JSON file under
 * `<cache dir>/ul-content-cache/`, named by a hash of its logical cache key
 * (see `offlineCacheManifest.ts`), plus one small `manifest.json` mapping key
 * -> {file, sizeBytes, timestamp} so bound enforcement never has to list or
 * stat the whole directory. `Paths.cache` (not `Paths.document`) — this is
 * disposable, re-fetchable content, not user data, so it's fine for the OS to
 * reclaim under storage pressure.
 */
import { Directory, File, Paths } from "expo-file-system";
import {
  emptyManifest,
  fileNameFor,
  MAX_CACHE_AGE_MS,
  MAX_CACHE_BYTES,
  planEviction,
  totalSize,
  type CacheManifest,
} from "./offlineCacheManifest";

export { MAX_CACHE_AGE_MS, MAX_CACHE_BYTES };

const CACHE_DIR_NAME = "ul-content-cache";
const MANIFEST_FILE = "manifest.json";

function cacheDir(): Directory {
  return new Directory(Paths.cache, CACHE_DIR_NAME);
}

function ensureDir(): Directory {
  const dir = cacheDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function loadManifest(): Promise<CacheManifest> {
  try {
    const file = new File(ensureDir(), MANIFEST_FILE);
    if (!file.exists) return emptyManifest();
    const parsed = JSON.parse(await file.text()) as unknown;
    if (parsed && typeof parsed === "object" && "entries" in parsed) {
      return parsed as CacheManifest;
    }
    return emptyManifest();
  } catch {
    // Missing/corrupt manifest (e.g. first run, or the OS partially reclaimed
    // the cache dir) — start clean rather than fail every read.
    return emptyManifest();
  }
}

// Loaded once per process and mutated in place; every read/write shares this
// object so concurrent cache operations (e.g. a screen firing off `getSurah`
// and `getCatalogTranslation` together) see each other's writes instead of
// racing two stale copies to disk.
let manifestPromise: Promise<CacheManifest> | null = null;
function manifest(): Promise<CacheManifest> {
  if (!manifestPromise) manifestPromise = loadManifest();
  return manifestPromise;
}

async function persistManifest(m: CacheManifest): Promise<void> {
  const file = new File(ensureDir(), MANIFEST_FILE);
  file.write(JSON.stringify(m));
}

/** Reads a previously-cached response for `key`, or null if there isn't one. */
async function readCached<T>(key: string): Promise<T | null> {
  const m = await manifest();
  const entry = m.entries[key];
  if (!entry) return null;
  const file = new File(cacheDir(), entry.file);
  if (!file.exists) {
    // Manifest and disk drifted (OS storage cleanup, user cleared app
    // storage outside the app, ...) — forget the dangling entry.
    delete m.entries[key];
    return null;
  }
  try {
    return JSON.parse(await file.text()) as T;
  } catch {
    return null;
  }
}

async function writeCached(key: string, value: unknown, now: number): Promise<void> {
  const dir = ensureDir();
  const body = JSON.stringify(value);
  const fileName = fileNameFor(key);
  new File(dir, fileName).write(body);

  const m = await manifest();
  m.entries[key] = { file: fileName, sizeBytes: body.length, timestamp: now };

  for (const evictKey of planEviction(m, now)) {
    const evictEntry = m.entries[evictKey];
    delete m.entries[evictKey];
    if (!evictEntry) continue;
    const evictFile = new File(dir, evictEntry.file);
    if (evictFile.exists) {
      try {
        evictFile.delete();
      } catch {
        /* best-effort — an orphaned file just ages out of the manifest */
      }
    }
  }

  await persistManifest(m);
}

/**
 * Read-through wrapper: try `fetcher()` (the live network call); on success,
 * cache the resolved value under `key` and return it. On failure, serve the
 * cached value for `key` if one exists; otherwise re-throw the original
 * error unchanged so callers keep their existing error handling.
 */
export async function readThrough<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const value = await fetcher();
    try {
      await writeCached(key, value, Date.now());
    } catch {
      /* best-effort cache write — never fail a successful fetch over a disk error */
    }
    return value;
  } catch (err) {
    const cached = await readCached<T>(key);
    if (cached !== null) return cached;
    throw err;
  }
}

/** Current cache footprint, for the "Clear cached content" row in Settings. */
export async function getCacheStats(): Promise<{ sizeBytes: number; entryCount: number }> {
  const m = await manifest();
  return { sizeBytes: totalSize(m), entryCount: Object.keys(m.entries).length };
}

/** Deletes every cached response ("Clear cached content" in Settings). */
export async function clearCache(): Promise<void> {
  const dir = cacheDir();
  if (dir.exists) {
    try {
      dir.delete();
    } catch {
      /* best-effort */
    }
  }
  manifestPromise = Promise.resolve(emptyManifest());
}
