import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { noorThemes } from "@ummahlibrary/ui";
import { useTheme, THEMES, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { RECITER, RECITERS } from "../plugins";
import { MAX_SCALE, MIN_SCALE } from "../types";

export function SettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { scale, setScale, reciterId, tafsirId, tafsirs, setTafsirId } = useSettings();
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Appearance</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Theme</Text>
        <View style={styles.swatchRow}>
          {THEMES.map((t) => {
            const on = t.key === themeKey;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTheme(t.key)}
                style={[
                  styles.swatch,
                  { backgroundColor: noorThemes[t.key].bg, borderColor: on ? colors.accent : colors.border },
                ]}
                accessibilityLabel={t.label}
              >
                <View style={[styles.swatchDot, { backgroundColor: noorThemes[t.key].accent }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Reading</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Font size</Text>
          <View style={styles.scale}>
            <Pressable
              style={[styles.scaleBtn, scale <= MIN_SCALE && styles.disabled]}
              disabled={scale <= MIN_SCALE}
              onPress={() => setScale(scale - 0.1)}
            >
              <Text style={styles.scaleText}>A−</Text>
            </Pressable>
            <Text style={styles.scaleValue}>{Math.round(scale * 100)}%</Text>
            <Pressable
              style={[styles.scaleBtn, scale >= MAX_SCALE && styles.disabled]}
              disabled={scale >= MAX_SCALE}
              onPress={() => setScale(scale + 0.1)}
            >
              <Text style={styles.scaleText}>A+</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowLabel}>Reciter</Text>
          <Text style={styles.value}>{reciter.name}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Tafsir edition</Text>
      <View style={styles.card}>
        {tafsirs.length === 0 ? (
          <Text style={styles.muted}>Loading tafsir editions…</Text>
        ) : (
          tafsirs.map((t, i) => {
            const on = t.id === tafsirId;
            return (
              <Pressable
                key={t.id}
                style={[styles.pickRow, i < tafsirs.length - 1 && styles.rowDivider]}
                onPress={() => setTafsirId(t.id)}
              >
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickText, on && styles.pickTextOn]}>{t.name}</Text>
                  <Text style={styles.pickSub}>{t.author}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.sectionLabel}>About</Text>
      <Text style={styles.muted}>
        Arabic text: Tanzil (CC-BY 3.0). Translations, tafsir, and hadith via Ummah Library
        datasets and their respective sources. Recitation by {RECITER.name}.
      </Text>
      <Text style={styles.version}>Ummah Library · v1.0.0</Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 18, paddingBottom: 32 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 22,
      marginBottom: 11,
    },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
    },
    cardLabel: { color: c.fg, fontSize: 14.5, fontFamily: FONT.semibold, marginBottom: 13 },
    swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    swatchDot: { width: 13, height: 13, borderRadius: 7 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    rowLabel: { color: c.fg, fontSize: 15.5, fontFamily: FONT.semibold },
    value: { color: c.muted, fontSize: 15 },
    scale: { flexDirection: "row", alignItems: "center", gap: 12 },
    scaleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    disabled: { opacity: 0.4 },
    scaleText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    scaleValue: { color: c.muted, fontSize: 14, minWidth: 44, textAlign: "center" },
    muted: { color: c.muted, fontSize: 14, lineHeight: 22 },
    pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.faint,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: { borderColor: c.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    pickText: { color: c.fg, fontSize: 15, fontFamily: FONT.medium },
    pickTextOn: { color: c.accent, fontFamily: FONT.semibold },
    pickSub: { color: c.faint, fontSize: 12, marginTop: 2 },
    version: { color: c.faint, fontSize: 13, marginTop: 16 },
  });
}
