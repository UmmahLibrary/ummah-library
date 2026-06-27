/**
 * Arabic script selection (ADR 0035): the reader can render the Quran's Arabic in
 * the Uthmani (default) or IndoPak orthography.
 *
 * The choice persists through the `SettingsStore` port and broadcasts a window
 * event so the per-āyah word components swap live. The IndoPak verse text is
 * fetched per surah from our own static API (prerendered, bundled — not a runtime
 * call), the same fetch-on-toggle pattern translations and word-transliteration
 * already use. v1 is reading-view only: the per-word audio/transliteration hooks
 * stay Uthmani-only because IndoPak word boundaries differ.
 */
import type { QuranScript } from "@ummahlibrary/core";
import { webSettingsStore as store } from "./settings-store";

/** Window event broadcast when the script toggle changes. */
export const SCRIPT_KEY = "ul.script";

/** Body class that drives the IndoPak webfont in CSS. */
export const SCRIPT_INDOPAK_CLASS = "script-indopak";

/** Locales whose readers expect the IndoPak mushaf by default (overridable). */
function localeDefaultScript(): QuranScript {
  try {
    if (typeof navigator !== "undefined" && /^(ur|hi|bn)\b/i.test(navigator.language ?? "")) {
      return "indopak";
    }
  } catch {
    /* navigator unavailable — fall through */
  }
  return "uthmani";
}

/** Coerce a stored string to a known script, or null if it is neither. */
function normalize(v: string | null): QuranScript | null {
  return v === "uthmani" || v === "indopak" ? v : null;
}

/** The stored script if set, otherwise the locale default. */
export async function readScript(): Promise<QuranScript> {
  return normalize((await store.read()).script) ?? localeDefaultScript();
}

export async function writeScript(script: QuranScript): Promise<void> {
  await store.writeScript(script);
  window.dispatchEvent(new CustomEvent(SCRIPT_KEY, { detail: script }));
}

interface IndopakAyah {
  aya: number;
  text: string;
  /** quran.com's numbered words, aligned 1:1 with the audio segments (ADR 0035 §5). */
  words?: string[];
}

// One fetch per surah, shared across every āyah's word component on the page.
const cache = new Map<number, Promise<Map<number, readonly string[]>>>();

/**
 * IndoPak Arabic for a whole surah: `āyah → words`, fetched once from our static
 * `/api/v1/surahs/{n}/indopak` endpoint. The words are quran.com's numbered tokens
 * (so each lines up with the recitation audio for word highlighting); we fall back
 * to splitting `text` if an older payload lacks them. On any failure it resolves to
 * an empty map so the reader simply keeps the Uthmani text.
 */
export function fetchSurahIndopak(surah: number): Promise<Map<number, readonly string[]>> {
  let pending = cache.get(surah);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}/indopak`)
      .then((r) => (r.ok ? (r.json() as Promise<{ ayahs?: IndopakAyah[] }>) : { ayahs: [] }))
      .then(
        (d) =>
          new Map(
            (d.ayahs ?? []).map((a) => [a.aya, a.words ?? a.text.split(" ")] as const),
          ),
      )
      .catch(() => new Map<number, readonly string[]>());
    cache.set(surah, pending);
  }
  return pending;
}
