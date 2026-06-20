/**
 * The deployed Ummah Library web app the extension reads from and links into.
 * The apex domain is canonical (the `app.` host 308-redirects here); this matches
 * what the mobile app uses (apps/mobile/src/api.ts).
 */
export const BASE_URL = "https://ummahlibrary.org";

/** Default translation edition (matches the web app's verse-of-the-day default). */
export const DEFAULT_EDITION = "eng-khattab";
