import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Article } from "../../lib/blog/articles";
import { SeriesNav } from "./SeriesNav";

function article(overrides: Partial<Article>): Article {
  return {
    slug: "slug",
    title: "Title",
    description: "D",
    tags: [],
    series: "S",
    order: 1,
    date: "2026-01-01",
    status: "published",
    blocks: [],
    headings: [],
    readingMinutes: 1,
    file: "f.md",
    ...overrides,
  };
}

describe("SeriesNav", () => {
  it("renders only the back-to-index link when neither neighbor exists", () => {
    render(<SeriesNav prev={null} next={null} />);
    expect(screen.getByText("← Back to all posts")).toBeInTheDocument();
    expect(screen.queryByText("Previous in series")).not.toBeInTheDocument();
    expect(screen.queryByText("Next in series")).not.toBeInTheDocument();
  });

  it("renders only prev when there is no next", () => {
    render(<SeriesNav prev={article({ slug: "p", title: "Prev Post" })} next={null} />);
    expect(screen.getByText("Prev Post")).toBeInTheDocument();
    expect(screen.queryByText("Next in series")).not.toBeInTheDocument();
  });

  it("renders only next when there is no prev", () => {
    render(<SeriesNav prev={null} next={article({ slug: "n", title: "Next Post" })} />);
    expect(screen.getByText("Next Post")).toBeInTheDocument();
    expect(screen.queryByText("Previous in series")).not.toBeInTheDocument();
  });

  it("renders both when both exist, each linking to the right slug", () => {
    render(
      <SeriesNav
        prev={article({ slug: "prev-slug", title: "Prev Post" })}
        next={article({ slug: "next-slug", title: "Next Post" })}
      />,
    );
    expect(screen.getByText("Prev Post").closest("a")).toHaveAttribute("href", "/blog/prev-slug");
    expect(screen.getByText("Next Post").closest("a")).toHaveAttribute("href", "/blog/next-slug");
  });
});
