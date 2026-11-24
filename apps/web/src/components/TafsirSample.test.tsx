import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TafsirSample } from "./TafsirSample";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const SURAHS = [
  { number: 1, transliteration: "Al-Faatiha", ayahCount: 2 },
  { number: 2, transliteration: "Al-Baqara", ayahCount: 286 },
];

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const m = /surahs\/(\d+)(\/tafsirs\/(.+))?$/.exec(url)!;
      const sura = Number(m[1]);
      const body = m[3]
        ? {
            entries: [1, 2].map((aya) => ({ sura, aya, text: `${m[3]} on ${sura}:${aya}` })),
          }
        : { ayahs: [1, 2].map((aya) => ({ aya, text: `آية ${sura}:${aya}` })) };
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

describe("TafsirSample", () => {
  it("steps through āyāt and across surahs, not just Al-Fātiḥah 1", async () => {
    mockApi();
    render(
      <TafsirSample tafsirs={[{ id: "en-ibn-kathir", name: "Ibn Kathir" }]} surahs={SURAHS} />,
    );
    expect(await screen.findByText("en-ibn-kathir on 1:1")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Next āyah" });
    await userEvent.click(next);
    expect(await screen.findByText("en-ibn-kathir on 1:2")).toBeInTheDocument();
    await userEvent.click(next);
    expect(await screen.findByText("en-ibn-kathir on 2:1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Al-Baqara 2:1 in the reader/ })).toHaveAttribute(
      "href",
      "/surah/2#2:1",
    );
  });

  it("sets right-to-left direction for Arabic and Urdu commentary", async () => {
    mockApi();
    render(<TafsirSample tafsirs={[{ id: "ar-muyassar", name: "Muyassar" }]} surahs={SURAHS} />);
    const body = await screen.findByText("ar-muyassar on 1:1");
    expect(body).toHaveAttribute("dir", "rtl");
    expect(body).toHaveAttribute("lang", "ar");
  });
});
