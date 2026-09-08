/**
 * Verse↔hadith links by **verbatim quotation** (#200, ADR 0041).
 *
 * A hadith is linked to an ayah only when its Arabic text contains a contiguous
 * run of that ayah's own words. That is a *factual* claim about two texts we
 * already ship — not an interpretive one — which is what makes it shippable
 * without scholar review, unlike a topical mapping.
 *
 * Pure and deterministic: no I/O, no clock. The ingest script drives it at build
 * time (`packages/data`), and the tests drive it directly.
 */
import { normalizeForSearch } from "./search";
import type { VerseKey } from "./entities";

/**
 * How many consecutive words must coincide before a match counts.
 *
 * The trade-off is entirely about noise. Arabic religious prose shares a great
 * deal of fixed phrasing with the Qurʾān — invocations, divine names, formulae —
 * so a short threshold links half the corpus to a handful of common verses and
 * the feature becomes worthless. A longer one loses genuine short quotations.
 *
 * Six is chosen empirically (see `verse-hadith.test.ts` and the ADR): it clears
 * the formulae that dominate at three and four words while still catching the
 * ordinary case of a narrator reciting a verse or a clause of one. It is a
 * parameter, not a constant baked into the algorithm, so it can be retuned
 * without touching the matcher.
 */
export const MIN_QUOTE_WORDS = 6;

/** How a hadith is connected to a verse. Only `"quotes"` is produced today. */
export type HadithLinkRelation = "quotes";

/** A hadith connected to a verse, resolved to text by the repository layer. */
export interface HadithLink {
  collectionId: string;
  /** The hadith number within its collection. */
  number: number;
  relation: HadithLinkRelation;
  /**
   * The matched span, normalised — the words the hadith and the ayah share.
   * Kept so the UI can say *why* two texts are linked, and so a reviewer can
   * audit a suspicious link without re-running the matcher.
   */
  quote: string;
}

/** The minimum a verse must expose for indexing. */
export interface IndexableVerse {
  sura: number;
  aya: number;
  text: string;
}

/** The minimum a hadith must expose to be scanned. */
export interface ScannableHadith {
  collectionId: string;
  number: number;
  /** The Arabic text. A hadith without one cannot be scanned. */
  arabic?: string;
}

/** Split normalised Arabic into words, dropping empties. */
function words(text: string): string[] {
  return normalizeForSearch(text).split(/\s+/).filter(Boolean);
}

/** `sura:aya`, the repo's usual verse key form. */
function keyOf(v: { sura: number; aya: number }): string {
  return `${v.sura}:${v.aya}`;
}

/**
 * An n-gram index over the Qurʾān: every window of `minWords` consecutive words
 * in every verse, mapped to the verses containing it.
 *
 * A window maps to *many* verses, not one — the Qurʾān repeats itself
 * (mutashābihāt), so an identical phrase legitimately belongs to several ayahs
 * and a hadith quoting it is quoting all of them.
 */
export interface VerseIndex {
  readonly minWords: number;
  /** window text → the verse keys that contain it. */
  readonly windows: ReadonlyMap<string, readonly string[]>;
}

/**
 * Build the index. Verses shorter than `minWords` are **not indexed at all** —
 * they cannot produce a window, so they can never be matched.
 *
 * That exclusion is doing real work rather than being an edge case: it is what
 * silently drops the Basmala (four words normalised), which prefixes most surahs
 * and opens a great many hadith. Without it the Basmala would be far and away
 * the most "quoted" verse in the corpus and would swamp every other link.
 */
export function buildVerseIndex(
  verses: readonly IndexableVerse[],
  minWords: number = MIN_QUOTE_WORDS,
): VerseIndex {
  const windows = new Map<string, string[]>();
  for (const verse of verses) {
    const w = words(verse.text);
    if (w.length < minWords) continue;
    const key = keyOf(verse);
    for (let i = 0; i + minWords <= w.length; i++) {
      const window = w.slice(i, i + minWords).join(" ");
      const bucket = windows.get(window);
      if (bucket) {
        // The same window can occur twice inside one verse (repeated refrains).
        if (!bucket.includes(key)) bucket.push(key);
      } else {
        windows.set(window, [key]);
      }
    }
  }
  return { minWords, windows };
}

/** A verse a hadith quotes, with the longest span the two share. */
export interface VerseQuotation {
  verse: string;
  quote: string;
}

/**
 * Find the verses a hadith quotes verbatim.
 *
 * Slides the same window over the hadith and reports every verse that shares
 * one. Where several adjacent windows hit the same verse — the usual case, since
 * a real quotation is longer than the threshold — they are merged so the
 * reported `quote` is the whole shared span rather than its first six words.
 */
export function findQuotations(arabic: string, index: VerseIndex): VerseQuotation[] {
  const w = words(arabic);
  const { minWords } = index;
  if (w.length < minWords) return [];

  // verse key → the window start offsets in this hadith that hit it.
  const hits = new Map<string, number[]>();
  for (let i = 0; i + minWords <= w.length; i++) {
    const window = w.slice(i, i + minWords).join(" ");
    for (const verse of index.windows.get(window) ?? []) {
      const offsets = hits.get(verse);
      if (offsets) offsets.push(i);
      else hits.set(verse, [i]);
    }
  }

  const out: VerseQuotation[] = [];
  for (const [verse, offsets] of hits) {
    // Merge consecutive offsets into runs; the longest run is the shared span.
    let bestStart = offsets[0]!;
    let bestEnd = bestStart + minWords;
    let runStart = offsets[0]!;
    for (let i = 1; i <= offsets.length; i++) {
      const contiguous = i < offsets.length && offsets[i] === offsets[i - 1]! + 1;
      if (!contiguous) {
        const end = offsets[i - 1]! + minWords;
        if (end - runStart > bestEnd - bestStart) {
          bestStart = runStart;
          bestEnd = end;
        }
        if (i < offsets.length) runStart = offsets[i]!;
      }
    }
    out.push({ verse, quote: w.slice(bestStart, bestEnd).join(" ") });
  }

  // Stable order: by surah then ayah, so the ingest output is reproducible.
  out.sort((a, b) => {
    const [as, aa] = a.verse.split(":").map(Number) as [number, number];
    const [bs, ba] = b.verse.split(":").map(Number) as [number, number];
    return as - bs || aa - ba;
  });
  return out;
}

/**
 * Scan a whole corpus, producing the verse → hadith-links map the dataset ships.
 *
 * Keyed by `sura:aya`; hadith without Arabic are skipped (they carry nothing to
 * match). Link order within a verse follows collection then number, so the
 * generated dataset is byte-stable across runs.
 */
export function buildVerseHadithLinks(
  verses: readonly IndexableVerse[],
  hadiths: readonly ScannableHadith[],
  minWords: number = MIN_QUOTE_WORDS,
): Record<string, HadithLink[]> {
  const index = buildVerseIndex(verses, minWords);
  const links: Record<string, HadithLink[]> = {};

  for (const hadith of hadiths) {
    if (!hadith.arabic) continue;
    for (const { verse, quote } of findQuotations(hadith.arabic, index)) {
      (links[verse] ??= []).push({
        collectionId: hadith.collectionId,
        number: hadith.number,
        relation: "quotes",
        quote,
      });
    }
  }

  for (const list of Object.values(links)) {
    list.sort((a, b) => a.collectionId.localeCompare(b.collectionId) || a.number - b.number);
  }
  return links;
}

/** Parse a `sura:aya` key back into a {@link VerseKey}. */
export function parseVerseKey(key: string): VerseKey | null {
  const [sura, aya] = key.split(":").map(Number);
  if (!sura || !aya || !Number.isInteger(sura) || !Number.isInteger(aya)) return null;
  return { sura, aya };
}
