import { useMemo } from "react";
import {
  CATALOGUE_LANGUAGE,
  ENGLISH_DEFAULT_TRANSLATION,
  type Translation,
} from "@ummahlibrary/core";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { useI18n } from "../i18n/I18nProvider";
import { defaultEditions } from "../types";

/** The language whose translations to list: the interface's, else the device's. */
function listLanguage(uiLocale: string): string {
  if (uiLocale !== "en") return uiLocale;
  try {
    return (Intl.DateTimeFormat().resolvedOptions().locale ?? "en").split(/[-_]/)[0] ?? "en";
  } catch {
    return "en";
  }
}

/**
 * "Which translation would you like?" (ADR 0041), mirroring web: the
 * established translations in the reader's language with each translator's
 * name, English, and "None — Arabic only". The language default is marked;
 * tapping a row makes it the reader's choice.
 */
export function TranslationChoice({ onPick }: { onPick?: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { catalogue, editions, setEditions } = useSettings();
  const { locale, t } = useI18n();

  const options = useMemo(() => {
    const lang = listLanguage(locale);
    const name = CATALOGUE_LANGUAGE[lang];
    const seen = new Set<string>();
    const mine = catalogue
      .filter((e) => name && e.language === name && !/-la[d]?$/.test(e.id))
      .filter((e) => (seen.has(e.author) ? false : (seen.add(e.author), true)));
    const first = defaultEditions(locale)[0];
    mine.sort((a, b) =>
      a.id === first ? -1 : b.id === first ? 1 : a.author.localeCompare(b.author),
    );
    const english = catalogue.find((e) => e.id === ENGLISH_DEFAULT_TRANSLATION);
    const out: Translation[] = lang !== "en" && english ? [...mine, english] : mine;
    return out.length ? out : english ? [english] : [];
  }, [catalogue, locale]);

  const current = editions[0] ?? "none";
  const choose = (id: string) => {
    setEditions(id === "none" ? [] : [id]);
    onPick?.();
  };

  const row = (id: string, title: string, sub: string) => {
    const on = current === id;
    return (
      <Pressable
        key={id}
        style={[styles.row, on && styles.rowOn]}
        onPress={() => choose(id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        accessibilityLabel={`${title}. ${sub}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
        {on && <Text style={styles.tick}>✓</Text>}
      </Pressable>
    );
  };

  return (
    <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
      {options.map((e) =>
        row(e.id, e.author, e.name !== e.author ? `${e.language} · ${e.name}` : e.language),
      )}
      {row("none", t("tr.none"), t("tr.noneNote"))}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 60,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    rowOn: { borderColor: c.accent, borderWidth: 2, backgroundColor: c.accentSoft },
    title: { color: c.fg, fontSize: 16, fontFamily: FONT.semibold },
    sub: { color: c.muted, fontSize: 13.5, fontFamily: FONT.medium, marginTop: 2 },
    tick: { color: c.fg, fontSize: 18, fontFamily: FONT.bold },
  });
}
