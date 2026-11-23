import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Surah } from "@ummahlibrary/core";
import { Popup } from "./Popup";

// Real Quran text with full diacritics — the popup must render it byte-for-byte.
const ARABIC = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

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
    return { ayah: { text: ARABIC }, translation: { text: "The English meaning." } };
  if (url.endsWith("/api/v1/surahs")) return { surahs: SURAHS };
  if (url.endsWith("/api/v1/editions"))
    return { editions: [{ id: "eng-khattab", name: "Khattab" }] };
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
  it("renders the verse of the day exactly, names the translator, and deep-links the reader", async () => {
    render(<Popup />);
    const arabic = await screen.findByText(ARABIC);
    // Exact text (no normalisation), marked up as Arabic.
    expect(arabic.textContent).toBe(ARABIC);
    expect(arabic.getAttribute("lang")).toBe("ar");
    expect(screen.getByText("The English meaning.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Translation: Khattab/)).toBeInTheDocument());
    const link = screen.getByRole("link", { name: /Read this āyah/ });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/ummahlibrary\.org\/surah\/\d+#\d+:\d+$/);
  });

  it("leads with a Start card on a first visit", async () => {
    render(<Popup />);
    expect(await screen.findByRole("heading", { name: "Start reading" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Start$/ }).getAttribute("href")).toBe(
      "https://ummahlibrary.org/surah/1#1:1",
    );
    expect(screen.getByRole("link", { name: /^Listen$/ }).getAttribute("href")).toBe(
      "https://ummahlibrary.org/listen/1#1",
    );
  });

  it("leads with a Continue card that opens the reader and Listen at the saved āyah", async () => {
    localStorage.setItem("ul.ext.lastRead", JSON.stringify({ sura: 36, aya: 12 }));
    render(<Popup />);
    expect(await screen.findByRole("heading", { name: "Continue reading" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ya-Sin")).toBeInTheDocument());
    expect(screen.getByText("Āyah 12")).toBeInTheDocument();

    const cont = screen.getByRole("link", { name: /^Continue$/ });
    expect(cont.getAttribute("href")).toBe("https://ummahlibrary.org/surah/36#36:12");
    expect(cont.getAttribute("target")).toBe("_blank");
    const listen = screen.getByRole("link", { name: /^Listen$/ });
    expect(listen.getAttribute("href")).toBe("https://ummahlibrary.org/listen/36#12");
    expect(listen.getAttribute("target")).toBe("_blank");
  });

  it("remembers a sūra opened from search as the next Continue point", async () => {
    render(<Popup />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "yasin" } });
    fireEvent.click(await screen.findByText("Ya-Sin"));
    expect(await screen.findByRole("heading", { name: "Continue reading" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Continue$/ }).getAttribute("href")).toBe(
      "https://ummahlibrary.org/surah/36#36:1",
    );
    expect(JSON.parse(localStorage.getItem("ul.ext.lastRead") ?? "null")).toEqual({
      sura: 36,
      aya: 1,
    });
  });

  it("shows no streak or fire emoji", async () => {
    render(<Popup />);
    await screen.findByText(ARABIC);
    expect(document.body.textContent).not.toContain("🔥");
    expect(document.body.textContent?.toLowerCase()).not.toContain("streak");
  });

  it("labels every control with a visible word", async () => {
    render(<Popup />);
    await screen.findByText(ARABIC);
    for (const name of [
      /^Start$/,
      /^Listen$/,
      /Read this āyah/,
      /Open Ummah Library$/,
      /^Settings$/,
    ]) {
      const el = screen.getAllByRole("link", { name }).find((a) => a.className.includes("ul-btn"));
      expect(el, String(name)).toBeDefined();
      // An icon and a word: the svg is decorative, the label is visible text.
      expect(el!.querySelector("svg")).not.toBeNull();
      expect(el!.textContent?.trim().length).toBeGreaterThan(0);
    }
    for (const radio of screen.getAllByRole("radio")) {
      expect(
        radio.textContent?.trim().length,
        radio.getAttribute("aria-label") ?? "",
      ).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText("Search for a sūra")).toBeInTheDocument();
  });

  it("shows today's Hijri date", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText(/AH$/)).toBeInTheDocument());
  });

  it("filters surahs and links to the reader", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText(ARABIC)).toBeInTheDocument());

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "yasin" } });

    const result = await screen.findByText("Ya-Sin");
    expect(result.closest("a")?.getAttribute("href")).toBe("https://ummahlibrary.org/surah/36");
  });

  it("switches the theme via the swatch picker", async () => {
    render(<Popup />);
    await waitFor(() => expect(screen.getByText(ARABIC)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("radio", { name: "emerald" }));

    expect(document.documentElement.dataset.theme).toBe("emerald");
    expect(localStorage.getItem("ul.ext.themeMirror")).toBe("emerald");
  });
});
