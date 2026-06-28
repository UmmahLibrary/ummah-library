/**
 * Arabic script selection (ADR 0035): the reader can render the Quran's Arabic in
 * the Uthmani (default) or IndoPak orthography.
 *
 * The choice persists through the `SettingsStore` port and broadcasts a window
 * event so the per-āyah word components swap live. The IndoPak verse text is
 * **not bundled** — its source forbids redistribution (ADR 0035 amendment; see
 * ATTRIBUTION) — so it is fetched live, per surah, from quran.com for **display
 * only**, the same display-only runtime pattern the word-by-word popover and
 * transliteration use. quran.com's numbered words line up 1:1 with the audio
 * segments, so highlighting / tap-to-hear / the transliteration row all work for
 * IndoPak too. On any failure the reader simply keeps the Uthmani text.
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

interface QuranComWord {
  char_type_name?: string;
  text_indopak?: string | null;
}
interface QuranComVerse {
  verse_key?: string;
  words?: QuranComWord[];
}

// One fetch per surah, shared across every āyah's word component on the page.
const cache = new Map<number, Promise<Map<number, readonly string[]>>>();

/**
 * IndoPak Arabic for a whole surah: `āyah → words`, fetched once at runtime from
 * quran.com (display only — not bundled; its source forbids redistribution). We
 * take quran.com's **numbered words** (`char_type=word`, in recitation order), so
 * each lines up 1:1 with the audio segments for word highlighting and tap-to-hear.
 * A surah fits in one page at `per_page=300`. On any failure it resolves to an
 * empty map so the reader simply keeps the Uthmani text.
 */
export function fetchSurahIndopak(surah: number): Promise<Map<number, readonly string[]>> {
  let pending = cache.get(surah);
  if (!pending) {
    pending = fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}?language=ar&words=true&word_fields=text_indopak&per_page=300`,
    )
      .then((r) => (r.ok ? (r.json() as Promise<{ verses?: QuranComVerse[] }>) : { verses: [] }))
      .then((d) => {
        const map = new Map<number, readonly string[]>();
        for (const v of d.verses ?? []) {
          const aya = Number(v.verse_key?.split(":")[1]);
          if (!Number.isInteger(aya)) continue;
          const words = (v.words ?? [])
            .filter((w) => w.char_type_name === "word")
            .map((w) => (w.text_indopak ?? "").trim())
            .filter((w) => w.length > 0);
          if (words.length) map.set(aya, words);
        }
        return map;
      })
      .catch(() => new Map<number, readonly string[]>());
    cache.set(surah, pending);
  }
  return pending;
}
