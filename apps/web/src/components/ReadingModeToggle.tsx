"use client";

import { useEffect, useState } from "react";

/**
 * Reading mode, mirroring Quran.com's two-level control:
 *  - "translation"  → verse-by-verse, each āyah with its translations
 *  - "reading"      → continuous mushaf, Arabic only
 *  - "reading-tr"   → continuous reading, Arabic with translations
 *
 * The value persists in `ul.readingMode` and drives visibility via the
 * `html[data-reading-mode]` attribute (restored pre-paint in layout.tsx). The
 * legacy stored value "reading" keeps working unchanged.
 */
type Mode = "translation" | "reading" | "reading-tr";

export function ReadingModeToggle() {
  const [mode, setMode] = useState<Mode>("translation");

  useEffect(() => {
    setMode((document.documentElement.dataset.readingMode as Mode) || "translation");
  }, []);

  function choose(next: Mode) {
    setMode(next);
    document.documentElement.dataset.readingMode = next;
    try {
      localStorage.setItem("ul.readingMode", next);
    } catch {
      /* ignore */
    }
  }

  const isReading = mode === "reading" || mode === "reading-tr";

  return (
    <div className="mode-toggle-wrap">
      <div className="mode-toggle" role="group" aria-label="Reading mode">
        <button
          type="button"
          className={mode === "translation" ? "chip chip--on" : "chip"}
          aria-pressed={mode === "translation"}
          onClick={() => choose("translation")}
        >
          Verse by verse
        </button>
        <button
          type="button"
          className={isReading ? "chip chip--on" : "chip"}
          aria-pressed={isReading}
          // Entering reading mode keeps the last reading sub-choice, default Arabic.
          onClick={() => choose(mode === "reading-tr" ? "reading-tr" : "reading")}
        >
          Reading
        </button>
      </div>

      {isReading && (
        <div className="mode-toggle mode-toggle--sub" role="group" aria-label="Reading content">
          <button
            type="button"
            className={mode === "reading" ? "chip chip--on" : "chip"}
            aria-pressed={mode === "reading"}
            onClick={() => choose("reading")}
          >
            Arabic
          </button>
          <button
            type="button"
            className={mode === "reading-tr" ? "chip chip--on" : "chip"}
            aria-pressed={mode === "reading-tr"}
            onClick={() => choose("reading-tr")}
          >
            Translations
          </button>
        </div>
      )}
    </div>
  );
}
