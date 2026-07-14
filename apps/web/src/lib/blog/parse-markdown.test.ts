import { describe, expect, it } from "vitest";
import { headingsOf, parseMarkdownToBlocks, readingMinutesOf } from "./parse-markdown";

describe("parseMarkdownToBlocks", () => {
  it("parses a paragraph with plain text", () => {
    const blocks = parseMarkdownToBlocks("Hello world.");
    expect(blocks).toEqual([{ type: "p", text: ["Hello world."] }]);
  });

  it("parses bold, italic and inline code within a paragraph", () => {
    const [block] = parseMarkdownToBlocks("A **bold** word, an *italic* word, and `code`.");
    expect(block).toEqual({
      type: "p",
      text: [
        "A ",
        { bold: "bold" },
        " word, an ",
        { italic: "italic" },
        " word, and ",
        { code: "code" },
        ".",
      ],
    });
  });

  it("parses the :ar[]{translit=} directive as an inline Arabic term", () => {
    const [block] = parseMarkdownToBlocks("Say :ar[قِبْلَة]{translit=qibla} please.");
    expect(block).toEqual({
      type: "p",
      text: ["Say ", { ar: "قِبْلَة", translit: "qibla" }, " please."],
    });
  });

  it("assigns h2 blocks a stable, slugified id and ignores h1/h4", () => {
    const blocks = parseMarkdownToBlocks("# Title\n\n## The Shape of the Repo!\n\n#### Too deep");
    expect(blocks).toEqual([
      { type: "h2", text: "The Shape of the Repo!", id: "h-0-the-shape-of-the-repo" },
    ]);
  });

  it("parses h3 as plain subheadings", () => {
    const blocks = parseMarkdownToBlocks("### A subheading");
    expect(blocks).toEqual([{ type: "h3", text: "A subheading" }]);
  });

  it("parses an unordered list with inline formatting per item", () => {
    const blocks = parseMarkdownToBlocks("- plain item\n- item with **emphasis**");
    expect(blocks).toEqual([
      { type: "ul", items: [["plain item"], ["item with ", { bold: "emphasis" }]] },
    ]);
  });

  it("parses an ordered list", () => {
    const blocks = parseMarkdownToBlocks("1. first\n2. second");
    expect(blocks).toEqual([{ type: "ol", items: [["first"], ["second"]] }]);
  });

  it("parses a blockquote with no citation", () => {
    const blocks = parseMarkdownToBlocks("> Just a quote.");
    expect(blocks).toEqual([{ type: "quote", text: ["Just a quote."] }]);
  });

  it("splits a trailing em-dash paragraph into a citation", () => {
    const blocks = parseMarkdownToBlocks("> The rule that matters.\n>\n> — Internal ADR-0003");
    expect(blocks).toEqual([
      { type: "quote", text: ["The rule that matters."], cite: "Internal ADR-0003" },
    ]);
  });

  it("parses a thematic break", () => {
    expect(parseMarkdownToBlocks("---")).toEqual([{ type: "hr" }]);
  });

  it("parses a GFM table", () => {
    const blocks = parseMarkdownToBlocks("| A | B |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |");
    expect(blocks).toEqual([
      {
        type: "table",
        head: ["A", "B"],
        rows: [
          ["1", "2"],
          ["3", "4"],
        ],
      },
    ]);
  });

  it("parses a fenced code block with a language", () => {
    const blocks = parseMarkdownToBlocks("```ts\nconst x = 1;\n```");
    expect(blocks).toEqual([{ type: "code", lang: "ts", code: "const x = 1;" }]);
  });

  it("defaults an unlabeled fenced code block to text", () => {
    const blocks = parseMarkdownToBlocks("```\nplain\n```");
    expect(blocks).toEqual([{ type: "code", lang: "text", code: "plain" }]);
  });

  it("turns a mermaid fence into a diagram block with an optional caption", () => {
    const blocks = parseMarkdownToBlocks(
      '```mermaid caption="apps to core"\ngraph TD; A-->B;\n```',
    );
    expect(blocks).toEqual([
      { type: "diagram", code: "graph TD; A-->B;", caption: "apps to core" },
    ]);
  });

  it("omits the caption field when a mermaid fence has none", () => {
    const [block] = parseMarkdownToBlocks("```mermaid\ngraph TD; A-->B;\n```");
    expect(block).toEqual({ type: "diagram", code: "graph TD; A-->B;" });
    expect(block).not.toHaveProperty("caption");
  });

  it("skips unsupported node types (e.g. raw HTML) rather than guessing", () => {
    const blocks = parseMarkdownToBlocks("<div>raw html</div>\n\nA real paragraph.");
    expect(blocks).toEqual([{ type: "p", text: ["A real paragraph."] }]);
  });
});

describe("headingsOf", () => {
  it("extracts only h2 blocks as the table of contents", () => {
    const blocks = parseMarkdownToBlocks("## One\n\nBody\n\n### Sub\n\n## Two");
    expect(headingsOf(blocks)).toEqual([
      { id: "h-0-one", text: "One" },
      { id: "h-1-two", text: "Two" },
    ]);
  });

  it("returns an empty array for an article with no h2 headings", () => {
    expect(headingsOf(parseMarkdownToBlocks("Just a paragraph."))).toEqual([]);
  });
});

describe("readingMinutesOf", () => {
  it("is always at least 1 minute", () => {
    expect(readingMinutesOf(parseMarkdownToBlocks("One two."))).toBe(1);
  });

  it("scales with word count across block types at ~200wpm", () => {
    const words = Array.from({ length: 450 }, (_, i) => `word${i}`).join(" ");
    const blocks = parseMarkdownToBlocks(`## Heading also has words\n\n${words}\n\n- ${words}`);
    // 450 (paragraph) + 450 (list item) + a handful in the heading, at 200wpm.
    expect(readingMinutesOf(blocks)).toBeGreaterThanOrEqual(4);
  });

  it("counts table cell words", () => {
    const blocks = parseMarkdownToBlocks(
      "| Column Header | Another |\n| - | - |\n| cell value | more words here |",
    );
    expect(readingMinutesOf(blocks)).toBe(1);
  });

  it("counts blockquote words", () => {
    const blocks = parseMarkdownToBlocks("> A quoted sentence with several words in it.");
    expect(readingMinutesOf(blocks)).toBe(1);
  });
});
