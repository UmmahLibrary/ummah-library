"use client";

import { useEffect, useState } from "react";
import { type ReciterPlugin } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { type EditionChoice, DEFAULT_EDITIONS, readEditions } from "../lib/editions";
import { fetchCatalogue } from "../lib/catalogue";
import { readBookmarks, toggleBookmark as toggleBm } from "../lib/bookmarks";
import { readReciter, readScale, writeReciter, writeScale } from "../lib/reader-prefs";
import { readWordByWord, writeLastRead, writeWordByWord } from "../lib/reader-prefs-store";
import { readTransliteration, writeTransliteration } from "../lib/transliteration";
import { WORD_TRANSLIT_CLASS, readWordTranslit, writeWordTranslit } from "../lib/word-translit";
import { TAP_HEAR_CLASS, readTapToHear, writeTapToHear } from "../lib/tap-to-hear";
import { SCRIPT_INDOPAK_CLASS, readScript, writeScript } from "../lib/script";
import { TranslationSettings } from "./TranslationSettings";
import { TafsirPicker } from "./TafsirPicker";
import { WBW_KEY } from "./WordByWord";

const SCALE_MIN = 0.8;
const SCALE_MAX = 1.8;
const RECITER_KEY = "ul.reciter";

interface SegOption {
  value: string;
  label: string;
}

type Panel = "display" | "reciter" | null;

/**
 * The reader top-bar control cluster (mirrors the Noor design): text size,
 * reciter, translations, the Verse/Reading/Mushaf segmented control, and a surah
 * bookmark — wired to the same mechanisms the dock and home shelf already use.
 */
export function ReaderToolbar({
  surahNumber,
  reciters,
  tafsirs,
  segValue,
  segOptions,
  onSeg,
}: {
  surahNumber: number;
  reciters: ReciterPlugin[];
  tafsirs: { id: string; name: string }[];
  segValue: string;
  segOptions: SegOption[];
  onSeg: (value: string) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [scale, setScale] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? "");
  const [wbw, setWbw] = useState(false);
  const [translit, setTranslit] = useState(false);
  const [wordTranslit, setWordTranslit] = useState(false);
  const [tapHear, setTapHear] = useState(false);
  const [indopak, setIndopak] = useState(false);
  const [managing, setManaging] = useState(false);
  const [catalogue, setCatalogue] = useState<EditionChoice[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_EDITIONS));

  useEffect(() => {
    void readScale().then((s) => {
      setScale(s);
      document.documentElement.style.setProperty("--reading-scale", String(s));
    });
    void readBookmarks().then((list) => setBookmarked(list.includes(surahNumber)));
    writeLastRead(surahNumber);
    void readReciter().then((r) => {
      if (r && reciters.some((x) => x.id === r)) setReciterId(r);
    });
    const wbwOn = readWordByWord();
    setWbw(wbwOn);
    document.body.classList.toggle("wbw-on", wbwOn);
    void readTransliteration().then(setTranslit);
    void readWordTranslit().then((on) => {
      setWordTranslit(on);
      document.body.classList.toggle(WORD_TRANSLIT_CLASS, on);
    });
    void readTapToHear().then((on) => {
      setTapHear(on);
      document.body.classList.toggle(TAP_HEAR_CLASS, on);
    });
    void readScript().then((s) => {
      const on = s === "indopak";
      setIndopak(on);
      document.body.classList.toggle(SCRIPT_INDOPAK_CLASS, on);
    });
    void readEditions().then((ids) => setSelected(new Set(ids)));
    void fetchCatalogue().then(setCatalogue);
  }, [surahNumber, reciters]);

  function toggleWbw() {
    const next = !wbw;
    setWbw(next);
    document.body.classList.toggle("wbw-on", next);
    writeWordByWord(next);
    window.dispatchEvent(new CustomEvent(WBW_KEY, { detail: next }));
  }

  function toggleTranslit() {
    const next = !translit;
    setTranslit(next);
    void writeTransliteration(next); // persists + broadcasts `ul.transliteration`
  }

  function toggleWordTranslit() {
    const next = !wordTranslit;
    setWordTranslit(next);
    document.body.classList.toggle(WORD_TRANSLIT_CLASS, next);
    void writeWordTranslit(next); // persists + broadcasts `ul.wbwTranslit`
  }

  function toggleTapHear() {
    const next = !tapHear;
    setTapHear(next);
    document.body.classList.toggle(TAP_HEAR_CLASS, next);
    void writeTapToHear(next); // persists + broadcasts `ul.tapToHear`
  }

  function chooseScript(next: boolean) {
    if (next === indopak) return;
    setIndopak(next);
    document.body.classList.toggle(SCRIPT_INDOPAK_CLASS, next);
    void writeScript(next ? "indopak" : "uthmani"); // persists + broadcasts `ul.script`
  }

  function changeScale(delta: number) {
    const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round((scale + delta) * 10) / 10));
    setScale(next);
    void writeScale(next);
    document.documentElement.style.setProperty("--reading-scale", String(next));
  }
  function toggleBookmark() {
    void toggleBm(surahNumber).then((next) => setBookmarked(next.includes(surahNumber)));
  }
  function chooseReciter(id: string) {
    setReciterId(id);
    void writeReciter(id);
    window.dispatchEvent(new CustomEvent(RECITER_KEY, { detail: id }));
    setPanel(null);
  }

  const iconBtn = (on: boolean) =>
    ({
      width: 40,
      height: 40,
      borderRadius: 11,
      border: `1px solid ${on ? N.gold : N.border}`,
      background: on ? N.goldSoft : N.card,
      color: on ? N.gold : N.muted,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      flexShrink: 0,
    }) as const;

  const popover = {
    position: "absolute" as const,
    top: "100%",
    right: 0,
    marginTop: 8,
    zIndex: 41,
    padding: 12,
    borderRadius: 14,
    background: N.card,
    border: `1px solid ${N.border}`,
    boxShadow: "0 12px 32px rgba(0,0,0,.35)",
  };
  const sectionLabel = {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: N.faint,
    fontWeight: 700,
    fontFamily: N.ui,
    marginBottom: 10,
  };

  function IconBtn({
    icon,
    title,
    on,
    onClick,
  }: {
    icon: IconName;
    title: string;
    on?: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        style={iconBtn(!!on)}
      >
        <Icon name={icon} size={18} />
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Display / text size */}
      <div style={{ position: "relative", zIndex: panel === "display" ? 42 : undefined }}>
        <IconBtn
          icon="type"
          title="Text size"
          on={panel === "display"}
          onClick={() => setPanel((p) => (p === "display" ? null : "display"))}
        />
        {panel === "display" && (
          <div style={{ ...popover, minWidth: 244, right: "auto", left: 0 }}>
            <div style={sectionLabel}>Text size</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => changeScale(-0.1)}
                disabled={scale <= SCALE_MIN}
                aria-label="Decrease text size"
                style={{
                  ...iconBtn(false),
                  width: 34,
                  height: 34,
                  opacity: scale <= SCALE_MIN ? 0.4 : 1,
                }}
              >
                <Icon name="minus" size={16} />
              </button>
              <span
                style={{
                  minWidth: 44,
                  textAlign: "center",
                  color: N.fg,
                  fontFamily: N.ui,
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => changeScale(0.1)}
                disabled={scale >= SCALE_MAX}
                aria-label="Increase text size"
                style={{
                  ...iconBtn(false),
                  width: 34,
                  height: 34,
                  opacity: scale >= SCALE_MAX ? 0.4 : 1,
                }}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>

            <div style={{ height: 1, background: N.borderSoft, margin: "14px -12px" }} />
            <button
              type="button"
              onClick={toggleWbw}
              aria-pressed={wbw}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                padding: "9px 11px",
                borderRadius: 10,
                border: `1px solid ${wbw ? N.gold : N.border}`,
                background: wbw ? N.goldSoft : N.card,
                color: wbw ? N.gold : N.fg,
                cursor: "pointer",
                fontFamily: N.ui,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="type" size={15} color={wbw ? N.gold : N.muted} /> Word by word
              </span>
              {wbw && <Icon name="check" size={15} color={N.gold} />}
            </button>

            <button
              type="button"
              onClick={toggleTranslit}
              aria-pressed={translit}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                marginTop: 8,
                padding: "9px 11px",
                borderRadius: 10,
                border: `1px solid ${translit ? N.gold : N.border}`,
                background: translit ? N.goldSoft : N.card,
                color: translit ? N.gold : N.fg,
                cursor: "pointer",
                fontFamily: N.ui,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="globe" size={15} color={translit ? N.gold : N.muted} /> Transliteration
              </span>
              {translit && <Icon name="check" size={15} color={N.gold} />}
            </button>

            <button
              type="button"
              onClick={toggleWordTranslit}
              aria-pressed={wordTranslit}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                marginTop: 8,
                padding: "9px 11px",
                borderRadius: 10,
                border: `1px solid ${wordTranslit ? N.gold : N.border}`,
                background: wordTranslit ? N.goldSoft : N.card,
                color: wordTranslit ? N.gold : N.fg,
                cursor: "pointer",
                fontFamily: N.ui,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="globe" size={15} color={wordTranslit ? N.gold : N.muted} /> Word
                transliteration
              </span>
              {wordTranslit && <Icon name="check" size={15} color={N.gold} />}
            </button>

            <button
              type="button"
              onClick={toggleTapHear}
              aria-pressed={tapHear}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                marginTop: 8,
                padding: "9px 11px",
                borderRadius: 10,
                border: `1px solid ${tapHear ? N.gold : N.border}`,
                background: tapHear ? N.goldSoft : N.card,
                color: tapHear ? N.gold : N.fg,
                cursor: "pointer",
                fontFamily: N.ui,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="headphones" size={15} color={tapHear ? N.gold : N.muted} /> Tap a word
                to hear
              </span>
              {tapHear && <Icon name="check" size={15} color={N.gold} />}
            </button>

            <div style={{ height: 1, background: N.borderSoft, margin: "14px -12px" }} />
            <div style={sectionLabel}>Arabic script</div>
            <div
              role="group"
              aria-label="Arabic script"
              style={{
                display: "flex",
                borderRadius: 10,
                border: `1px solid ${N.border}`,
                overflow: "hidden",
                background: N.card,
              }}
            >
              {[
                { value: false, label: "Uthmani", hint: "Uthmani / Madinah script" },
                { value: true, label: "IndoPak", hint: "IndoPak / South Asian script" },
              ].map((o) => {
                const active = o.value === indopak;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => chooseScript(o.value)}
                    aria-pressed={active}
                    title={o.hint}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      fontFamily: N.ui,
                      fontWeight: active ? 700 : 500,
                      color: active ? N.ink : N.muted,
                      background: active ? N.gold : "transparent",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {active && <Icon name="check" size={14} color={N.ink} />}
                    {o.label}
                  </button>
                );
              })}
            </div>

            {tafsirs.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={sectionLabel}>Tafsir edition</div>
                <TafsirPicker tafsirs={tafsirs} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reciter */}
      {reciters.length > 0 && (
        <div style={{ position: "relative", zIndex: panel === "reciter" ? 42 : undefined }}>
          <IconBtn
            icon="headphones"
            title="Reciter"
            on={panel === "reciter"}
            onClick={() => setPanel((p) => (p === "reciter" ? null : "reciter"))}
          />
          {panel === "reciter" && (
            <div
              className="noor-pop-sm-left"
              style={{ ...popover, minWidth: 220, maxHeight: 320, overflowY: "auto" }}
            >
              <div style={sectionLabel}>Reciter</div>
              {reciters.map((r) => {
                const on = r.id === reciterId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => chooseReciter(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: 9,
                      border: "none",
                      cursor: "pointer",
                      background: on ? N.goldSoft : "transparent",
                      color: on ? N.gold : N.fg,
                      fontFamily: N.ui,
                      fontSize: 13.5,
                      fontWeight: on ? 700 : 600,
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {r.name}
                    </span>
                    {on && <Icon name="check" size={15} color={N.gold} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Translations */}
      <IconBtn icon="globe" title="Translations" on={managing} onClick={() => setManaging(true)} />

      {/* Verse / Reading / Mushaf */}
      <div
        style={{
          display: "flex",
          borderRadius: 10,
          border: `1px solid ${N.border}`,
          overflow: "hidden",
          background: N.card,
        }}
      >
        {segOptions.map((o) => {
          const active = o.value === segValue;
          return (
            <button
              key={o.value}
              onClick={() => onSeg(o.value)}
              className="noor-seg-btn"
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontFamily: N.ui,
                fontWeight: active ? 700 : 500,
                color: active ? N.ink : N.muted,
                background: active ? N.gold : "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span className="noor-hide-sm">{o.label}</span>
              <span className="noor-only-sm">{o.label.charAt(0)}</span>
            </button>
          );
        })}
      </div>

      {/* Bookmark this surah */}
      <IconBtn
        icon="bookmark"
        title={bookmarked ? "Bookmarked" : "Bookmark surah"}
        on={bookmarked}
        onClick={toggleBookmark}
      />

      {/* Click-away for the popovers */}
      {panel && (
        <div
          onClick={() => setPanel(null)}
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          aria-hidden="true"
        />
      )}

      {managing && (
        <TranslationSettings
          editions={catalogue}
          selected={selected}
          onChange={(next) => setSelected(new Set(next))}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
