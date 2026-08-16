/**
 * The keys sync manages (#25, ADR 0033). The canonical list now lives in `core`
 * (`sync-keys.ts`) as the shared, platform-neutral contract so web, mobile, and
 * the extension can't drift on which keys round-trip. Re-exported here so existing
 * web imports (and the classification guard test) keep their local path.
 */
export { MANAGED_KEYS } from "@ummahlibrary/core";
