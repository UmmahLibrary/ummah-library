"use client";

import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import { useIntl } from "../i18n/I18nProvider";
import { fetchCatalogue } from "../lib/catalogue";
import {
  CATALOGUE_LANGUAGE,
  DEFAULT_EDITIONS,
  type EditionChoice,
  defaultEditions,
  readEditions,
  writeEditions,
} from "../lib/editions";
import { onRadioGroupKeyDown } from "../lib/radio-group";

/**
 * "Which translation would you like?" (ADR 0041). Lists the established
 * translations in the reader's language with each translator's name, English,
 * and "None — Arabic only". The language default is preselected but nothing is
 * chosen for the reader until they tap (or press Next in the setup).
 */
export function TranslationChoice({ onPick }: { onPick?: () => void }) {
  const { t, locale } = useIntl();
  const [options, setOptions] = useState<EditionChoice[]>([]);
  const [current, setCurrent] = useState<string>("");

  useEffect(() => {
    void readEditions().then((ids) => setCurrent(ids[0] ?? "none"));
    void fetchCatalogue().then((all) => {
      const language = CATALOGUE_LANGUAGE[locale];
      // One entry per translator; skip the Latin-script ("-la"/"-lad") variants.
      const seen = new Set<string>();
      const mine = all
        .filter((e) => language && e.language === language && !/-la[d]?$/.test(e.id))
        .filter((e) => (seen.has(e.author) ? false : (seen.add(e.author), true)));
      // The default for this language first, then the rest alphabetically.
      const first = defaultEditions(locale)[0];
      mine.sort((a, b) =>
        a.id === first ? -1 : b.id === first ? 1 : a.author.localeCompare(b.author),
      );
      const english = all.find((e) => e.id === DEFAULT_EDITIONS[0]);
      setOptions(
        locale !== "en" && english
          ? [...mine, english]
          : mine.length
            ? mine
            : english
              ? [english]
              : [],
      );
    });
  }, [locale]);

  const choose = (id: string) => {
    setCurrent(id);
    void writeEditions(id === "none" ? [] : [id]);
    onPick?.();
  };

  // A render function, not a nested component: a component declared here would be
  // a new type every render, remounting the buttons (and dropping focus) on pick.
  // Roving tab stop (one Tab stop for the group; arrows move — see radio-group).
  const anyChecked = current === "none" || options.some((e) => e.id === current);
  const firstId = options[0]?.id ?? "none";
  const row = ({ id, title, sub }: { id: string; title: string; sub?: string }) => (
    <button
      key={id}
      type="button"
      role="radio"
      aria-checked={current === id}
      tabIndex={current === id || (!anyChecked && id === firstId) ? 0 : -1}
      className="nf-switch"
      onClick={() => choose(id)}
      style={{
        borderColor: current === id ? N.gold : undefined,
        background: current === id ? N.goldSoft : undefined,
        borderWidth: current === id ? 2 : 1,
      }}
    >
      <span>
        {title}
        {sub && <small>{sub}</small>}
      </span>
      {current === id && <span style={{ color: N.gold, fontWeight: 800 }}>✓</span>}
    </button>
  );

  return (
    <div
      role="radiogroup"
      aria-label={t("tr.choose")}
      onKeyDown={onRadioGroupKeyDown}
      style={{ display: "grid", gap: 8, maxHeight: "48dvh", overflowY: "auto" }}
    >
      {options.map((e) =>
        row({
          id: e.id,
          title: e.author,
          sub: `${e.language}${e.name !== e.author ? ` · ${e.name}` : ""}`,
        }),
      )}
      {row({ id: "none", title: t("tr.none"), sub: t("tr.noneNote") })}
    </div>
  );
}
