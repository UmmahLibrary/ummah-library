/**
 * Loads and validates blog articles from `docs/articles/*.md` at build time
 * (see ADR 0037). An article is **published** — and only then routable and
 * visible — iff its frontmatter has both a real `date` and
 * `status: "published"`; anything else (missing date, `status: "draft"`,
 * or absent entirely) never appears in the index, RSS feed, sitemap, or
 * `generateStaticParams`, so it has no reachable URL.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { Block } from "./blocks";
import { headingsOf, parseMarkdownToBlocks, readingMinutesOf } from "./parse-markdown";
import { isPublished } from "./selectors";

export {
  isPublished,
  getSeriesList,
  getTagList,
  getSeriesNeighbors,
  type SeriesNeighbors,
} from "./selectors";

export interface Article {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  series: string | null;
  order: number;
  date: string | null;
  status: "draft" | "published";
  blocks: Block[];
  headings: { id: string; text: string }[];
  readingMinutes: number;
  /** Source file name, surfaced in validation error messages. */
  file: string;
}

const REQUIRED_STRING_FIELDS = ["title", "description", "canonical_url"] as const;

/** Repo-root `docs/articles` — resolved from this module's own file location. */
export const DEFAULT_ARTICLES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "..",
  "docs",
  "articles",
);

function fail(file: string, message: string): never {
  throw new Error(`docs/articles/${file}: ${message}`);
}

function parseFrontmatter(
  file: string,
  raw: Record<string, unknown>,
): Omit<Article, "blocks" | "headings" | "readingMinutes" | "slug"> & { canonical_url: string } {
  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof raw[field] !== "string" || raw[field] === "") {
      fail(file, `frontmatter field "${field}" is required and must be a non-empty string.`);
    }
  }
  if (!Array.isArray(raw.tags) || raw.tags.some((t) => typeof t !== "string")) {
    fail(file, `frontmatter field "tags" is required and must be an array of strings.`);
  }
  if (typeof raw.order !== "number") {
    fail(file, `frontmatter field "order" is required and must be a number.`);
  }
  if (raw.date !== null && typeof raw.date !== "string") {
    fail(file, `frontmatter field "date" must be a string (YYYY-MM-DD) or null.`);
  }
  if (raw.status !== "draft" && raw.status !== "published") {
    fail(file, `frontmatter field "status" must be "draft" or "published".`);
  }
  if (raw.series !== undefined && raw.series !== null && typeof raw.series !== "string") {
    fail(file, `frontmatter field "series", if present, must be a string or null.`);
  }

  return {
    title: raw.title as string,
    description: raw.description as string,
    tags: raw.tags as string[],
    series: (raw.series as string | null | undefined) ?? null,
    order: raw.order as number,
    date: raw.date as string | null,
    status: raw.status as "draft" | "published",
    canonical_url: raw.canonical_url as string,
    file,
  };
}

/** Parses and validates a single article from its raw Markdown+frontmatter source. Exported for unit testing. */
export function parseArticleFile(file: string, source: string): Article {
  const { data, content } = matter(source);
  const meta = parseFrontmatter(file, data as Record<string, unknown>);
  const blocks = parseMarkdownToBlocks(content);
  return {
    slug: meta.canonical_url,
    title: meta.title,
    description: meta.description,
    tags: meta.tags,
    series: meta.series,
    order: meta.order,
    date: meta.date,
    status: meta.status,
    file,
    blocks,
    headings: headingsOf(blocks),
    readingMinutes: readingMinutesOf(blocks),
  };
}

/** Reads and validates every article in `dir` (every `.md` file except `README.md`). Throws on any invalid file or duplicate slug. */
export function getAllArticles(dir: string = DEFAULT_ARTICLES_DIR): Article[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(
    (f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md",
  );
  const articles = files.map((file) =>
    parseArticleFile(file, readFileSync(join(dir, file), "utf8")),
  );

  const bySlug = new Map<string, string>();
  for (const a of articles) {
    const existing = bySlug.get(a.slug);
    if (existing) {
      throw new Error(
        `docs/articles/${a.file}: canonical_url "${a.slug}" duplicates ${existing} — slugs must be unique.`,
      );
    }
    bySlug.set(a.slug, a.file);
  }

  return articles;
}

/** Published articles only, newest first — the set that is ever routable or visible. */
export function getPublishedArticles(dir: string = DEFAULT_ARTICLES_DIR): Article[] {
  return getAllArticles(dir)
    .filter(isPublished)
    .sort((a, b) => (a.date! < b.date! ? 1 : a.date! > b.date! ? -1 : 0));
}

export function getArticleBySlug(
  slug: string,
  dir: string = DEFAULT_ARTICLES_DIR,
): Article | undefined {
  return getPublishedArticles(dir).find((a) => a.slug === slug);
}
