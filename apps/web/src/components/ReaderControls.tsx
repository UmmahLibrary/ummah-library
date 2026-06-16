"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EditionManager } from "./EditionManager";
import { readBookmarks, toggleBookmark as toggleBm } from "../lib/bookmarks";
import { readScale, writeScale } from "../lib/reader-prefs";

const LAST_READ_KEY = "ul.lastRead";
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.8;

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function ReaderControls({
  surahNumber,
  backHref,
  backLabel,
}: {
  surahNumber: number;
  backHref?: string;
  backLabel?: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [scale, setScale] = useState(1);

  // Hydrate from localStorage and record this surah as last-read.
  useEffect(() => {
    void readBookmarks().then((list) => setBookmarked(list.includes(surahNumber)));
    write(LAST_READ_KEY, { surah: surahNumber });

    void readScale().then((s) => {
      setScale(s);
      document.documentElement.style.setProperty("--reading-scale", String(s));
    });
  }, [surahNumber]);

  function changeScale(delta: number): void {
    const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round((scale + delta) * 10) / 10));
    setScale(next);
    void writeScale(next);
    document.documentElement.style.setProperty("--reading-scale", String(next));
  }

  function toggleBookmark(): void {
    void toggleBm(surahNumber).then((next) => setBookmarked(next.includes(surahNumber)));
  }

  return (
    <div className="reader-controls">
      <div className="reader-controls-left">
        {backHref && (
          <Link href={backHref} className="back-link back-link--inline">
            ← {backLabel ?? "Back"}
          </Link>
        )}
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

      <EditionManager />
    </div>
  );
}
