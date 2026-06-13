/**
 * Hadith domain helpers — pure and framework-free. Grading is sensitive Islamic
 * content (the data ships scholar-reviewed); this only derives a coarse category
 * for filtering/colouring from the source's grade strings, and is deliberately
 * conservative and documented so it can be reviewed.
 */

/** A coarse authenticity category for filtering and badge colour. */
export type HadithGrade = "sahih" | "hasan" | "daif" | "unknown";

/** The two Ṣaḥīḥ collections — authentic by scholarly consensus, ungraded at source. */
const SAHIHAYN = new Set(["eng-bukhari", "eng-muslim"]);

/**
 * Derive a single grade category for a hadith from its per-grader grade strings
 * (shaped `"Grader: Grade"`). Ṣaḥīḥ al-Bukhārī and Muslim are categorised
 * `sahih` by consensus. Otherwise the most-cited modern grader (al-Albānī) is
 * preferred, falling back to the first available grade. The full grade strings
 * are kept on the hadith for transparency — this is only a coarse filter key.
 */
export function hadithGradeCategory(
  collectionId: string,
  grades: readonly string[],
): HadithGrade {
  if (SAHIHAYN.has(collectionId)) return "sahih";

  const pick = grades.find((g) => /al-?albani/i.test(g)) ?? grades[0];
  if (!pick) return "unknown";

  // Classify on the grade part only ("Grader: Grade"), letters-only for robustness.
  const gradePart = pick.includes(": ") ? pick.slice(pick.indexOf(": ") + 2) : pick;
  const g = gradePart.toLowerCase().replace(/[^a-z]/g, "");

  if (["daif", "daeef", "weak", "shadh", "munkar", "matruk", "mawdu"].some((k) => g.includes(k))) {
    return "daif";
  }
  if (g.includes("sahih")) return "sahih"; // also "hasansahih", "sahihlighairihi"
  if (g.includes("hasan")) return "hasan";
  return "unknown";
}

/** Display label for a grade category. */
export const HADITH_GRADE_LABEL: Record<HadithGrade, string> = {
  sahih: "Ṣaḥīḥ",
  hasan: "Ḥasan",
  daif: "Ḍaʿīf",
  unknown: "Graded",
};
