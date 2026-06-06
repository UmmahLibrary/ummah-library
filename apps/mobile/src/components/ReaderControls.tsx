import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, type Palette } from "../theme";
import { MAX_SCALE, MIN_SCALE, type ReadingMode } from "../types";

const MODES: { mode: ReadingMode; label: string }[] = [
  { mode: "translation", label: "Verse" },
  { mode: "reading", label: "Reading" },
  { mode: "reading-tr", label: "Translations" },
];

/** Reading-mode segmented control + font scale + Manage translations. */
export function ReaderControls({
  mode,
  onMode,
  scale,
  onScale,
  onManage,
}: {
  mode: ReadingMode;
  onMode: (m: ReadingMode) => void;
  scale: number;
  onScale: (n: number) => void;
  onManage: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {MODES.map(({ mode: m, label }) => (
          <Pressable
            key={m}
            style={[styles.segItem, m === mode && styles.segItemOn]}
            onPress={() => onMode(m)}
          >
            <Text style={[styles.segText, m === mode && styles.segTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.rightRow}>
        <View style={styles.scale}>
          <Pressable
            style={styles.scaleBtn}
            disabled={scale <= MIN_SCALE}
            onPress={() => onScale(scale - 0.1)}
          >
            <Text style={styles.scaleText}>A−</Text>
          </Pressable>
          <Pressable
            style={styles.scaleBtn}
            disabled={scale >= MAX_SCALE}
            onPress={() => onScale(scale + 0.1)}
          >
            <Text style={styles.scaleText}>A+</Text>
          </Pressable>
        </View>
        <Pressable style={styles.manage} onPress={onManage}>
          <Text style={styles.manageText}>⚙ Translations</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 10, marginBottom: 14 },
    segment: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    segItem: { flex: 1, paddingVertical: 9, alignItems: "center", backgroundColor: c.bg },
    segItemOn: { backgroundColor: c.accentSoft },
    segText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    segTextOn: { color: c.accent },
    rightRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    scale: { flexDirection: "row", gap: 8 },
    scaleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    scaleText: { color: c.fg, fontSize: 13, fontWeight: "600" },
    manage: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    manageText: { color: c.accent, fontSize: 13, fontWeight: "600" },
  });
}
