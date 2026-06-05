"use client";

import { useEffect, useState } from "react";
import { createCard } from "@ummahlibrary/core";
import { isTracked, removeCard, setCard } from "../lib/hifz-store";

/** Per-ayah toggle to start/stop memorizing it (localStorage-backed). */
export function HifzButton({ surah, aya }: { surah: number; aya: number }) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    setTracked(isTracked({ sura: surah, aya }));
  }, [surah, aya]);

  function toggle() {
    const ref = { sura: surah, aya };
    if (isTracked(ref)) {
      removeCard(ref);
      setTracked(false);
    } else {
      setCard(ref, createCard());
      setTracked(true);
    }
  }

  return (
    <button type="button" className="hifz-btn" aria-pressed={tracked} onClick={toggle}>
      {tracked ? "✓ Memorizing" : "＋ Hifz"}
    </button>
  );
}
