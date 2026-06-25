"use client";

import { useEffect } from "react";

/** Scrolls to and briefly highlights the ayah named in the URL hash (#sura:aya). */
export function HashHighlighter() {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let userTookOver = false;
    const cancel = () => {
      userTookOver = true;
    };

    function apply() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      document.querySelectorAll(".ayah--target").forEach((e) => e.classList.remove("ayah--target"));
      const el = document.getElementById(id);
      if (!el) return;
      userTookOver = false;
      // Flash once, then drop the class so it doesn't linger on the āyah.
      el.classList.remove("ayah--target");
      void el.offsetWidth;
      el.classList.add("ayah--target");
      timers.push(setTimeout(() => el.classList.remove("ayah--target"), 1500));
      // Position once, instantly — a single jump, not a smooth scroll that the
      // async translation layout-shift then fights (which read as "shaky").
      el.scrollIntoView({ block: "center" });
      // Translations load after mount and shift the layout; the browser's
      // scroll-anchoring keeps the āyah in place, so only nudge it back in the
      // rare case it was actually pushed off-screen — and never after the user
      // has taken over the scroll.
      timers.push(
        setTimeout(() => {
          if (userTookOver) return;
          const node = document.getElementById(id);
          if (!node) return;
          const r = node.getBoundingClientRect();
          if (r.bottom < 90 || r.top > window.innerHeight - 90) {
            node.scrollIntoView({ block: "center" });
          }
        }, 650),
      );
    }

    apply();
    window.addEventListener("hashchange", apply);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchmove", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    return () => {
      window.removeEventListener("hashchange", apply);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("keydown", cancel);
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return null;
}
