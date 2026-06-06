"use client";

import { useState } from "react";

export function AyahActions({ surah, aya }: { surah: number; aya: number }) {
  const [copied, setCopied] = useState<"text" | "link" | null>(null);

  function flash(which: "text" | "link") {
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  async function copyText() {
    const block = document.getElementById(`${surah}:${aya}`);
    if (!block) return;
    const arEl = block
      .querySelector<HTMLElement>(".ayah-ar")
      ?.cloneNode(true) as HTMLElement | null;
    arEl?.querySelector(".ayah-marker")?.remove();
    const arabic = arEl?.textContent?.trim() ?? "";
    // Only selected editions are rendered now (ADR 0011), so every .ayah-tr counts.
    const translations = [...block.querySelectorAll<HTMLElement>(".ayah-tr")].map((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelector(".tr-name")?.remove();
      return clone.textContent?.trim() ?? "";
    });
    const text = [arabic, ...translations, `— ${surah}:${aya}`].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flash("text");
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyLink() {
    const url = `${location.origin}/surah/${surah}#${surah}:${aya}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("link");
    } catch {
      /* clipboard unavailable */
    }
    history.replaceState(null, "", `#${surah}:${aya}`);
  }

  return (
    <>
      <button type="button" className="hifz-btn" onClick={copyText}>
        {copied === "text" ? "Copied ✓" : "Copy"}
      </button>
      <button
        type="button"
        className="hifz-btn"
        onClick={copyLink}
        aria-label={`Copy link to ayah ${surah}:${aya}`}
      >
        {copied === "link" ? "Link ✓" : "🔗 Link"}
      </button>
    </>
  );
}
