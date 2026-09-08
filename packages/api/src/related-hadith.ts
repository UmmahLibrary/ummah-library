/**
 * Related-hadith lookup for an ayah (#200, ADR 0041).
 *
 * The generated link dataset stores **references only** — collection id, hadith
 * number, and the shared span. This module joins those references to the hadith
 * text already bundled in `hadiths/*.json`, so the dataset stays small and the
 * text has exactly one home.
 *
 * Both sides are local files, so a lookup touches no network and works offline.
 */
import type { HadithLink, VerseKey } from "@ummahlibrary/core";
import { hadithRepository, pluginRegistry, verseHadithLinkRepository } from "./repositories";

/** A hadith that quotes an ayah, resolved to its text and grading. */
export interface RelatedHadith {
  collectionId: string;
  /** Human collection name ("Sahih al-Bukhari"), for the card header. */
  collectionName: string;
  number: number;
  /** The English translation. */
  text: string;
  /** The original Arabic, when the collection has an ingested Arabic edition. */
  arabic?: string;
  grades: string[];
  reference: { book: number; hadith: number };
  relation: HadithLink["relation"];
  /**
   * The normalised span the hadith and the ayah share — the evidence for the
   * link. Surfacing it lets a reader judge the connection instead of trusting
   * it, which matters because these links are generated, not curated.
   */
  quote: string;
}

/** Collection id → display name, from the hadith plugin manifests. */
function collectionNames(): Map<string, string> {
  const names = new Map<string, string>();
  for (const plugin of pluginRegistry.byKind("hadith")) names.set(plugin.id, plugin.name);
  return names;
}

/**
 * Every hadith that verbatim quotes the given ayah, ordered as the dataset
 * stores them (collection, then hadith number).
 *
 * A link whose hadith cannot be resolved is dropped rather than surfaced as a
 * blank card: the two datasets are regenerated together, so a dangling
 * reference means one of them is stale, and showing a number with no text would
 * be worse than showing nothing.
 */
export async function relatedHadith(ref: VerseKey): Promise<RelatedHadith[]> {
  const links = await verseHadithLinkRepository.linksForVerse(ref);
  if (links.length === 0) return [];

  const names = collectionNames();
  const out: RelatedHadith[] = [];

  // Group by collection so each collection file is loaded once, not per link.
  const byCollection = new Map<string, HadithLink[]>();
  for (const link of links) {
    const bucket = byCollection.get(link.collectionId);
    if (bucket) bucket.push(link);
    else byCollection.set(link.collectionId, [link]);
  }

  for (const [collectionId, collectionLinks] of byCollection) {
    const collection = await hadithRepository.getCollection(collectionId);
    if (!collection) continue;
    const byNumber = new Map(collection.hadiths.map((h) => [h.number, h]));

    for (const link of collectionLinks) {
      const hadith = byNumber.get(link.number);
      if (!hadith) continue;
      out.push({
        collectionId,
        collectionName: names.get(collectionId) ?? collection.name,
        number: hadith.number,
        text: hadith.text,
        ...(hadith.arabic ? { arabic: hadith.arabic } : {}),
        grades: hadith.grades,
        reference: hadith.reference,
        relation: link.relation,
        quote: link.quote,
      });
    }
  }

  // Restore the dataset's stable order, which grouping above broke.
  out.sort((a, b) => a.collectionId.localeCompare(b.collectionId) || a.number - b.number);
  return out;
}
