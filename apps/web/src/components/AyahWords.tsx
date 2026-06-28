"use client";

import { Fragment, useEffect, useState } from "react";
import type { QuranScript } from "@ummahlibrary/core";
import { WORD_TRANSLIT_KEY, fetchSurahWordTranslit, readWordTranslit } from "../lib/word-translit";
import { SCRIPT_KEY, fetchSurahIndopak, readScript } from "../lib/script";

/**
 * The Arabic words of one āyah (#144). With the word-transliteration toggle off
 * it renders exactly the plain `.w` spans the reader has always used (so audio
 * highlighting, which targets `.w[data-w]`, is untouched). With it on, each word
 * becomes a stacked unit — Arabic over its Latin transliteration — and the CSS
 * `body.wbw-translit-on .ayah-ar` flex layout flows them right-to-left.
 *
 * When the IndoPak script is selected (ADR 0035) it renders the IndoPak verse
 * instead, from quran.com's **numbered words** as `.w[data-w]` spans. Those words
 * line up 1:1 with the recitation audio segments *and* with the transliteration
 * (same numbered-word source), so per-word highlighting, tap-to-hear, the word
 * popover, and the stacked transliteration all work for IndoPak too. The font swap
 * is driven by the body class.
 *
 * The transliteration row is only stacked when it lines up 1:1 with the rendered
 * words; on a mismatch (a failed fetch, or upstream re-segmentation) the row is
 * dropped rather than misaligned — for scripture a missing row beats a wrong one.
 *
 * Server-rendered in the off state (the toggle/fetch run only after hydration),
 * so the Arabic stays in the initial HTML for both the surah and juz readers.
 */
export function AyahWords({ surah, aya, text }: { surah: number; aya: number; text: string }) {
  const words = text.split(" ");
  const [translit, setTranslit] = useState<string[] | null>(null);
  const [script, setScript] = useState<QuranScript>("uthmani");
  const [indopak, setIndopak] = useState<readonly string[] | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!(await readWordTranslit())) {
        if (active) setTranslit(null);
        return;
      }
      const map = await fetchSurahWordTranslit(surah);
      if (active) setTranslit(map.get(aya) ?? []);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(WORD_TRANSLIT_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(WORD_TRANSLIT_KEY, onChange);
    };
  }, [surah, aya]);

  useEffect(() => {
    let active = true;
    async function load() {
      const s = await readScript();
      if (!active) return;
      setScript(s);
      if (s !== "indopak") {
        setIndopak(null);
        return;
      }
      const map = await fetchSurahIndopak(surah);
      if (active) setIndopak(map.get(aya) ?? null);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(SCRIPT_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(SCRIPT_KEY, onChange);
    };
  }, [surah, aya]);

  // The Arabic words to render: IndoPak's numbered words (ADR 0035) when that
  // script is selected and loaded, else the Uthmani text split on spaces. Both
  // number their words the same way (quran.com's numbered words), so the `.w[data-w]`
  // indices line up 1:1 with the audio segments and the transliteration either way.
  const arabic = script === "indopak" && indopak != null ? indopak : words;

  // Stack the Latin transliteration only when it lines up 1:1 with the Arabic
  // words. It normally does (same numbered-word source), but a failed/partial
  // fetch — or a future re-segmentation upstream — would otherwise shift every
  // word's row; for scripture a missing row beats a wrong one, so we drop it on a
  // mismatch (ADR 0036). The guard covers both Uthmani and IndoPak stacking.
  const stacked = translit != null && translit.length === arabic.length;

  if (!stacked) {
    // Plain inline `.w[data-w]` spans — the reader's long-standing rendering,
    // and what audio highlighting / tap-to-hear / the word popover target.
    return (
      <>
        {arabic.flatMap((word, i) => [
          <span key={i} className="w" data-w={i}>
            {word}
          </span>,
          " ",
        ])}
      </>
    );
  }

  return (
    <>
      {arabic.map((word, i) => (
        <Fragment key={i}>
          <span className="w-unit">
            <span className="w" data-w={i}>
              {word}
            </span>
            <span className="w-tr" aria-hidden="true">
              {translit[i] ?? ""}
            </span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}
