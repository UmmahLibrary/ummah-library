import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { useIntl } from "../i18n/I18nProvider";

/**
 * Above the first verse, until the reader has chosen (ADR 0041), mirroring
 * web: names the translation shown by default (translator and language) with
 * Change (opens the translation manager) and Keep this. Nothing is chosen for
 * the reader silently.
 */
export function TranslationNotice({ onChange }: { onChange: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { editionsChosen, editions, catalogue, keepEditions } = useSettings();
  const { t, tf } = useIntl();
  if (editionsChosen) return null;
  const meta = catalogue.find((e) => e.id === editions[0]);
  const label = meta
    ? tf("tr.notice", { name: `${meta.author} (${meta.language})` })
    : editions.length === 0
      ? t("tr.noticeNone")
      : null;
  if (!label) return null;
  return (
    <View style={styles.box} accessibilityRole="summary">
      <Text style={styles.text}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={onChange} accessibilityRole="button">
          <Text style={styles.btnText}>{t("tr.change")}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.ghost]}
          onPress={keepEditions}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, { color: colors.muted }]}>{t("tr.keep")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    box: {
      marginHorizontal: 16,
      marginVertical: 10,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      gap: 10,
    },
    text: { color: c.fg, fontSize: 15, fontFamily: FONT.medium, lineHeight: 22 },
    row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    btn: {
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    ghost: { borderColor: "transparent" },
    btnText: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold },
  });
}
