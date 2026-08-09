import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getAllArticles,
  getArticleBySlug,
  getPublishedArticles,
  getSeriesList,
  getSeriesNeighbors,
  getTagList,
  isPublished,
  parseArticleFile,
} from "./articles";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");
const VALID_DIR = join(FIXTURES, "valid");
const DUPLICATE_DIR = join(FIXTURES, "duplicate-slug");

const VALID_FRONTMATTER = `---
title: "T"
description: "D"
tags: ["a"]
series: null
order: 1
date: "2026-01-01"
canonical_url: "t"
status: "published"
---

Body.
`;

function withField(field: string, value: string): string {
  const lines = VALID_FRONTMATTER.split("\n");
  const idx = lines.findIndex((l) => l.startsWith(`${field}:`));
  lines[idx] = value;
  return lines.join("\n");
}

describe("parseArticleFile — frontmatter validation", () => {
  it("parses a fully valid article", () => {
    const article = parseArticleFile("t.md", VALID_FRONTMATTER);
    expect(article.title).toBe("T");
    expect(article.slug).toBe("t");
    expect(article.series).toBeNull();
    expect(article.blocks).toEqual([{ type: "p", text: ["Body."] }]);
    expect(article.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it("rejects a missing title", () => {
    expect(() => parseArticleFile("bad.md", withField("title", "title: 123"))).toThrow(
      /title.*required/i,
    );
  });

  it("rejects a missing description", () => {
    expect(() => parseArticleFile("bad.md", withField("description", ""))).toThrow(
      /description.*required/i,
    );
  });

  it("rejects a missing canonical_url", () => {
    expect(() =>
      parseArticleFile("bad.md", withField("canonical_url", "canonical_url: 5")),
    ).toThrow(/canonical_url.*required/i);
  });

  it("rejects tags that aren't an array of strings", () => {
    expect(() => parseArticleFile("bad.md", withField("tags", 'tags: "not-an-array"'))).toThrow(
      /tags.*array of strings/i,
    );
    expect(() => parseArticleFile("bad.md", withField("tags", "tags: [1, 2]"))).toThrow(
      /tags.*array of strings/i,
    );
  });

  it("rejects a non-numeric order", () => {
    expect(() => parseArticleFile("bad.md", withField("order", 'order: "one"'))).toThrow(
      /order.*number/i,
    );
  });

  it("rejects a date that is neither a string nor null", () => {
    expect(() => parseArticleFile("bad.md", withField("date", "date: 20260101"))).toThrow(
      /date.*YYYY-MM-DD.*null/i,
    );
  });

  it("rejects a status other than draft/published", () => {
    expect(() => parseArticleFile("bad.md", withField("status", 'status: "live"'))).toThrow(
      /status.*draft.*published/i,
    );
  });

  it("rejects a series that isn't a string or null", () => {
    expect(() => parseArticleFile("bad.md", withField("series", "series: 5"))).toThrow(
      /series.*string or null/i,
    );
  });

  it("defaults series to null when omitted entirely", () => {
    const noSeries = VALID_FRONTMATTER.replace("series: null\n", "");
    expect(parseArticleFile("t.md", noSeries).series).toBeNull();
  });
});

describe("isPublished — the gating rule", () => {
  it("requires both a date and status published", () => {
    expect(isPublished({ date: "2026-01-01", status: "published" })).toBe(true);
    expect(isPublished({ date: null, status: "published" })).toBe(false);
    expect(isPublished({ date: "2026-01-01", status: "draft" })).toBe(false);
    expect(isPublished({ date: null, status: "draft" })).toBe(false);
  });
});

describe("getAllArticles / getPublishedArticles (fixture directory)", () => {
  it("returns an empty array for a directory that doesn't exist", () => {
    expect(getAllArticles(join(FIXTURES, "does-not-exist"))).toEqual([]);
    expect(getPublishedArticles(join(FIXTURES, "does-not-exist"))).toEqual([]);
  });

  it("reads every .md file in the directory except README.md", () => {
    const articles = getAllArticles(VALID_DIR);
    expect(articles).toHaveLength(5);
    expect(articles.map((a) => a.file)).not.toContain("README.md");
  });

  it("excludes draft and undated articles from the published set", () => {
    const published = getPublishedArticles(VALID_DIR);
    const slugs = published.map((a) => a.slug);
    expect(slugs).not.toContain("draft-post");
    expect(slugs).not.toContain("dated-draft-post");
    expect(slugs).toEqual(expect.arrayContaining(["first-post", "second-post", "standalone-post"]));
    expect(published).toHaveLength(3);
  });

  it("sorts published articles newest date first", () => {
    const published = getPublishedArticles(VALID_DIR);
    expect(published.map((a) => a.slug)).toEqual(["standalone-post", "second-post", "first-post"]);
  });

  it("throws a descriptive error on a duplicate canonical_url", () => {
    expect(() => getAllArticles(DUPLICATE_DIR)).toThrow(/same-slug.*duplicates/i);
  });
});

describe("getArticleBySlug", () => {
  it("finds a published article by slug", () => {
    expect(getArticleBySlug("first-post", VALID_DIR)?.title).toBe("The First Post");
  });

  it("returns undefined for a draft slug — it is not routable", () => {
    expect(getArticleBySlug("draft-post", VALID_DIR)).toBeUndefined();
  });

  it("returns undefined for an unknown slug", () => {
    expect(getArticleBySlug("nope", VALID_DIR)).toBeUndefined();
  });
});

describe("getSeriesList / getTagList", () => {
  it("lists distinct series among published articles", () => {
    expect(getSeriesList(getPublishedArticles(VALID_DIR))).toEqual(["Test Series"]);
  });

  it("lists distinct tags, alphabetically", () => {
    expect(getTagList(getPublishedArticles(VALID_DIR))).toEqual([
      "architecture",
      "standalone",
      "testing",
      "typescript",
    ]);
  });
});

describe("getSeriesNeighbors", () => {
  const published = getPublishedArticles(VALID_DIR);

  it("has no neighbors for a standalone (no-series) article", () => {
    const standalone = published.find((a) => a.slug === "standalone-post")!;
    expect(getSeriesNeighbors(standalone, published)).toEqual({ prev: null, next: null });
  });

  it("finds the next article in the series (oldest -> newest)", () => {
    const first = published.find((a) => a.slug === "first-post")!;
    const { prev, next } = getSeriesNeighbors(first, published);
    expect(prev).toBeNull();
    expect(next?.slug).toBe("second-post");
  });

  it("finds the previous article in the series", () => {
    const second = published.find((a) => a.slug === "second-post")!;
    const { prev, next } = getSeriesNeighbors(second, published);
    expect(prev?.slug).toBe("first-post");
    expect(next).toBeNull();
  });
});
