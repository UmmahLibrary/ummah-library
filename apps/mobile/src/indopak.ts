/**
 * IndoPak Arabic verse text for the reader (ADR 0035), fetched at runtime from
 * quran.com — display-only, **not bundled** (its source forbids redistribution;
 * mirrors the web `lib/script`). One request per surah (`per_page=300` fits a
 * whole surah), memoised so a surah is fetched at most once per session. We take
 * quran.com's numbered words (`char_type=word`, in recitation order), so they
 * line up 1:1 with the audio timing segments for word highlighting.
 */
interface QuranComWord {
  char_type_name?: string;
  text_indopak?: string | null;
}
interface QuranComVerse {
  verse_key?: string;
  words?: QuranComWord[];
}

const cache = new Map<number, Promise<Map<number, string[]>>>();

/** `āyah → [IndoPak word]` for a whole surah; empty map on any failure. */
export function fetchSurahIndopak(surah: number): Promise<Map<number, string[]>> {
  let pending = cache.get(surah);
  if (!pending) {
    pending = fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surah}?language=ar&words=true&word_fields=text_indopak&per_page=300`,
    )
      .then((r) => (r.ok ? (r.json() as Promise<{ verses?: QuranComVerse[] }>) : { verses: [] }))
      .then((d) => {
        const map = new Map<number, string[]>();
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
      .catch(() => new Map<number, string[]>());
    cache.set(surah, pending);
  }
  return pending;
}
