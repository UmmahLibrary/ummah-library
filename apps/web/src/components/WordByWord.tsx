"use client";

import { useEffect, useRef, useState } from "react";

const WBW_KEY = "ul.wbw";

interface Word {
  arabic: string;
  translit: string | null;
  translation: string | null;
}

interface Popover {
  word: Word;
  x: number;
  y: number;
}

// One quran.com lookup per verse, shared across taps.
const wordCache = new Map<string, Promise<Word[]>>();
function fetchWords(verseKey: string): Promise<Word[]> {
  let pending = wordCache.get(verseKey);
  if (!pending) {
    pending = fetch(
      `https://api.quran.com/api/v4/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani,transliteration`,
    )
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{
              verse?: {
                words?: {
                  char_type_name?: string;
                  text_uthmani?: string;
                  transliteration?: { text: string | null };
                  translation?: { text: string | null };
                }[];
              };
            }>)
          : null,
      )
      .then((d) =>
        (d?.verse?.words ?? [])
          .filter((w) => w.char_type_name === "word")
          .map((w) => ({
            arabic: w.text_uthmani ?? "",
            translit: w.transliteration?.text ?? null,
            translation: w.translation?.text ?? null,
          })),
      )
      .catch(() => [] as Word[]);
    wordCache.set(verseKey, pending);
  }
  return pending;
}

/**
 * Tap-to-reveal word-by-word gloss for the verse-by-verse reader. When enabled,
 * tapping any Arabic word shows its transliteration and English meaning in a
 * popover (data from quran.com, the same source as the audio timing). Morphology
 * (root / part of speech) is a planned follow-up from the Quranic Arabic Corpus.
 */
export function WordByWord() {
  const [on, setOn] = useState(false);
  const [popover, setPopover] = useState<Popover | null>(null);
  const onRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(WBW_KEY) === "1";
    setOn(saved);
    onRef.current = saved;
    document.body.classList.toggle("wbw-on", saved);
  }, []);

  function toggle() {
    const next = !onRef.current;
    onRef.current = next;
    setOn(next);
    document.body.classList.toggle("wbw-on", next);
    localStorage.setItem(WBW_KEY, next ? "1" : "0");
    if (!next) setPopover(null);
  }

  useEffect(() => {
    async function onClick(event: MouseEvent) {
      if (!onRef.current) return;
      const target = event.target as HTMLElement;
      const span = target.closest<HTMLElement>(".w");
      if (!span) {
        setPopover(null);
        return;
      }
      const block = span.closest<HTMLElement>(".ayah");
      const para = span.closest<HTMLElement>(".ayah-ar");
      if (!block?.id || !para) return;
      event.preventDefault();
      const siblings = Array.from(para.querySelectorAll<HTMLElement>(".w"));
      const index = siblings.indexOf(span);
      const rect = span.getBoundingClientRect();
      const words = await fetchWords(block.id);
      const word = words[index];
      if (!word || !onRef.current) return;
      setPopover({
        word,
        x: Math.min(rect.left, window.innerWidth - 240),
        y: rect.bottom + 6,
      });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopover(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={on ? "chip chip--on" : "chip"}
        onClick={toggle}
        aria-pressed={on}
        title="Tap any Arabic word to see its meaning"
      >
        ✦ Word by word
      </button>
      {popover && (
        <div
          className="wbw-popover"
          style={{ left: popover.x, top: popover.y }}
          role="dialog"
          aria-label="Word meaning"
        >
          <span className="wbw-arabic arabic">{popover.word.arabic}</span>
          {popover.word.translit && <span className="wbw-translit">{popover.word.translit}</span>}
          <span className="wbw-translation">{popover.word.translation ?? "—"}</span>
        </div>
      )}
    </>
  );
}
