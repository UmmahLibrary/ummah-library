import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Block } from "../../lib/blog/blocks";
import { ArticleBody } from "./ArticleBody";

describe("ArticleBody", () => {
  it("renders a paragraph with bold, italic, code and an Arabic term", () => {
    const blocks: Block[] = [
      {
        type: "p",
        text: [
          "Plain ",
          { bold: "bold" },
          " ",
          { italic: "italic" },
          " ",
          { code: "code" },
          " ",
          { ar: "قِبْلَة", translit: "qibla" },
        ],
      },
    ];
    render(<ArticleBody blocks={blocks} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(screen.getByText("قِبْلَة")).toBeInTheDocument();
    expect(screen.getByText("(qibla)")).toBeInTheDocument();
  });

  it("renders headings with the h2 anchor id", () => {
    const blocks: Block[] = [{ type: "h2", text: "A Heading", id: "h-0-a-heading" }];
    render(<ArticleBody blocks={blocks} />);
    const heading = screen.getByRole("heading", { level: 2, name: "A Heading" });
    expect(heading).toHaveAttribute("id", "h-0-a-heading");
  });

  it("renders lists, a quote with a citation, and a rule", () => {
    const blocks: Block[] = [
      { type: "ul", items: [["one"], ["two"]] },
      { type: "quote", text: ["Quoted text."], cite: "A Source" },
      { type: "hr" },
    ];
    render(<ArticleBody blocks={blocks} />);
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("A Source")).toBeInTheDocument();
    expect(document.querySelector("hr")).toBeInTheDocument();
  });

  it("renders a table with head and rows", () => {
    const blocks: Block[] = [{ type: "table", head: ["A", "B"], rows: [["1", "2"]] }];
    render(<ArticleBody blocks={blocks} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders a code block via CodeBlock", () => {
    const blocks: Block[] = [{ type: "code", lang: "ts", code: "const x = 1;" }];
    render(<ArticleBody blocks={blocks} />);
    expect(screen.getByText("ts")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
