/**
 * Pure, fs-free selectors over already-loaded articles — safe to import from
 * client components (unlike `articles.ts`, which reads `docs/articles` via
 * `node:fs` and must stay server-only; see ADR 0037).
 */
import type { Article } from "./articles";

/** An article is public iff it has both a real date and `status: "published"`. */
export function isPublished(article: Pick<Article, "date" | "status">): boolean {
  return article.date !== null && article.status === "published";
}

/** Distinct series among published articles, in order of first appearance (newest-first order). */
export function getSeriesList(published: readonly Article[]): string[] {
  return [...new Set(published.map((a) => a.series).filter((s): s is string => s !== null))];
}

/** Distinct tags among the given articles, alphabetical. */
export function getTagList(published: readonly Article[]): string[] {
  return [...new Set(published.flatMap((a) => a.tags))].sort();
}

export interface SeriesNeighbors {
  prev: Article | null;
  next: Article | null;
}

/**
 * The previous/next article in the same series, ordered by publish date.
 * A standalone post (no series), or one with no neighbor on a side, simply
 * has that side be `null` — never a dead link.
 */
export function getSeriesNeighbors(
  article: Article,
  published: readonly Article[],
): SeriesNeighbors {
  if (!article.series) return { prev: null, next: null };
  const siblings = published
    .filter((a) => a.series === article.series)
    .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
  const idx = siblings.findIndex((a) => a.slug === article.slug);
  return {
    prev: idx > 0 ? siblings[idx - 1]! : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1]! : null,
  };
}
