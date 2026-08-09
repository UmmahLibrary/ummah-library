import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Article } from "../../lib/blog/articles";
import { BlogIndexClient } from "./BlogIndexClient";

function article(overrides: Partial<Article>): Article {
  return {
    slug: "slug",
    title: "Title",
    description: "Description",
    tags: [],
    series: null,
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

describe("BlogIndexClient", () => {
  it("shows an empty state when there are no published articles", () => {
    render(<BlogIndexClient articles={[]} />);
    expect(screen.getByText("No posts yet — check back soon.")).toBeInTheDocument();
  });

  it("renders every article and hides the filter bar with too few series/tags", () => {
    const articles = [
      article({ slug: "a", title: "A", tags: ["x"] }),
      article({ slug: "b", title: "B", tags: ["x"] }),
    ];
    render(<BlogIndexClient articles={articles} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });

  it("filters by series and shows a no-match state", async () => {
    const articles = [
      article({ slug: "a", title: "A", series: "Series One" }),
      article({ slug: "b", title: "B", series: "Series Two" }),
    ];
    render(<BlogIndexClient articles={articles} />);
    await userEvent.click(screen.getByRole("button", { name: "Series Two" }));
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Series One" }));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });

  it("paginates with Load more", async () => {
    const articles = Array.from({ length: 9 }, (_, i) =>
      article({ slug: `p${i}`, title: `Post ${i}`, series: i % 2 === 0 ? "S1" : "S2" }),
    );
    render(<BlogIndexClient articles={articles} />);
    expect(screen.getByText("Post 0")).toBeInTheDocument();
    expect(screen.queryByText("Post 8")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Load 1 more/ }));
    expect(screen.getByText("Post 8")).toBeInTheDocument();
  });
});
