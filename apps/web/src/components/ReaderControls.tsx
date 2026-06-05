"use client";

import { useEffect, useState } from "react";

export interface EditionChoice {
  id: string;
  name: string;
  language: string;
}

const EDITIONS_KEY = "ul.editions";
const BOOKMARKS_KEY = "ul.bookmarks";
const LAST_READ_KEY = "ul.lastRead";
const DEFAULT_EDITIONS = ["eng-khattab"];
const SCALE_KEY = "ul.scale";
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.8;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Show/hide a translation edition across the page by toggling `.tr--off`. */
function applyEditionVisibility(selected: Set<string>, all: EditionChoice[]): void {
  for (const e of all) {
    const visible = selected.has(e.id);
    document
      .querySelectorAll<HTMLElement>(`[data-edition="${e.id}"]`)
      .forEach((node) => node.classList.toggle("tr--off", !visible));
  }
}

export function ReaderControls({
  surahNumber,
  editions,
}: {
  surahNumber: number;
  editions: EditionChoice[];
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_EDITIONS));
  const [bookmarked, setBookmarked] = useState(false);
  const [scale, setScale] = useState(1);

  // Hydrate from localStorage and record this surah as last-read.
  useEffect(() => {
    const saved = new Set(read<string[]>(EDITIONS_KEY, DEFAULT_EDITIONS));
    setSelected(saved);
    applyEditionVisibility(saved, editions);

    setBookmarked(read<number[]>(BOOKMARKS_KEY, []).includes(surahNumber));
    write(LAST_READ_KEY, { surah: surahNumber });

    const savedScale = read<number>(SCALE_KEY, 1);
    setScale(savedScale);
    document.documentElement.style.setProperty("--reading-scale", String(savedScale));
  }, [surahNumber, editions]);

  function changeScale(delta: number): void {
    const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round((scale + delta) * 10) / 10));
    setScale(next);
    write(SCALE_KEY, next);
    document.documentElement.style.setProperty("--reading-scale", String(next));
  }

  function toggleEdition(id: string): void {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size === 0) next.add(DEFAULT_EDITIONS[0]!); // never hide everything
    setSelected(next);
    write(EDITIONS_KEY, [...next]);
    applyEditionVisibility(next, editions);
  }

  function toggleBookmark(): void {
    const list = read<number[]>(BOOKMARKS_KEY, []);
    const next = list.includes(surahNumber)
      ? list.filter((n) => n !== surahNumber)
      : [...list, surahNumber].sort((a, b) => a - b);
    write(BOOKMARKS_KEY, next);
    setBookmarked(next.includes(surahNumber));
  }

  return (
    <div className="reader-controls">
      <div className="reader-controls-left">
        <button
          type="button"
          className="bookmark-btn"
          aria-pressed={bookmarked}
          onClick={toggleBookmark}
        >
          {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
        <div className="size-control" role="group" aria-label="Reading size">
          <button
            type="button"
            className="chip"
            onClick={() => changeScale(-0.1)}
            disabled={scale <= SCALE_MIN}
            aria-label="Decrease text size"
          >
            A−
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => changeScale(0.1)}
            disabled={scale >= SCALE_MAX}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
      </div>
      <div className="edition-chips">
        {editions.map((e) => (
          <button
            key={e.id}
            type="button"
            className={selected.has(e.id) ? "chip chip--on" : "chip"}
            aria-pressed={selected.has(e.id)}
            onClick={() => toggleEdition(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>
    </div>
  );
}
