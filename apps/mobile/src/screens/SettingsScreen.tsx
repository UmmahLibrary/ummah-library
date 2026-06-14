import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { useSettings } from "../state/SettingsContext";
import { RECITER, RECITERS } from "../plugins";
import { MAX_SCALE, MIN_SCALE } from "../types";

export function SettingsScreen() {
  const { colors, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { scale, setScale, reciterId, tafsirId, tafsirs, setTafsirId } = useSettings();
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Dark theme</Text>
        <Switch
          value={mode === "dark"}
          onValueChange={toggle}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.bg}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Font size</Text>
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

      <View style={styles.row}>
        <Text style={styles.label}>Reciter</Text>
        <Text style={styles.value}>{reciter.name}</Text>
      </View>

      <Text style={styles.section}>Tafsir</Text>
      {tafsirs.length === 0 ? (
        <Text style={styles.muted}>Loading tafsir editions…</Text>
      ) : (
        tafsirs.map((t) => (
          <Pressable key={t.id} style={styles.pickRow} onPress={() => setTafsirId(t.id)}>
            <Text style={[styles.pickText, t.id === tafsirId && styles.pickTextOn]}>
              {t.id === tafsirId ? "● " : "○ "}
              {t.name}
            </Text>
            <Text style={styles.pickSub}>{t.author}</Text>
          </Pressable>
        ))
      )}

      <Text style={styles.section}>About</Text>
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
    content: { padding: 18 },
    h1: { color: c.fg, fontSize: 24, fontWeight: "700", marginBottom: 16 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    label: { color: c.fg, fontSize: 16 },
    value: { color: c.muted, fontSize: 15 },
    scale: { flexDirection: "row", alignItems: "center", gap: 12 },
    scaleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    disabled: { opacity: 0.4 },
    scaleText: { color: c.fg, fontSize: 14, fontWeight: "600" },
    scaleValue: { color: c.muted, fontSize: 14, minWidth: 44, textAlign: "center" },
    section: { color: c.fg, fontSize: 16, fontWeight: "700", marginTop: 28, marginBottom: 8 },
    muted: { color: c.muted, fontSize: 14, lineHeight: 22 },
    pickRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    pickText: { color: c.fg, fontSize: 15 },
    pickTextOn: { color: c.accent, fontWeight: "600" },
    pickSub: { color: c.muted, fontSize: 12, marginTop: 2, marginLeft: 18 },
    version: { color: c.muted, fontSize: 13, marginTop: 16 },
  });
}
