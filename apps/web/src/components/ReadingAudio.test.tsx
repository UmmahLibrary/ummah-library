import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReciterPlugin, TranslationAudioPlugin } from "@ummahlibrary/core";
import { ReadingAudio } from "./ReadingAudio";

const ALAFASY: ReciterPlugin = {
  kind: "reciter",
  id: "alafasy",
  name: "Alafasy",
  language: "ar",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
  quranComId: 7,
};

const SAHIH_WALK: TranslationAudioPlugin = {
  kind: "translation-audio",
  id: "eng-sahih-walk",
  name: "Ibrahim Walk (Saheeh International)",
  language: "en",
  audioUrlTemplate:
    "https://everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/{surah:3}{ayah:3}.mp3",
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
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/verses/by_key/1:1?audio=7"),
      ),
    );
  });
});

describe("ReadingAudio — translation-audio voices (#204)", () => {
  it("shows no translation-mode control when no voices are available", () => {
    render(<ReadingAudio verses={[{ sura: 1, aya: 1 }]} reciters={[ALAFASY]} />);
    expect(screen.queryByLabelText(/Translation audio/i)).toBeNull();
  });

  it("cycling the mode button steps arabic-only → interleaved → translation-only → arabic-only, revealing the voice picker only when a translation mode is active", () => {
    render(
      <ReadingAudio
        verses={[{ sura: 1, aya: 1 }]}
        reciters={[ALAFASY]}
        translationVoices={[SAHIH_WALK]}
      />,
    );

    const button = screen.getByLabelText("Translation audio off");
    expect(screen.queryByText(SAHIH_WALK.name)).toBeNull();

    fireEvent.click(button);
    expect(screen.getByLabelText("Arabic + translation audio")).toBeInTheDocument();
    expect(screen.getByText(SAHIH_WALK.name)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Arabic + translation audio"));
    expect(screen.getByLabelText("Translation audio only")).toBeInTheDocument();
    expect(screen.getByText(SAHIH_WALK.name)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Translation audio only"));
    expect(screen.getByLabelText("Translation audio off")).toBeInTheDocument();
    expect(screen.queryByText(SAHIH_WALK.name)).toBeNull();
  });

  it("shows a select instead of a label once more than one voice is available", () => {
    const urduVoice: TranslationAudioPlugin = { ...SAHIH_WALK, id: "urd-shamshad", name: "Shamshad Ali Khan" };
    render(
      <ReadingAudio
        verses={[{ sura: 1, aya: 1 }]}
        reciters={[ALAFASY]}
        translationVoices={[SAHIH_WALK, urduVoice]}
      />,
    );
    fireEvent.click(screen.getByLabelText("Translation audio off"));
    const select = screen.getByLabelText("Translation-audio voice") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual([SAHIH_WALK.name, urduVoice.name]);
  });
});
