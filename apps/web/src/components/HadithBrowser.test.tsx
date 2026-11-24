import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("HadithBrowser deep link", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("opens on the one hadith named by ?collection=&hadith= (the reader's Related links)", async () => {
    window.history.replaceState(null, "", "/hadith?collection=eng-abudawud&hadith=2");
    const hadith = (number: number, text: string) => ({
      collectionId: "eng-abudawud",
      number,
      text,
      grades: [],
      reference: { book: 1, hadith: number },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "eng-abudawud",
            sections: { "1": "Purification" },
            hadiths: [hadith(1, "First narration"), hadith(2, "Second narration")],
          }),
      }),
    );

    render(<HadithBrowser collections={[{ id: "eng-abudawud", name: "Abu Dawud" }]} />);

    expect(await screen.findByText("Second narration")).toBeInTheDocument();
    expect(screen.queryByText("First narration")).not.toBeInTheDocument();

    // Clearing the deep link shows the whole collection again.
    await userEvent.click(screen.getByRole("button", { name: "All grades" }));
    expect(await screen.findByText("First narration")).toBeInTheDocument();
  });
});
