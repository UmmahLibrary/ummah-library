"use client";

import { useEffect, useState } from "react";
import { TRANSLIT_EDITION, TRANSLIT_KEY, readTransliteration } from "../lib/transliteration";
import { fetchEditionSurah } from "../lib/catalogue";

/**
 * The Latin transliteration line for one āyah (#150), shown under the Arabic when
 * the reader enables it. The text is fetched once per surah from the runtime
 * catalogue (memoised by `fetchEditionSurah`) and re-checked when the toggle
 * broadcasts `ul.transliteration`. Renders nothing when the toggle is off or the
 * edition has no line for this āyah.
 */
export function AyahTransliteration({ surah, aya }: { surah: number; aya: number }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!(await readTransliteration())) {
        if (active) setText(null);
        return;
      }
      const map = await fetchEditionSurah(TRANSLIT_EDITION, surah);
      if (active) setText(map.get(aya) ?? null);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(TRANSLIT_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(TRANSLIT_KEY, onChange);
    };
  }, [surah, aya]);

  if (!text) return null;
  return (
    <p className="ayah-translit" dir="ltr" lang="la">
      {text}
    </p>
  );
}
