"use client";

import { useEffect, useState } from "react";

/**
 * Reader keyboard shortcuts, a top reading-progress bar, and scroll-position
 * memory — all client-only and scoped to one reader page by `storageKey`.
 *
 * - `j` / `k`: focus the next / previous visible āyah and scroll it into view
 * - `Space`: play/pause (clicks the audio bar's play button)
 * - progress bar reflects how far down the page you are
 * - scroll position is restored on return (unless deep-linked to an āyah)
 */
export function ReaderShortcuts({ storageKey }: { storageKey: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const scrollKey = `ul.scroll.${storageKey}`;

    const visibleAyat = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>(".ayah")).filter(
        (el) => el.offsetParent !== null,
      );

    let current = -1;
    function focusAyah(delta: number) {
      const ayat = visibleAyat();
      if (ayat.length === 0) return;
      if (current < 0) {
        // Start from whichever āyah is nearest the top of the viewport.
        current = ayat.findIndex((el) => el.getBoundingClientRect().top >= 8);
        if (current < 0) current = ayat.length - 1;
        if (delta > 0 && ayat[current] && ayat[current]!.getBoundingClientRect().top < 80) {
          current = Math.min(current + 1, ayat.length - 1);
        }
      } else {
        current = Math.max(0, Math.min(ayat.length - 1, current + delta));
      }
      const target = ayat[current];
      if (!target) return;
      ayat.forEach((el) => el.classList.remove("ayah--focus"));
      target.classList.add("ayah--focus");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j") {
        e.preventDefault();
        focusAyah(1);
      } else if (e.key === "k") {
        e.preventDefault();
        focusAyah(-1);
      } else if (e.key === " ") {
        const play = document.querySelector<HTMLButtonElement>(".audio-play");
        if (play) {
          e.preventDefault();
          play.click();
        }
      }
    }

    let raf = 0;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0);
      });
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(scrollKey, String(window.scrollY));
        } catch {
          /* storage unavailable */
        }
      }, 250);
    }

    // Restore scroll position unless the URL deep-links to a specific āyah.
    if (!window.location.hash) {
      try {
        const saved = Number(sessionStorage.getItem(scrollKey));
        if (saved > 0) window.scrollTo(0, saved);
      } catch {
        /* storage unavailable */
      }
    }
    onScroll();

    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [storageKey]);

  return (
    <div
      className="read-progress"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
