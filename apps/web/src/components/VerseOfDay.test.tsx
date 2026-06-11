import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { VerseOfDay } from "./VerseOfDay";

describe("VerseOfDay", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the label immediately, then the fetched āyah and a link", async () => {
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

    render(<VerseOfDay />);

    // The label renders even while the verse is loading.
    expect(screen.getByText("Verse of the day")).toBeInTheDocument();

    // Once the fetch resolves, the āyah, its translation, and a deep link appear.
    await waitFor(() =>
      expect(
        screen.getByText("All praise is for Allah—Lord of all worlds."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/ٱلْحَمْدُ/)).toBeInTheDocument();
    expect(screen.getByRole("link").getAttribute("href")).toMatch(/\/surah\/\d+#/);
  });
});
