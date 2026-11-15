"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import type { QuranScript } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { useDocumentTitle, useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { SCRIPT_INDOPAK_CLASS, readScript, writeScript } from "../lib/script";
import { LanguagePicker } from "./LanguagePicker";
import { SizeControls } from "./SizeControls";
import { ThemePicker } from "./ThemePicker";
import { ComfortSettings } from "./ComfortSettings";
import { SyncSettings } from "./SyncSettings";
import { DataBackup } from "./DataBackup";
import { NoorPageFrame } from "./NoorPageFrame";

interface Section {
  id: string;
  icon: IconName;
  title: MessageKey;
  note: MessageKey;
  body: ReactNode;
}

/**
 * Settings, ordered by how often people need each thing (ADR 0041):
 * language first (nothing else helps if you can't read the screen), then text
 * size and theme, how the Quran is shown, simpler modes, accessibility, habit
 * tracking, and finally data, which is rarely touched. A sticky row of chips
 * jumps to any section; every section says in one line what it is for.
 */
export function SettingsView() {
  const t = useT();
  const sections: Section[] = [
    {
      id: "language",
      icon: "globe",
      title: "common.language",
      note: "settings.languageNote",
      body: <LanguagePicker bare />,
    },
    {
      id: "text",
      icon: "type",
      title: "settings.text",
      note: "settings.textNote",
      body: (
        <div style={{ display: "grid", gap: 20 }}>
          <SizeControls />
          <ThemePicker />
        </div>
      ),
    },
    {
      id: "reading",
      icon: "book",
      title: "settings.reading",
      note: "settings.readingNote",
      body: (
        <div style={{ display: "grid", gap: 10 }}>
          <ScriptChoice />
          <ComfortSettings part="reading" />
        </div>
      ),
    },
    {
      id: "modes",
      icon: "home",
      title: "comfort.modes",
      note: "settings.modesNote",
      body: <ComfortSettings part="modes" />,
    },
    {
      id: "access",
      icon: "eye",
      title: "settings.access",
      note: "settings.accessNote",
      body: <ComfortSettings part="access" />,
    },
    {
      id: "habit",
      icon: "check",
      title: "comfort.habit",
      note: "settings.habitNote",
      body: (
        <div style={{ display: "grid", gap: 10 }}>
          <ComfortSettings part="habit" />
          <Link href="/goals" className="nf-btn" style={{ justifySelf: "start" }}>
            <Icon name="bell" size={18} />
            {t("settings.goalsLink")}
          </Link>
        </div>
      ),
    },
    {
      id: "data",
      icon: "download",
      title: "settings.data",
      note: "settings.dataNote",
      body: (
        <div style={{ display: "grid", gap: 16 }}>
          <SyncSettings />
          <DataBackup />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <nav aria-label={t("settings.jump")} className="settings-chips">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="settings-chip">
            <Icon name={s.icon} size={16} />
            {t(s.title)}
          </a>
        ))}
      </nav>
      {sections.map((s) => (
        <section
          key={s.id}
          id={s.id}
          aria-labelledby={`${s.id}-title`}
          className="nf-card settings-section"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="settings-ic" aria-hidden="true">
              <Icon name={s.icon} size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h2
                id={`${s.id}-title`}
                style={{ margin: 0, fontFamily: N.ui, fontSize: 18, fontWeight: 800, color: N.fg }}
              >
                {t(s.title)}
              </h2>
              <p style={{ margin: "2px 0 0", fontFamily: N.ui, fontSize: 14, color: N.muted }}>
                {t(s.note)}
              </p>
            </div>
          </div>
          {s.body}
        </section>
      ))}
    </div>
  );
}

/** IndoPak or Uthmani — previously only reachable from inside the reader. */
function ScriptChoice() {
  const t = useT();
  const [script, setScript] = useState<QuranScript | null>(null);
  useEffect(() => void readScript().then(setScript), []);
  const choose = (s: QuranScript) => {
    setScript(s);
    document.body.classList.toggle(SCRIPT_INDOPAK_CLASS, s === "indopak");
    void writeScript(s);
  };
  return (
    <div role="radiogroup" aria-label={t("settings.script")} style={{ display: "grid", gap: 8 }}>
      <span style={{ fontFamily: N.ui, fontSize: 15, fontWeight: 700, color: N.fg }}>
        {t("settings.script")}
      </span>
      {(
        [
          ["uthmani", "settings.scriptUthmani"],
          ["indopak", "settings.scriptIndopak"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={script === value}
          className="nf-switch"
          onClick={() => choose(value)}
          style={{
            borderColor: script === value ? N.gold : undefined,
            background: script === value ? N.goldSoft : undefined,
          }}
        >
          <span>{t(label)}</span>
          {script === value && <span style={{ color: N.gold, fontWeight: 800 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

/** The settings page frame, with its title and subtitle in the interface language. */
export function SettingsPageClient() {
  const t = useT();
  useDocumentTitle(t("common.settings"));
  return (
    <NoorPageFrame
      title={t("common.settings")}
      sub={t("settings.sub")}
      glyph="⚙"
      back="/"
      maxW={680}
    >
      <SettingsView />
    </NoorPageFrame>
  );
}
