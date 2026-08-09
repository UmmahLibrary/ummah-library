import { describe, expect, it } from "vitest";
import type { Article } from "./articles";
import { buildRssFeed } from "./feed";

function article(overrides: Partial<Article>): Article {
  return {
    slug: "a",
    title: "A",
    description: "D",
    tags: [],
    series: null,
    order: 1,
    date: "2026-01-01",
    status: "published",
    blocks: [],
    headings: [],
    readingMinutes: 1,
    file: "a.md",
    ...overrides,
  };
}

describe("buildRssFeed", () => {
  it("produces a well-formed RSS 2.0 channel with no items", () => {
    const xml = buildRssFeed([], "https://ummahlibrary.org");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<link>https://ummahlibrary.org/blog</link>");
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("<lastBuildDate>");
  });

  it("emits one <item> per article with an absolute link and guid", () => {
    const xml = buildRssFeed(
      [article({ slug: "hello-world", title: "Hello World", date: "2026-05-01" })],
      "https://ummahlibrary.org",
    );
    expect(xml).toContain("<title>Hello World</title>");
    expect(xml).toContain("<link>https://ummahlibrary.org/blog/hello-world</link>");
    expect(xml).toContain("<guid>https://ummahlibrary.org/blog/hello-world</guid>");
    expect(xml).toContain("<lastBuildDate>");
  });

  it("escapes XML-special characters in title and description", () => {
    const xml = buildRssFeed(
      [article({ title: "A & B <Title>", description: 'Quote "this" & that' })],
      "https://ummahlibrary.org",
    );
    expect(xml).toContain("A &amp; B &lt;Title&gt;");
    expect(xml).toContain("Quote &quot;this&quot; &amp; that");
  });

  it("orders items exactly as given (caller is responsible for sort order)", () => {
    const xml = buildRssFeed(
      [
        article({ slug: "second", title: "Second", date: "2026-02-01" }),
        article({ slug: "first", title: "First", date: "2026-01-01" }),
      ],
      "https://ummahlibrary.org",
    );
    expect(xml.indexOf("Second")).toBeLessThan(xml.indexOf("First"));
  });
});
