"use client";

import { useEffect, useState } from "react";

type Mode = "translation" | "reading";

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

  return (
    <div className="mode-toggle" role="group" aria-label="Reading mode">
      <button
        type="button"
        className={mode === "translation" ? "chip chip--on" : "chip"}
        aria-pressed={mode === "translation"}
        onClick={() => choose("translation")}
      >
        Translation
      </button>
      <button
        type="button"
        className={mode === "reading" ? "chip chip--on" : "chip"}
        aria-pressed={mode === "reading"}
        onClick={() => choose("reading")}
      >
        Reading
      </button>
    </div>
  );
}
