"use client";

import { useEffect, useState } from "react";

export const WBW_KEY = "ul.wbw";

interface Word {
  arabic: string;
  translit: string | null;
  translation: string | null;
}

interface PopoverState {
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

const isOn = () => document.body.classList.contains("wbw-on");

/**
 * The word-by-word layer for the verse reader: when enabled (the `wbw-on` body
 * class, toggled from the reader toolbar's display menu), tapping any Arabic word
 * shows its transliteration and English meaning in a popover (data from
 * quran.com). Renders only the popover — the on/off toggle lives in the toolbar.
 */
export function WordByWord() {
  const [popover, setPopover] = useState<PopoverState | null>(null);

  useEffect(() => {
    async function onClick(event: MouseEvent) {
      if (!isOn()) return;
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
      if (!word || !isOn()) return;
      setPopover({
        word,
        x: Math.min(rect.left, window.innerWidth - 240),
        y: rect.bottom + 6,
      });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopover(null);
    }
    // Clear the popover when word-by-word is switched off from the toolbar.
    function onToggle(e: Event) {
      if (!(e as CustomEvent<boolean>).detail) setPopover(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener(WBW_KEY, onToggle);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(WBW_KEY, onToggle);
    };
  }, []);

  if (!popover) return null;
  return (
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
  );
}
