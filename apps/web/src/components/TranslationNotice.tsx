"use client";

import { useEffect, useRef, useState } from "react";
import { N, Icon } from "@ummahlibrary/ui";
import { useIntl } from "../i18n/I18nProvider";
import { fetchCatalogue } from "../lib/catalogue";
import { focusSoon, focusTargetAfterRemoving } from "../lib/focus";
import { EDITIONS_KEY, editionsChosen, readEditions, writeEditions } from "../lib/editions";

/** Window event the reader toolbar listens for to open the translation chooser. */
export const OPEN_TRANSLATIONS_EVENT = "ul.openTranslations";

/**
 * Above the first verse, until the reader has chosen (ADR 0041): which
 * translation is showing by default — named, with its translator — and a
 * one-tap Change or Keep. Nothing is chosen for the reader silently.
 */
export function TranslationNotice() {
  const { t, tf } = useIntl();
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // "Keep" removes the notice — and the focused button with it. Hand focus to
  // whatever comes next on the page instead of dropping it to <body>.
  function keep() {
    const next = focusTargetAfterRemoving(box.current);
    void readEditions()
      .then((ids) => writeEditions(ids))
      .then(() => focusSoon(next));
  }

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (await editionsChosen()) {
        if (active) setShow(false);
        return;
      }
      const ids = await readEditions();
      const catalogue = await fetchCatalogue();
      const meta = catalogue.find((e) => e.id === ids[0]);
      if (!active) return;
      setLabel(meta ? `${meta.author} (${meta.language})` : null);
      setShow(true);
    };
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(EDITIONS_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(EDITIONS_KEY, onChange);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      ref={box}
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        margin: "16px 0 4px",
        padding: "10px 14px",
        borderRadius: 14,
        border: `1px solid ${N.border}`,
        background: N.card,
        fontFamily: N.ui,
        fontSize: 15,
        color: N.fg,
      }}
    >
      <Icon name="globe" size={18} color={N.gold} />
      <span style={{ flex: 1, minWidth: 180 }}>
        {label ? tf("tr.notice", { name: label }) : t("tr.noticeNone")}
      </span>
      <button
        type="button"
        className="nf-btn"
        style={{ minHeight: 44, padding: "0 14px", fontSize: 14.5 }}
        onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRANSLATIONS_EVENT))}
      >
        {t("tr.change")}
      </button>
      <button
        type="button"
        className="nf-btn"
        style={{ minHeight: 44, padding: "0 14px", fontSize: 14.5, border: "none", color: N.muted }}
        onClick={keep}
      >
        {t("tr.keep")}
      </button>
    </div>
  );
}
