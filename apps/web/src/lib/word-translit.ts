/**
 * Word-by-word transliteration (#144): a reader toggle that renders a Latin
 * transliteration beneath each Arabic word.
 *
 * The per-word text is fetched at runtime from quran.com (the same source the
 * word-by-word popover already uses — display-only, not bundled; see
 * ATTRIBUTION). The on/off flag persists through the `SettingsStore` port and
 * broadcasts a window event so the per-āyah word components update live.
 */
import { webSettingsStore as store } from "./settings-store";

/** Window event broadcast when the word-transliteration toggle changes. */
export const WORD_TRANSLIT_KEY = "ul.wbwTranslit";

/** Body class that drives the per-word stacked layout in CSS. */
export const WORD_TRANSLIT_CLASS = "wbw-translit-on";

export async function readWordTranslit(): Promise<boolean> {
  return (await store.read()).wordTransliteration ?? false;
}

export async function writeWordTranslit(on: boolean): Promise<void> {
  await store.writeWordTransliteration(on);
  window.dispatchEvent(new CustomEvent(WORD_TRANSLIT_KEY, { detail: on }));
}

interface QuranComWord {
  char_type_name?: string;
  transliteration?: { text: string | null } | null;
}
interface QuranComVerse {
  verse_key?: string;
  words?: QuranComWord[];
}

// One fetch per surah, shared across every āyah's word component on the page.
const cache = new Map<number, Promise<Map<number, string[]>>>();

/**
 * Per-word transliterations for a whole surah: `āyah → [translit per word]`,
 * fetched once from quran.com (a surah fits in one page at `per_page=300`). On
 * any failure it resolves to an empty map so the reader simply shows no row.
 */
export function fetchSurahWordTranslit(surah: number): Promise<Map<number, string[]>> {
  let pending = cache.get(surah);
  if (!pending) {
    pending = fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}?words=true&word_fields=transliteration&per_page=300`,
    )
      .then((r) => (r.ok ? (r.json() as Promise<{ verses?: QuranComVerse[] }>) : { verses: [] }))
      .then((d) => {
        const map = new Map<number, string[]>();
        for (const v of d.verses ?? []) {
          const aya = Number(v.verse_key?.split(":")[1]);
          if (!Number.isInteger(aya)) continue;
          const words = (v.words ?? [])
            .filter((w) => w.char_type_name === "word")
            .map((w) => w.transliteration?.text ?? "");
          map.set(aya, words);
        }
        return map;
      })
      .catch(() => new Map<number, string[]>());
    cache.set(surah, pending);
  }
  return pending;
}
