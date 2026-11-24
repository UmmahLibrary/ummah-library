import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedHadith } from "./RelatedHadith";

afterEach(() => vi.unstubAllGlobals());

const item = {
  collectionId: "eng-abudawud",
  collectionName: "Sunan Abi Dawud",
  number: 1223,
  text: "A narration",
  grades: [],
  reference: { book: 4, hadith: 1223 },
  relation: "quotes",
  quote: "لقد كان لكم",
};

describe("RelatedHadith", () => {
  it("retries after a failed load instead of caching the failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const first = render(<RelatedHadith surah={33} aya={21} />);
    expect(await screen.findByText(/couldn/i)).toBeInTheDocument();
    first.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ verse: "33:21", count: 1, hadiths: [item] }),
      }),
    );
    render(<RelatedHadith surah={33} aya={21} />);
    const link = await screen.findByRole("link", { name: /Sunan Abi Dawud · 1223/ });
    expect(link).toHaveAttribute("href", "/hadith?collection=eng-abudawud&hadith=1223");
  });
});
