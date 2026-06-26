/**
 * Per-word transliteration for the reader (#144), fetched at runtime from
 * quran.com — display-only, not bundled (mirrors the web `lib/word-translit`).
 * One request per surah (a surah fits in a single page at `per_page=300`),
 * memoised so a surah is fetched at most once per session.
 */
interface QuranComWord {
  char_type_name?: string;
  transliteration?: { text: string | null } | null;
}
interface QuranComVerse {
  verse_key?: string;
  words?: QuranComWord[];
}

const cache = new Map<number, Promise<Map<number, string[]>>>();

/** `āyah → [transliteration per word]` for a whole surah; empty map on any failure. */
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
          map.set(
            aya,
            (v.words ?? [])
              .filter((w) => w.char_type_name === "word")
              .map((w) => w.transliteration?.text ?? ""),
          );
        }
        return map;
      })
      .catch(() => new Map<number, string[]>());
    cache.set(surah, pending);
  }
  return pending;
}
