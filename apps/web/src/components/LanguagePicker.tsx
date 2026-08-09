"use client";

import { N } from "@ummahlibrary/ui";
import { LOCALES } from "../i18n/config";
import { useI18n } from "../i18n/I18nProvider";

/** Interface-language selector (#208). Switches the app UI locale; content is unaffected. */
export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div style={{ ...card, padding: "18px 20px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
        {t("common.language")}
      </div>
      <p style={{ fontSize: 13, color: N.muted, margin: "6px 0 14px", lineHeight: 1.6, fontFamily: N.ui }}>
        {t("settings.languageHint")}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              aria-pressed={active}
              lang={l.code}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: `1px solid ${active ? N.gold : N.border}`,
                background: active ? N.goldSoft : "transparent",
                color: active ? N.gold : N.muted,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: N.ui,
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const card = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;
