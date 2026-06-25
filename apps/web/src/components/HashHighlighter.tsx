"use client";

import { useEffect } from "react";

/** Scrolls to and briefly highlights the ayah named in the URL hash (#sura:aya). */
export function HashHighlighter() {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const clearTimers = () => {
      for (const t of timers) clearTimeout(t);
      timers.length = 0;
    };

    function apply() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      document.querySelectorAll(".ayah--target").forEach((e) => e.classList.remove("ayah--target"));
      const el = document.getElementById(id);
      if (!el) return;
      // restart the flash animation
      el.classList.remove("ayah--target");
      void el.offsetWidth;
      el.classList.add("ayah--target");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Translations and word-by-word load after mount and grow the āyāt above
      // the target, pushing it down — so the first scroll lands several āyāt
      // early. Re-centre a few times as the layout settles. A user scroll cancels
      // the pending corrections (see `cancel`), so we never fight a deliberate move.
      clearTimers();
      for (const delay of [150, 400, 800]) {
        timers.push(
          setTimeout(() => {
            const node = document.getElementById(id);
            if (!node) return;
            const r = node.getBoundingClientRect();
            const offCentre = Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2);
            if (offCentre > 80) node.scrollIntoView({ block: "center" });
          }, delay),
        );
      }
    }

    apply();
    window.addEventListener("hashchange", apply);
    window.addEventListener("wheel", clearTimers, { passive: true });
    window.addEventListener("touchmove", clearTimers, { passive: true });
    window.addEventListener("keydown", clearTimers);
    return () => {
      window.removeEventListener("hashchange", apply);
      window.removeEventListener("wheel", clearTimers);
      window.removeEventListener("touchmove", clearTimers);
      window.removeEventListener("keydown", clearTimers);
      clearTimers();
    };
  }, []);

  return null;
}
