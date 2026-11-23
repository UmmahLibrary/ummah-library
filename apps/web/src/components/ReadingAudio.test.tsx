import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ReciterPlugin } from "@ummahlibrary/core";
import { ReadingAudio } from "./ReadingAudio";

const ALAFASY: ReciterPlugin = {
  kind: "reciter",
  id: "alafasy",
  name: "Alafasy",
  language: "ar",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
  quranComId: 7,
};

beforeEach(() => {
  localStorage.clear();
  document.body.className = "";
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.className = "";
  document.body.innerHTML = "";
});

describe("ReadingAudio — tap a word to hear (#145)", () => {
  it("a word tap fetches that verse's timing only when tap-to-hear is on", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verse: { audio: { url: "Alafasy/mp3/001001.mp3", segments: [[1, 2, 620, 1310]] } },
        }),
        { status: 200 },
      ),
    );

    render(<ReadingAudio verses={[{ sura: 1, aya: 1 }]} reciters={[ALAFASY]} />);

    // A rendered āyah block with word spans, like the reader produces.
    const block = document.createElement("div");
    block.id = "1:1";
    block.className = "ayah";
    block.innerHTML = `<p class="ayah-ar"><span class="w" data-w="0">بِسْمِ</span> <span class="w" data-w="1">ٱللَّهِ</span></p>`;
    document.body.appendChild(block);
    const word = block.querySelector('.w[data-w="1"]') as HTMLElement;

    // Off: a word tap is ignored (no timing fetch).
    word.click();
    expect(fetchSpy).not.toHaveBeenCalled();

    // On: the tap fetches the verse's word timing.
    document.body.classList.add("tap-hear-on");
    word.click();
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("/verses/by_key/1:1?audio=7")),
    );
  });
});

describe("ReadingAudio — a recitation that can't load", () => {
  const NO_TIMING_RECITER: ReciterPlugin = { ...ALAFASY, quranComId: undefined };

  function playFirstAyah() {
    const btn = document.createElement("button");
    btn.dataset.playKey = "1:1";
    document.body.appendChild(btn);
    btn.click();
  }

  it("says it couldn't play instead of doing nothing", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(
      new DOMException("network", "NotSupportedError"),
    );
    const { findAllByText } = render(
      <ReadingAudio verses={[{ sura: 1, aya: 1 }]} reciters={[NO_TIMING_RECITER]} />,
    );

    playFirstAyah();

    expect((await findAllByText(/Couldn’t play/)).length).toBeGreaterThan(0);
  });

  it("stays quiet when the browser only blocked autoplay", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(
      new DOMException("blocked", "NotAllowedError"),
    );
    const { queryAllByText } = render(
      <ReadingAudio verses={[{ sura: 1, aya: 1 }]} reciters={[NO_TIMING_RECITER]} />,
    );

    playFirstAyah();
    await new Promise((r) => setTimeout(r, 50));

    expect(queryAllByText(/Couldn’t play/)).toHaveLength(0);
  });
});
