"use client";

import { useEffect, useState } from "react";
import { type ReciterPlugin } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { type EditionChoice, DEFAULT_EDITIONS, readEditions } from "../lib/editions";
import { fetchCatalogue } from "../lib/catalogue";
import { BOOKMARKS_EVENT, readBookmarks, toggleBookmark as toggleBm } from "../lib/bookmarks";
import { SCALE_EVENT, readReciter, readScale, writeReciter } from "../lib/reader-prefs";
import { readWordByWord, writeLastRead, writeWordByWord } from "../lib/reader-prefs-store";
import { readTransliteration, writeTransliteration } from "../lib/transliteration";
import { WORD_TRANSLIT_CLASS, readWordTranslit, writeWordTranslit } from "../lib/word-translit";
import { TAP_HEAR_CLASS, readTapToHear, writeTapToHear } from "../lib/tap-to-hear";
import { SCRIPT_INDOPAK_CLASS, readScript, writeScript } from "../lib/script";
import { TranslationSettings } from "./TranslationSettings";
import { SizeControls } from "./SizeControls";
import { OPEN_TRANSLATIONS_EVENT } from "./TranslationNotice";
import { TafsirPicker } from "./TafsirPicker";
import { WBW_KEY } from "./WordByWord";
import { useT } from "../i18n/I18nProvider";

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
  const t = useT();
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

  // "Change" on the translation notice above the first verse opens the chooser.
  useEffect(() => {
    const open = () => setManaging(true);
    window.addEventListener(OPEN_TRANSLATIONS_EVENT, open);
    return () => window.removeEventListener(OPEN_TRANSLATIONS_EVENT, open);
  }, []);

  useEffect(() => {
    void readScale().then((s) => {
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

  // Kept separate: re-read only the bookmark/scale flags when they change
  // elsewhere (another tab, or a synced device), without re-running every
  // other read above.
  useEffect(() => {
    const onBookmarks = () =>
      void readBookmarks().then((list) => setBookmarked(list.includes(surahNumber)));
    const onScale = () =>
      void readScale().then((s) => {
        document.documentElement.style.setProperty("--reading-scale", String(s));
      });
    window.addEventListener(BOOKMARKS_EVENT, onBookmarks);
    window.addEventListener(SCALE_EVENT, onScale);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, onBookmarks);
      window.removeEventListener(SCALE_EVENT, onScale);
    };
  }, [surahNumber]);

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

  function toggleBookmark() {
    void toggleBm(surahNumber).then((next) => setBookmarked(next.includes(surahNumber)));
  }
  function chooseReciter(id: string) {
    setReciterId(id);
    void writeReciter(id);
    window.dispatchEvent(new CustomEvent(RECITER_KEY, { detail: id }));
    setPanel(null);
  }

  const popover = {
    position: "absolute" as const,
    top: "100%",
    insetInlineEnd: 0,
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
    label,
    on,
    onClick,
  }: {
    icon: IconName;
    title: string;
    /** The word shown under the icon — every control says what it does. */
    label: string;
    on?: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={on}
        onClick={onClick}
        className="tb-btn"
        data-on={on ? "true" : undefined}
      >
        <Icon name={icon} size={20} />
        <span aria-hidden="true">{label}</span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Display / text size */}
      <div style={{ position: "relative", zIndex: panel === "display" ? 42 : undefined }}>
        <IconBtn
          icon="type"
          title={t("toolbar.textTitle")}
          label={t("toolbar.text")}
          on={panel === "display"}
          onClick={() => setPanel((p) => (p === "display" ? null : "display"))}
        />
        {panel === "display" && (
          <div
            className="noor-pop-sm-left"
            style={{
              ...popover,
              minWidth: 260,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 160px)",
              overflowY: "auto",
            }}
          >
            <div style={sectionLabel}>{t("toolbar.textSize")}</div>
            <SizeControls sample={false} />
            <button
              type="button"
              className="nf-btn noor-only-sm"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => {
                setPanel(null);
                setManaging(true);
              }}
            >
              <Icon name="globe" size={18} />
              {t("toolbar.chooseTranslations")}
            </button>

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
                <Icon name="type" size={15} color={wbw ? N.gold : N.muted} />{" "}
                {t("toolbar.wordByWord")}
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
                <Icon name="globe" size={15} color={translit ? N.gold : N.muted} />{" "}
                {t("toolbar.transliteration")}
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
                <Icon name="globe" size={15} color={wordTranslit ? N.gold : N.muted} />{" "}
                {t("toolbar.wordTranslit")}
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
                <Icon name="headphones" size={15} color={tapHear ? N.gold : N.muted} />{" "}
                {t("toolbar.tapToHear")}
              </span>
              {tapHear && <Icon name="check" size={15} color={N.gold} />}
            </button>

            <div style={{ height: 1, background: N.borderSoft, margin: "14px -12px" }} />
            <div style={sectionLabel}>{t("toolbar.arabicScript")}</div>
            <div
              role="group"
              aria-label={t("toolbar.arabicScript")}
              style={{
                display: "flex",
                borderRadius: 10,
                border: `1px solid ${N.border}`,
                overflow: "hidden",
                background: N.card,
              }}
            >
              {[
                { value: false, label: t("toolbar.uthmani"), hint: t("toolbar.uthmaniHint") },
                { value: true, label: t("toolbar.indopak"), hint: t("toolbar.indopakHint") },
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
                <div style={sectionLabel}>{t("toolbar.tafsirEdition")}</div>
                <TafsirPicker tafsirs={tafsirs} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reciter — on phones it lives in the dock's Options instead */}
      {reciters.length > 0 && (
        <div
          className="noor-hide-sm"
          style={{ position: "relative", zIndex: panel === "reciter" ? 42 : undefined }}
        >
          <IconBtn
            icon="headphones"
            title={t("toolbar.reciter")}
            label={t("toolbar.reciter")}
            on={panel === "reciter"}
            onClick={() => setPanel((p) => (p === "reciter" ? null : "reciter"))}
          />
          {panel === "reciter" && (
            <div
              className="noor-pop-sm-left"
              style={{ ...popover, minWidth: 220, maxHeight: 320, overflowY: "auto" }}
            >
              <div style={sectionLabel}>{t("toolbar.reciter")}</div>
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
                      textAlign: "start",
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

      {/* Translations — on phones it's inside the Text panel */}
      <span className="noor-hide-sm" style={{ display: "contents" }}>
        <IconBtn
          icon="globe"
          title={t("toolbar.translations")}
          label={t("toolbar.translation")}
          on={managing}
          onClick={() => setManaging(true)}
        />
      </span>

      {/* Verse by verse / Reading / Mushaf — full words; on phones this row
          moves under the bar (SurahReaderClient renders it). */}
      <div className="reader-seg" role="group" aria-label={t("reader.readingMode")}>
        {segOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onSeg(o.value)}
            aria-pressed={o.value === segValue}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Bookmark this surah */}
      <IconBtn
        icon="bookmark"
        title={bookmarked ? t("toolbar.bookmarked") : t("toolbar.bookmarkSurah")}
        label={bookmarked ? t("toolbar.saved") : t("toolbar.save")}
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
