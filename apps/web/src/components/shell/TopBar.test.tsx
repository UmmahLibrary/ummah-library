import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Capture router.push; usePathname stays on the Hub so focus doesn't navigate.
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));

import { SearchProvider } from "./SearchContext";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("submitting the search navigates to the results page", async () => {
    render(
      <SearchProvider>
        <TopBar />
      </SearchProvider>,
    );

    await userEvent.type(screen.getByPlaceholderText(/Search the Quran/), "mercy{Enter}");

    expect(push).toHaveBeenCalledWith("/search?q=mercy");
  });

  it("links to the blog", () => {
    render(
      <SearchProvider>
        <TopBar />
      </SearchProvider>,
    );

    expect(screen.getByTitle("Read the blog")).toHaveAttribute("href", "/blog");
  });
});
