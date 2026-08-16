/**
 * Local-first persistence for the extension (ADR 0006, ADR 0026).
 *
 * Two areas, mirroring the rest of the project's local-first stance:
 *  - **prefs** → `chrome.storage.sync`: tiny user choices (edition, Hijri
 *    adjustment) that the browser syncs across the user's signed-in profile for
 *    free — no backend we operate (see #116). Falls back to local if unavailable.
 *  - **cache** → `chrome.storage.local`: fetched data (surah list, editions)
 *    that we don't want to refetch on every popup open.
 *
 * When `chrome.storage` is absent (e.g. the popup rendered as a plain page in a
 * test or preview), both areas fall back to `localStorage` under an `ul.ext.*`
 * namespace. Everything stays on the device; nothing is sent to a server.
 */

const NS = "ul.ext.";

type Area = "sync" | "local";

function chromeArea(area: Area): chrome.storage.StorageArea | null {
  const s = typeof chrome !== "undefined" ? chrome.storage : undefined;
  if (!s) return null;
  // Firefox/older Chrome may lack `sync`; degrade to `local`.
  return (area === "sync" ? (s.sync ?? s.local) : s.local) ?? null;
}

async function read<T>(area: Area, key: string, fallback: T): Promise<T> {
  const ca = chromeArea(area);
  if (ca) {
    const got = (await ca.get(key)) as Record<string, unknown>;
    return (got[key] as T) ?? fallback;
  }
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

async function write(area: Area, key: string, value: unknown): Promise<void> {
  const ca = chromeArea(area);
  if (ca) {
    await ca.set({ [key]: value });
    return;
  }
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

async function remove(area: Area, key: string): Promise<void> {
  const ca = chromeArea(area);
  if (ca) {
    await ca.remove(key);
    return;
  }
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export const getPref = <T>(key: string, fallback: T): Promise<T> => read("sync", key, fallback);
export const setPref = (key: string, value: unknown): Promise<void> => write("sync", key, value);

export const getCache = <T>(key: string, fallback: T): Promise<T> => read("local", key, fallback);
export const setCache = (key: string, value: unknown): Promise<void> => write("local", key, value);
/** Forget a device-local value entirely (used to erase the sync secret on disable). */
export const removeCache = (key: string): Promise<void> => remove("local", key);
