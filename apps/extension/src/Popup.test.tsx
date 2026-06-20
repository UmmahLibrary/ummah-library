import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Surah } from "@ummahlibrary/core";
import { Popup } from "./Popup";

const SURAHS: Surah[] = Array.from({ length: 114 }, (_, i) => ({
  number: i + 1,
  name: "سورة",
  transliteration: `Surah-${i + 1}`,
  englishName: `Chapter ${i + 1}`,
  revelationPlace: "meccan",
  revelationOrder: i + 1,
  ayahCount: 3,
  rukus: 1,
  hasBismillah: true,
}));
SURAHS[35] = { ...SURAHS[35]!, transliteration: "Ya-Sin", englishName: "Ya Sin", name: "يس" };

function body(url: string): unknown {
  if (url.includes("/ayahs/"))
    return { ayah: { text: "ARABIC_VERSE_TEXT" }, translation: { text: "The English meaning." } };
  if (url.endsWith("/api/v1/surahs")) return { surahs: SURAHS };
  if (url.endsWith("/api/v1/editions")) return { editions: [{ id: "eng-khattab", name: "Khattab" }] };
  return {};
}

beforeEach(() => {
  global.fetch = vi.fn((input: RequestInfo | URL) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body(String(input))) } as Response),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("Popup", () => {
  it("renders the verse of the day with a deep link into the reader", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText("ARABIC_VERSE_TEXT")).toBeInTheDocument());
    expect(screen.getByText("The English meaning.")).toBeInTheDocument();
    const link = screen.getByText("ARABIC_VERSE_TEXT").closest("a");
    expect(link?.getAttribute("href")).toMatch(/\/surah\/\d+#\d+:\d+$/);
  });

  it("shows today's Hijri date", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText(/AH$/)).toBeInTheDocument());
  });

  it("filters surahs and links to the reader", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText("ARABIC_VERSE_TEXT")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "yasin" } });

    const result = await screen.findByText("Ya-Sin");
    expect(result.closest("a")?.getAttribute("href")).toBe("https://ummahlibrary.org/surah/36");
  });

  it("switches the theme via the swatch picker", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText("ARABIC_VERSE_TEXT")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("radio", { name: "emerald" }));

    expect(document.documentElement.dataset.theme).toBe("emerald");
    expect(localStorage.getItem("ul.ext.themeMirror")).toBe("emerald");
  });
});
