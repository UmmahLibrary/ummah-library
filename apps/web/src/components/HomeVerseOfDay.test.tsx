import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HomeVerseOfDay } from "./HomeVerseOfDay";

describe("HomeVerseOfDay", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the label immediately, then the fetched āyah, translation and a named deep link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ayah: { text: "ٱلْحَمْدُ لِلَّٰهِ رَبِّ ٱلْعَٰلَمِينَ" },
          translation: { text: "All praise is for Allah—Lord of all worlds." },
        }),
      })),
    );

    render(<HomeVerseOfDay nameOf={() => "Al-Fātiḥah"} />);

    // The label renders even while the verse is loading.
    expect(screen.getByText("Verse of the day")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("All praise is for Allah—Lord of all worlds.")).toBeInTheDocument(),
    );
    expect(screen.getByText(/ٱلْحَمْدُ/)).toBeInTheDocument();

    // The reference is prefixed with the surah name and links into the surah.
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/\/surah\/\d+#/);
    expect(screen.getByText(/^Al-Fātiḥah \d+:\d+$/)).toBeInTheDocument();
  });
});
