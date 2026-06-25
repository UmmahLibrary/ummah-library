"use client";

import { useCallback, useEffect, useState } from "react";
import { N, Icon } from "@ummahlibrary/ui";
import { revealAyah, revealWord, totalWords } from "@ummahlibrary/core";

// The verse-layout Arabic lines, in reading order. Both the surah and juzʾ
// readers render exactly one `.mode-translation` block of these.
const AYAH_SEL = ".mode-translation .ayah-ar";

/**
 * Recite — hide & peek (#134): a self-contained floating control that conceals
 * the Arabic so you can recite from memory, then reveals it — one word,
 * one āyah, or all at once — or tap any word to peek it.
 *
 * It drives the existing reader markup directly (the `peek-on` body class blurs
 * the per-word `.w` spans via CSS, regardless of the selected reading mode), so
 * the same component works on both readers with no prop threading. Reveal state
 * is ephemeral — peek mode always starts off, so the muṣḥaf is never hidden by
 * surprise on the next visit.
 */
export function MemorizeBar() {
  const [on, setOn] = useState(false);
  const [revealed, setRevealed] = useState(0); // ordered prefix of revealed words
  const [extra, setExtra] = useState<Set<number>>(new Set()); // ad-hoc tapped words
  const [hideTr, setHideTr] = useState(false);

  const ayahEls = useCallback(
    () => Array.from(document.querySelectorAll<HTMLElement>(AYAH_SEL)),
    [],
  );
  const wordCounts = useCallback(
    () => ayahEls().map((a) => a.querySelectorAll(".w").length),
    [ayahEls],
  );

  // Reflect the reveal cursor onto the DOM word spans.
  const apply = useCallback(() => {
    let idx = 0;
    for (const ayah of ayahEls()) {
      ayah.querySelectorAll<HTMLElement>(".w").forEach((w) => {
        w.classList.toggle("w--peek", idx < revealed || extra.has(idx));
        idx++;
      });
    }
  }, [ayahEls, revealed, extra]);

  useEffect(() => {
    if (on) apply();
  }, [on, apply]);

  // Tidy the body classes if the reader unmounts while peek is on.
  useEffect(
    () => () => document.body.classList.remove("peek-on", "peek-hide-tr"),
    [],
  );

  // While peeking, a tap on a concealed word reveals just that word. Bound on the
  // capture phase so it pre-empts the word-by-word popover (which listens on
  // bubble) — but non-word taps (e.g. the ▷ play marker) pass through untouched.
  useEffect(() => {
    if (!on) return;
    function onClick(e: MouseEvent) {
      const span = (e.target as HTMLElement).closest<HTMLElement>(`${AYAH_SEL} .w`);
      if (!span) return;
      e.preventDefault();
      e.stopPropagation();
      const i = ayahEls()
        .flatMap((a) => Array.from(a.querySelectorAll<HTMLElement>(".w")))
        .indexOf(span);
      if (i >= 0) setExtra((prev) => new Set(prev).add(i));
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [on, ayahEls]);

  function toggleOn() {
    const next = !on;
    setOn(next);
    setRevealed(0);
    setExtra(new Set());
    document.body.classList.toggle("peek-on", next);
    if (!next) {
      setHideTr(false);
      document.body.classList.remove("peek-hide-tr");
      document
        .querySelectorAll(".ayah-ar .w.w--peek")
        .forEach((w) => w.classList.remove("w--peek"));
    }
  }

  function toggleHideTr() {
    const next = !hideTr;
    setHideTr(next);
    document.body.classList.toggle("peek-hide-tr", next);
  }

  const total = () => totalWords(wordCounts());

  if (!on) {
    return (
      <div style={shell}>
        <button type="button" onClick={toggleOn} style={pill(false)} aria-pressed={false}>
          <Icon name="eye" size={16} />
          <span style={{ fontWeight: 700 }}>Recite</span>
        </button>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={tray}>
        <button type="button" onClick={toggleOn} style={pill(true)} aria-pressed={true}>
          <Icon name="eye" size={16} color={N.ink} />
          <span style={{ fontWeight: 700 }}>Recite</span>
        </button>
        <div style={divider} aria-hidden="true" />
        <Ctl onClick={() => setRevealed((r) => revealWord(r, total()))}>Peek word</Ctl>
        <Ctl onClick={() => setRevealed((r) => revealAyah(r, wordCounts()))}>Reveal āyah</Ctl>
        <Ctl
          onClick={() => {
            setRevealed(total());
            setExtra(new Set());
          }}
        >
          Show all
        </Ctl>
        <Ctl
          onClick={() => {
            setRevealed(0);
            setExtra(new Set());
          }}
        >
          Hide all
        </Ctl>
        <button
          type="button"
          onClick={toggleHideTr}
          style={ctl(hideTr)}
          aria-pressed={hideTr}
          title="Also hide the translation"
        >
          Translation
        </button>
        <button type="button" onClick={toggleOn} style={closeBtn} aria-label="Exit recite mode">
          <Icon name="close" size={15} />
        </button>
      </div>
    </div>
  );
}

function Ctl({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={ctl(false)}>
      {children}
    </button>
  );
}

const shell: React.CSSProperties = {
  position: "fixed",
  right: "clamp(14px, 4vw, 40px)",
  bottom: 80,
  zIndex: 30,
};
const tray: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 6,
  borderRadius: 14,
  background: N.card,
  border: `1px solid ${N.border}`,
  boxShadow: "0 12px 32px rgba(0,0,0,.35)",
  maxWidth: "calc(100vw - 28px)",
  flexWrap: "wrap",
};
const divider: React.CSSProperties = { width: 1, alignSelf: "stretch", background: N.borderSoft };

function pill(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 13px",
    borderRadius: 11,
    border: `1px solid ${active ? N.gold : N.border}`,
    background: active ? N.goldGrad : N.card,
    color: active ? N.ink : N.fg,
    fontFamily: N.ui,
    fontSize: 13.5,
    cursor: "pointer",
    boxShadow: active ? undefined : "0 12px 32px rgba(0,0,0,.35)",
  };
}

function ctl(active: boolean): React.CSSProperties {
  return {
    padding: "8px 11px",
    borderRadius: 10,
    border: `1px solid ${active ? N.gold : N.border}`,
    background: active ? N.goldSoft : N.card,
    color: active ? N.gold : N.fg,
    fontFamily: N.ui,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

const closeBtn: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  borderRadius: 10,
  border: `1px solid ${N.border}`,
  background: N.card,
  color: N.muted,
  cursor: "pointer",
};
