"use client";

import { Fragment, useEffect, useState } from "react";
import { WORD_TRANSLIT_KEY, fetchSurahWordTranslit, readWordTranslit } from "../lib/word-translit";

/**
 * The Arabic words of one āyah (#144). With the word-transliteration toggle off
 * it renders exactly the plain `.w` spans the reader has always used (so audio
 * highlighting, which targets `.w[data-w]`, is untouched). With it on, each word
 * becomes a stacked unit — Arabic over its Latin transliteration — and the CSS
 * `body.wbw-translit-on .ayah-ar` flex layout flows them right-to-left.
 *
 * Server-rendered in the off state (the toggle/fetch run only after hydration),
 * so the Arabic stays in the initial HTML for both the surah and juz readers.
 */
export function AyahWords({ surah, aya, text }: { surah: number; aya: number; text: string }) {
  const words = text.split(" ");
  const [translit, setTranslit] = useState<string[] | null>(null);

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

  if (!translit) {
    // Off — identical to the reader's long-standing inline rendering.
    return (
      <>
        {words.flatMap((word, i) => [
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
      {words.map((word, i) => (
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
