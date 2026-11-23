import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HadithBrowser } from "./HadithBrowser";

describe("HadithBrowser filters", () => {
  it("announce which book and grade are selected", async () => {
    render(
      <HadithBrowser
        collections={[
          { id: "eng-bukhari", name: "Bukhari" },
          { id: "eng-muslim", name: "Muslim" },
        ]}
      />,
    );
    const all = screen.getAllByRole("button", { name: "All" })[0]!;
    const muslim = screen.getByRole("button", { name: "Muslim" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(muslim).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(muslim);
    expect(muslim).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "All grades" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
