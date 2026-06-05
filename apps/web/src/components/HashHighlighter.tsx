"use client";

import { useEffect } from "react";

/** Scrolls to and briefly highlights the ayah named in the URL hash (#sura:aya). */
export function HashHighlighter() {
  useEffect(() => {
    function apply() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      document.querySelectorAll(".ayah--target").forEach((e) => e.classList.remove("ayah--target"));
      const el = document.getElementById(id);
      if (el) {
        // restart the flash animation
        el.classList.remove("ayah--target");
        void el.offsetWidth;
        el.classList.add("ayah--target");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return null;
}
